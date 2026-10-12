import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { root, inspectPanorama, buildTour, addApprovedPanorama } from './add-approved-panorama.mjs';

const readJSON = async name => JSON.parse(await fs.readFile(path.join(root,name),'utf8'));
const catalog = await readJSON('catalog.json');
const manifest = await readJSON('manifest.json');
const context = { window:{} };
vm.runInNewContext(await fs.readFile(path.join(root,'tour.js'),'utf8'),context);
const tour = JSON.parse(JSON.stringify(context.window.TOUR));
assert.equal(catalog.nodes.length,41);
assert.deepEqual(tour,buildTour(catalog,manifest.nodes));
assert.equal(tour.progress.completed,tour.nodes.length);
assert.equal(tour.progress.expected,41);
assert.equal(tour.start,'standard_02');
assert.equal(new Set(tour.nodes.map(n => n.sha256)).size,tour.nodes.length,'Each published room must have its own image.');
for (const node of tour.nodes) {
  const bytes = await fs.readFile(path.join(root,node.image));
  const actual = inspectPanorama(bytes);
  for (const key of ['width','height','bytes','sha256']) assert.equal(node[key],actual[key],`${node.id}: ${key}`);
  const original = catalog.nodes.find(n => n.id === node.id);
  for (const key of ['model','unit','x','y','z']) assert.equal(node[key],original[key],`${node.id}: location ${key}`);
  if (node.approval_status === 'PREVIEW_ACCEPTED') assert.ok(node.preview_note);
  if (node.thumbnail) await fs.access(path.join(root,node.thumbnail));
}
assert.equal(buildTour(catalog,[]).progress.completed,0);
assert.equal(buildTour(catalog,[]).models.standard.ready_count,0);
assert.throws(() => inspectPanorama(Buffer.from('not an original PNG')));
const specimen = manifest.nodes[0];
if (specimen) {
  assert.throws(() => buildTour(catalog,[specimen,specimen]),/duplicate/);
  assert.throws(() => buildTour(catalog,[{...specimen,id:'missing'}]),/Unknown/);
  assert.throws(() => buildTour(catalog,[{...specimen,image:'../panorama/standard_02.jpg'}]),/Invalid/);
  assert.throws(() => buildTour(catalog,[{...specimen,approval_status:'PREVIEW_ACCEPTED',preview_note:''}]),/visible limitation/);
}
await assert.rejects(() => addApprovedPanorama({}),/Choose/);
await assert.rejects(() => addApprovedPanorama({preview:true}),/visible limitation/);
await assert.rejects(() => addApprovedPanorama({preview:true,note:'sample',yaw:'invalid'}),/finite/);
const html = await fs.readFile(path.join(root,'index.html'),'utf8');
const viewer = await fs.readFile(path.join(root,'viewer.js'),'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size,ids.length,'Unique HTML ids');
for (const match of viewer.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(match[1]),`Missing HTML element ${match[1]}`);
for (const name of ['viewer.css','viewer.js','tour.js']) await fs.access(path.join(root,name));
assert.ok(html.includes('门边接痕仍在修整'));
assert.ok(!/setInterval|VR_TOUR_UPDATE|轻奢|新中式/.test(viewer));
console.log(JSON.stringify({status:'PASS',rooms:tour.nodes.length,total:41,checks:['manifest/tour agreement','original PNG metadata and SHA','catalog geometry','preview limitations','reject duplicate/unknown/legacy image records','empty state data','HTML element references'],browser:'NOT RUN'},null,2));
