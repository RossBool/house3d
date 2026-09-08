/* ============================================================
   周湍淇住宅楼 · 批注同步代理（Cloudflare Worker）
   职责：把网页批注写入飞书多维表格，并把表格内容回传给网页。
   密钥只存在于 Worker 环境变量，绝不进前端。

   环境变量（Worker Settings → Variables and Secrets）：
     FEISHU_APP_ID       自建应用 App ID      （cli_xxx）
     FEISHU_APP_SECRET   自建应用 App Secret
     BITABLE_APP_TOKEN   多维表格 app_token   （URL /base/ 后面那段）
     TABLE_ID            数据表 table_id      （URL ?table= 参数）
     ALLOW_ORIGIN        允许的前端来源（默认 https://rossbool.github.io）
     GITHUB_TOKEN        （可选）细粒度 PAT：Issues 读写 + Contents 读写，配了才同步 GitHub Issues
     GITHUB_REPO         （可选）默认 RossBool/house3d

   路由：
     POST /note          新增/更新一条批注
     GET  /notes?since=  拉取批注（since 为毫秒时间戳，可选）
     POST /status        更新批注状态
     GET  /health        健康检查

   数据表字段（名称必须一致）：
     批注ID(文本) 楼层(文本) 对象(文本) 类型(文本) 类别(单选)
     意见(多行文本) 坐标(文本) 视角(文本) 署名(文本) 状态(单选)
     缩略图(附件) 时间(日期)
   ============================================================ */

const FEISHU = 'https://open.feishu.cn/open-apis';
let tokenCache = { v: '', exp: 0 };

async function tenantToken(env) {
  const now = Date.now();
  if (tokenCache.v && now < tokenCache.exp) return tokenCache.v;
  const r = await fetch(`${FEISHU}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
  });
  const j = await r.json();
  if (j.code !== 0) throw new Error('token failed: ' + JSON.stringify(j));
  tokenCache = { v: j.tenant_access_token, exp: now + (j.expire - 300) * 1000 };
  return tokenCache.v;
}

const cors = env => ({
  'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || 'https://rossbool.github.io',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
});

const json = (env, data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors(env) } });

/* 缩略图（dataURL）→ 飞书素材 → 附件 file_token */
async function uploadThumb(env, token, dataUrl, name) {
  const m = /^data:image\/(\w+);base64,(.*)$/.exec(dataUrl || '');
  if (!m) return null;
  const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
  const fd = new FormData();
  fd.append('file_name', `${name}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`);
  fd.append('parent_type', 'bitable_image');
  fd.append('parent_node', env.BITABLE_APP_TOKEN);
  fd.append('size', String(bytes.length));
  fd.append('file', new Blob([bytes], { type: `image/${m[1]}` }), `${name}.jpg`);
  const r = await fetch(`${FEISHU}/drive/v1/medias/upload_all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const j = await r.json();
  return j.code === 0 ? j.data.file_token : null;
}

/* 数据表字段定义：/health 会自动补齐缺失字段（含单选选项），无需手工建表头 */
const SCHEMA = [
  { field_name: '批注ID', type: 1 },
  { field_name: '楼层', type: 1 },
  { field_name: '对象', type: 1 },
  { field_name: '类型', type: 1 },
  { field_name: '类别', type: 3, property: { options: [{ name: '位置' }, { name: '朝向' }, { name: '尺寸' }, { name: '材质' }, { name: '增删' }, { name: '其他' }] } },
  { field_name: '意见', type: 1 },
  { field_name: '坐标', type: 1 },
  { field_name: '视角', type: 1 },
  { field_name: '署名', type: 1 },
  { field_name: '状态', type: 3, property: { options: [{ name: '待处理' }, { name: '已改' }, { name: '驳回' }] } },
  { field_name: '缩略图', type: 17 },
  { field_name: '时间', type: 5 },
];
async function ensureFields(env, token) {
  const url = `${FEISHU}/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${env.TABLE_ID}/fields`;
  const r = await fetch(`${url}?page_size=100`, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json();
  if (j.code !== 0) return { ok: false, msg: j.msg, created: [] };
  const have = new Set((j.data?.items || []).map(f => f.field_name));
  const created = [];
  for (const f of SCHEMA) {
    if (have.has(f.field_name)) continue;
    const cr = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    });
    const cj = await cr.json();
    created.push(f.field_name + (cj.code === 0 ? ' ✓' : ` ✗ ${cj.msg}`));
  }
  return { ok: true, created, total: SCHEMA.length };
}
/* ---------- 批注审查（确定性规则，判定无意义/恶意内容 → 自动驳回并关单） ---------- */
function judgeNote(text) {
  const t = String(text || '').trim();
  if (t.length < 2) return { bad: true, reason: '内容过短（少于 2 个字符）' };
  const letters = (t.match(/[\u4e00-\u9fa5a-zA-Z]/g) || []).length;
  if (letters === 0) return { bad: true, reason: '无有效文字（纯数字或符号）' };
  const freq = {};
  for (const ch of t) freq[ch] = (freq[ch] || 0) + 1;
  const max = Math.max(...Object.values(freq));
  if (max / t.length > 0.6) return { bad: true, reason: '内容为重复字符' };
  if (letters / t.length < 0.25) return { bad: true, reason: '有效文字占比过低' };
  const inject = /(忽略(之前|以上|前面).{0,6}(指令|提示)|ignore\s+(previous|above)|system\s*prompt|执行(以下|下面)命令|rm\s+-rf|删除(仓库|数据库)|(^|\s)curl\s+http|powershell|base64\s+-d)/i;
  if (inject.test(t)) return { bad: true, reason: '疑似指令注入 / 与模型审查无关的内容' };
  return { bad: false, reason: '' };
}
/* ---------- GitHub Issues 同步（配了 GITHUB_TOKEN 才启用） ---------- */
const ghRepo = env => env.GITHUB_REPO || 'RossBool/house3d';
const ghOn = env => !!(env.GITHUB_TOKEN && env.GITHUB_TOKEN.length > 10);
async function ghApi(env, path, init = {}) {
  const r = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'house3d-note-proxy',
      ...(init.headers || {}),
    },
  });
  const txt = await r.text();
  let j = null; try { j = JSON.parse(txt); } catch (e) { }
  return { ok: r.ok, status: r.status, j, txt };
}
/* 缩略图提交到仓库 notes-img/ 下，便于 Issue 里内嵌显示 */
async function ghUploadImg(env, id, dataUrl) {
  const m = /^data:image\/(\w+);base64,(.*)$/.exec(dataUrl || '');
  if (!m) return null;
  const path = `notes-img/${id}.jpg`;
  const url = `https://api.github.com/repos/${ghRepo(env)}/contents/${path}`;
  let sha;
  const cur = await ghApi(env, `/repos/${ghRepo(env)}/contents/${path}`);
  if (cur.ok && cur.j) sha = cur.j.sha;
  const body = { message: `note img: ${id}`, content: m[2], ...(sha ? { sha } : {}) };
  const r = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'house3d-note-proxy', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) return null;
  return `https://raw.githubusercontent.com/${ghRepo(env)}/main/${path}`;
}
async function ghEnsureLabel(env, name, color) {
  await ghApi(env, `/repos/${ghRepo(env)}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });   // 已存在会返回 422，忽略
}
async function ghCreateIssue(env, b, imgUrl, verdict) {
  await ghEnsureLabel(env, '批注', 'b5442d');
  await ghEnsureLabel(env, b.cat || '其他', 'd9d2c0');
  const body = [
    `**类别**：${b.cat || '-'}　**楼层**：${b.floorName || b.floor}　**对象**：${b.obj}（${b.kind || '-'}）`,
    '',
    b.text || '',
    '',
    `- 位置：x${b.coords ? b.coords[0] : '-'} y${b.coords ? b.coords[1] : '-'}${b.region ? `　区域 ${b.region.w.toFixed(1)}×${b.region.h.toFixed(1)}m` : ''}`,
    b.cam ? `- 视角：(${b.cam.p.join(',')}) → (${b.cam.t.join(',')})` : '',
    `- 提出：${b.author || '匿名'} ${b.ts || ''}`,
    `- 批注ID：\`${b.id}\`　（在模型页点该批注的「定位」可精确复现位置）`,
    imgUrl ? `\n![缩略图](${imgUrl})` : '',
  ].filter(Boolean).join('\n');
  const r = await ghApi(env, `/repos/${ghRepo(env)}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `[批注] ${b.floorName || b.floor} · ${b.obj} · ${b.cat || ''}`.trim(),
      body,
      labels: ['批注', b.cat || '其他'],
    }),
  });
  if (!r.ok) return { error: r.status, msg: r.j && r.j.message };
  const out = { number: r.j.number, url: r.j.html_url };
  if (verdict && verdict.bad) {
    await ghApi(env, `/repos/${ghRepo(env)}/issues/${r.j.number}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: `🤖 自动审查未通过：**${verdict.reason}**\n该批注不作为修改依据，已自动关闭。` }),
    });
    await ghApi(env, `/repos/${ghRepo(env)}/issues/${r.j.number}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'closed', labels: ['批注', b.cat || '其他', '疑似无效'] }),
    });
    out.closed = true;
  }
  return out;
}
async function ghFindIssue(env, noteId) {
  const q = encodeURIComponent(`repo:${ghRepo(env)} is:issue "批注ID" "${noteId}"`);
  const r = await ghApi(env, `/search/issues?q=${q}`);
  return r.ok && r.j && r.j.items && r.j.items[0] ? r.j.items[0] : null;
}
async function ghSetIssueState(env, noteId, state) {
  const it = await ghFindIssue(env, noteId);
  if (!it) return { error: 'not found' };
  const r = await ghApi(env, `/repos/${ghRepo(env)}/issues/${it.number}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  });
  return r.ok ? { number: it.number, state } : { error: r.status };
}
const F = (v) => (v === undefined || v === null ? '' : v);

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) });

    try {
      if (url.pathname === '/health') {
        const token0 = await tenantToken(env);
        if (!env.BITABLE_APP_TOKEN || !env.TABLE_ID) return json(env, { ok: false, msg: 'BITABLE_APP_TOKEN / TABLE_ID 未配置' }, 400);
        const f = await ensureFields(env, token0);
        let gh = { enabled: ghOn(env) };
        if (ghOn(env)) {
          const me = await ghApi(env, `/repos/${ghRepo(env)}`);
          gh = { enabled: true, repo: ghRepo(env), accessible: me.ok, msg: me.ok ? '' : (me.j && me.j.message) };
        }
        return json(env, { ok: f.ok, fieldsCreated: f.created, fieldsTotal: f.total, msg: f.msg || '', github: gh });
      }

      const token = await tenantToken(env);
      const base = `${FEISHU}/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${env.TABLE_ID}/records`;

      if (url.pathname === '/note' && req.method === 'POST') {
        const b = await req.json();
        const verdict = judgeNote(b.text);
        if (verdict.bad) b.status = '驳回';               // 无意义/恶意 → 直接驳回（联动关单）
        const fields = {
          '批注ID': F(b.id),
          '楼层': F(b.floorName || b.floor),
          '对象': F(b.obj),
          '类型': F(b.kind),
          '类别': F(b.cat),
          '意见': F(b.text),
          '坐标': b.coords ? `x${b.coords[0]} y${b.coords[1]}` : '',
          '视角': b.cam ? `(${b.cam.p.join(',')})→(${b.cam.t.join(',')})` : '',
          '署名': F(b.author),
          '状态': F(b.status || '待处理'),
          '时间': b.ts ? Date.parse(b.ts.replace(/-/g, '/')) || Date.now() : Date.now(),
        };
        if (b.img) {
          const ft = await uploadThumb(env, token, b.img, F(b.id));
          if (ft) fields['缩略图'] = [{ file_token: ft }];
        }
        /* 按 批注ID 去重：已存在则更新（upsert），避免重复行 */
        const q = await fetch(`${base}/search`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ filter: { conjunction: 'and', conditions: [{ field_name: '批注ID', operator: 'is', value: [b.id] }] } }),
        });
        const qj = await q.json();
        const exist = qj?.data?.items?.[0];
        const r = await fetch(exist ? `${base}/${exist.record_id}` : base, {
          method: exist ? 'PUT' : 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        });
        const j = await r.json();
        let issue = null;
        if (j.code === 0 && ghOn(env)) {
          // 该批注尚无 Issue 就补建（重推即幂等，可用于历史批注回填）
          const found = await ghFindIssue(env, b.id).catch(() => null);
          if (!found) {
            let imgUrl = null;
            if (b.img) imgUrl = await ghUploadImg(env, b.id, b.img).catch(() => null);
            issue = await ghCreateIssue(env, b, imgUrl, verdict).catch(e => ({ error: String(e) }));
          } else {
            issue = { number: found.number, url: found.html_url, existed: true };
            if (verdict && verdict.bad && found.state === 'open') {   // 已存在的单子若判为无效，也关掉
              await ghApi(env, `/repos/${ghRepo(env)}/issues/${found.number}/comments`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: `🤖 自动审查未通过：**${verdict.reason}**\n该批注不作为修改依据，已自动关闭。` }),
              });
              await ghApi(env, `/repos/${ghRepo(env)}/issues/${found.number}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: 'closed', labels: ['批注', b.cat || '其他', '疑似无效'] }),
              });
              issue.closed = true;
            }
          }
        }
        return json(env, { ...j, upsert: exist ? 'updated' : 'created', issue, verdict }, j.code === 0 ? 200 : 400);
      }

      if (url.pathname === '/status' && req.method === 'POST') {
        const b = await req.json();
        // 先按 批注ID 找到 record_id
        const q = await fetch(`${base}/search`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ filter: { conjunction: 'and', conditions: [{ field_name: '批注ID', operator: 'is', value: [b.id] }] } }),
        });
        const qj = await q.json();
        const rec = qj?.data?.items?.[0];
        if (!rec) return json(env, { ok: false, msg: 'record not found' }, 404);
        const r = await fetch(`${base}/${rec.record_id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { '状态': b.status } }),
        });
        const j = await r.json();
        let issue = null;
        if (j.code === 0 && ghOn(env)) {
          issue = await ghSetIssueState(env, b.id, b.status === '已改' || b.status === '驳回' ? 'closed' : 'open').catch(e => ({ error: String(e) }));
        }
        return json(env, { ...j, issue }, j.code === 0 ? 200 : 400);
      }

      if (url.pathname === '/notes' && req.method === 'GET') {
        const since = Number(url.searchParams.get('since') || 0);
        const r = await fetch(`${base}/search?page_size=200`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort: [{ field_name: '时间', desc: true }] }),
        });
        const j = await r.json();
        if (j.code !== 0) return json(env, j, 400);
        const notes = (j.data?.items || []).map(it => {
          const f = it.fields || {};
          const txt = v => Array.isArray(v) ? v.map(x => x.text || x.name || '').join('') : (v?.text || v || '');
          const att = Array.isArray(f['缩略图']) && f['缩略图'][0] ? f['缩略图'][0] : null;
          const coords = String(txt(f['坐标']) || '').replace(/[xy]/g, '').trim().split(/\s+/).map(Number);
          /* 视角文本形如 "(21,42.9,30)→(5.3,27.4,9.5)"，解析回相机位姿，云端批注也能精确复现视角 */
          let cam = null;
          const vm = /\(([^)]+)\)\s*→\s*\(([^)]+)\)/.exec(String(txt(f['视角']) || ''));
          if (vm) {
            const p = vm[1].split(',').map(Number), t = vm[2].split(',').map(Number);
            if (p.length === 3 && t.length === 3 && p.every(n => !isNaN(n)) && t.every(n => !isNaN(n))) cam = { p, t };
          }
          return {
            id: txt(f['批注ID']), remote: true, recordId: it.record_id,
            floorName: txt(f['楼层']), obj: txt(f['对象']), kind: txt(f['类型']),
            cat: txt(f['类别']), text: txt(f['意见']),
            coords: coords.length === 2 ? coords : [0, 0],
            cam, imgUrl: att ? att.url || att.tmp_url : '',
            author: txt(f['署名']), status: txt(f['状态']) || '待处理',
            ts: f['时间'] ? new Date(Number(f['时间'])).toISOString().slice(0, 16).replace('T', ' ') : '',
          };
        }).filter(n => n.id && (!since || Date.parse(n.ts.replace(/-/g, '/')) >= since));
        return json(env, { ok: true, notes });
      }

      return json(env, { ok: false, msg: 'not found' }, 404);
    } catch (e) {
      return json(env, { ok: false, msg: String(e && e.message || e) }, 500);
    }
  },
};
