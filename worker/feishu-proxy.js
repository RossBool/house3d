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
        return json(env, { ok: f.ok, fieldsCreated: f.created, fieldsTotal: f.total, msg: f.msg || '' });
      }

      const token = await tenantToken(env);
      const base = `${FEISHU}/bitable/v1/apps/${env.BITABLE_APP_TOKEN}/tables/${env.TABLE_ID}/records`;

      if (url.pathname === '/note' && req.method === 'POST') {
        const b = await req.json();
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
        const r = await fetch(base, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        });
        const j = await r.json();
        return json(env, j, j.code === 0 ? 200 : 400);
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
        return json(env, j, j.code === 0 ? 200 : 400);
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
          return {
            id: txt(f['批注ID']), remote: true, recordId: it.record_id,
            floorName: txt(f['楼层']), obj: txt(f['对象']), kind: txt(f['类型']),
            cat: txt(f['类别']), text: txt(f['意见']),
            coords: coords.length === 2 ? coords : [0, 0],
            cam: null, imgUrl: att ? att.url || att.tmp_url : '',
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
