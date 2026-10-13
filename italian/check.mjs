import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { root, inspectPanorama, buildTour, addApprovedPanorama } from './add-approved-panorama.mjs';

const readJSON = async name => JSON.parse(await fs.readFile(path.join(root,name),'utf8'));
const catalog = await readJSON('catalog.json');
const manifest = await readJSON('manifest.json');
const context = { window:{} };
vm.runInNewContext(await fs.readFile(path.join(root,'tour.js'),'utf8'),context);
const tour = JSON.parse(JSON.stringify(context.window.TOUR));
assert.equal(catalog.nodes.length,42);
assert.deepEqual(tour,buildTour(catalog,manifest.nodes));
assert.equal(tour.progress.completed,tour.nodes.length);
assert.equal(tour.progress.expected,42);
assert.equal(tour.start,'floor10_11');
assert.equal(tour.start,catalog.start);
for (const [model,count] of [['floor10',13],['floor11',8]]) {
  const definition = catalog.models[model];
  assert.equal(definition.map.type,'plan-image');
  assert.equal(definition.total_count,count);
  assert.equal(catalog.nodes.filter(n => n.model === model).length,count);
  const bytes = await fs.readFile(path.join(root,definition.map.image));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),definition.map.revision);
  if (definition.map.source_image) {
    const source = await fs.readFile(path.join(root,definition.map.source_image));
    assert.equal(createHash('sha256').update(source).digest('hex'),definition.map.source_revision);
  }
  for (const node of catalog.nodes.filter(n => n.model === model)) {
    assert.ok([node.map_point.u,node.map_point.v].every(value => Number.isFinite(value) && value >= 0 && value <= 1));
    assert.equal(node.x,undefined,'New plan maps must not retain ambiguous meter coordinates.');
    assert.equal(node.y,undefined,'New plan maps must not retain ambiguous meter coordinates.');
  }
}
assert.equal(catalog.nodes.find(n => n.id === 'floor11_07').label,'独立厨房');
assert.match(catalog.models.floor11.map.confirmed_wall.label,/到顶实体/);
assert.ok(catalog.models.floor11.map.confirmed_wall.u > catalog.nodes.find(n => n.id === 'floor11_05').map_point.u,'Keep the corridor passage to the left of the short wall.');
assert.equal(catalog.models.standard.map,undefined,'Rental maps keep the legacy geometry branch.');
assert.equal(catalog.nodes.filter(n => n.model === 'standard').length,21);
assert.equal(new Set(tour.nodes.map(n => n.sha256)).size,tour.nodes.length,'Each published room must have its own image.');
for (const node of manifest.nodes) {
  const bytes = await fs.readFile(path.join(root,node.image));
  const actual = inspectPanorama(bytes,{stylePreview:node.quality_tier === 'STYLE_PREVIEW'});
  for (const key of ['width','height','bytes','sha256']) assert.equal(node[key],actual[key],`${node.id}: ${key}`);
  const original = catalog.nodes.find(n => n.id === node.id);
  const publicNode = tour.nodes.find(n => n.id === node.id);
  if (node.approval_status === 'DRAFT') assert.equal(publicNode,undefined,'Drafts must not appear in the public tour.');
  else {
    for (const key of ['model','unit','x','y','z','label']) assert.equal(publicNode[key],original[key],`${node.id}: location ${key}`);
    assert.deepEqual(publicNode.map_point,original.map_point,`${node.id}: normalized plan point`);
  }
  if (node.approval_status !== 'APPROVED') assert.ok(node.preview_note);
  if (node.quality_tier === 'STYLE_PREVIEW') {
    assert.ok(node.material_note);
    if (node.width < 3840 || node.width % 4) assert.throws(() => inspectPanorama(bytes),/at least 3840/,'Style previews must fail the original HD gate.');
    assert.throws(() => buildTour(catalog,[{...node,quality_tier:'HD',approval_status:'PREVIEW_ACCEPTED'}]),/HD records/);
    assert.equal(buildTour(catalog,[{...node,approval_status:'DRAFT'}]).nodes.length,0);
    const accepted = buildTour(catalog,[{...node,approval_status:'STYLE_PREVIEW_ACCEPTED'}]);
    assert.equal(accepted.nodes.length,1);
    assert.equal(accepted.nodes[0].unit,original.unit,'Style previews preserve their original apartment ownership.');
  }
  if (node.thumbnail) await fs.access(path.join(root,node.thumbnail));
}
assert.equal(buildTour(catalog,[]).progress.completed,0);
assert.equal(buildTour(catalog,[]).models.standard.ready_count,0);
assert.throws(() => buildTour({...catalog,start:'missing'},[]),/Unknown catalog start/);
assert.throws(() => inspectPanorama(Buffer.from('not an original PNG')));
const specimen = manifest.nodes.find(n => n.id === 'standard_02');
if (specimen) {
  assert.throws(() => buildTour(catalog,[specimen,specimen]),/duplicate/);
  assert.throws(() => buildTour(catalog,[{...specimen,id:'missing'}]),/Unknown/);
  assert.throws(() => buildTour(catalog,[{...specimen,image:'../panorama/standard_02.jpg'}]),/Invalid/);
  assert.throws(() => buildTour(catalog,[{...specimen,approval_status:'PREVIEW_ACCEPTED',preview_note:''}]),/visible limitation/);
}
await assert.rejects(() => addApprovedPanorama({}),/Choose/);
await assert.rejects(() => addApprovedPanorama({preview:true}),/visible limitation/);
await assert.rejects(() => addApprovedPanorama({preview:true,note:'sample',yaw:'invalid'}),/finite/);
await assert.rejects(() => addApprovedPanorama({stylePreview:true,note:'sample'}),/room-specific/);
const html = await fs.readFile(path.join(root,'index.html'),'utf8');
const viewer = await fs.readFile(path.join(root,'viewer.js'),'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size,ids.length,'Unique HTML ids');
for (const match of viewer.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(match[1]),`Missing HTML element ${match[1]}`);
for (const name of ['viewer.css','viewer.js','tour.js']) await fs.access(path.join(root,name));
assert.ok(html.includes('统一三维场景') && html.includes('实际像素') && html.includes('不能作为精确测量'));
assert.ok(!/setInterval|VR_TOUR_UPDATE|轻奢|新中式/.test(viewer));
console.log(JSON.stringify({status:'PASS',rooms:tour.nodes.length,drafts:manifest.nodes.filter(n => n.approval_status === 'DRAFT').length,total:42,checks:['manifest/tour agreement','original PNG metadata and SHA','new plan image hashes and normalized points','rental legacy geometry retained','HD gate retained','DRAFT excluded from public tour','preview limitations','reject duplicate/unknown/legacy image records','empty state data','HTML element references'],browser:'NOT RUN'},null,2));
