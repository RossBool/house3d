/* 本地 mock：模拟 worker/feishu-proxy.js 的接口，用于联调前端同步链路 */
const http = require('http');
const store = [
  {
    id: 'seed-remote-1', remote: true, recordId: 'rec1',
    floorName: '七层平面图', obj: '双人床', kind: 'bed', cat: '朝向',
    text: '（他人批注示例）床头应该贴北墙，现在离墙 0.7m', coords: [5.35, -0.14],
    cam: null, imgUrl: '', author: '李工', status: '待处理', ts: '2026-09-08 11:20',
  },
];
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const send = o => { res.writeHead(200, { 'Content-Type': 'application/json', ...cors }); res.end(JSON.stringify(o)); };
    if (req.url.startsWith('/health')) return send({ ok: true });
    if (req.url.startsWith('/note') && req.method === 'POST') {
      const b = JSON.parse(body || '{}');
      console.log('[mock] 收到批注:', b.floorName, '·', b.obj, '·', b.cat, '·', b.author, '· img', b.img ? (b.img.length / 1024).toFixed(0) + 'KB' : '无');
      store.unshift({ ...b, remote: true, recordId: 'rec' + Date.now() });
      return send({ code: 0, data: { record: { record_id: 'rec' + Date.now() } } });
    }
    if (req.url.startsWith('/status') && req.method === 'POST') {
      const b = JSON.parse(body || '{}');
      const t = store.find(x => x.id === b.id); if (t) t.status = b.status;
      console.log('[mock] 状态回写:', b.id, '→', b.status);
      return send({ code: 0 });
    }
    if (req.url.startsWith('/notes')) {
      console.log('[mock] 拉取批注，返回', store.length, '条');
      return send({ ok: true, notes: store });
    }
    res.writeHead(404, cors); res.end('{}');
  });
}).listen(8901, () => console.log('mock feishu proxy on http://localhost:8901'));
