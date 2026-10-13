import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { root, buildTour } from './add-approved-panorama.mjs';

// Checks state transitions and integer 1:1 copies. This does not execute a GPU
// shader or certify the rendered panorama's visual continuity.
const catalog = JSON.parse(await fs.readFile(path.join(root,'catalog.json'),'utf8'));
const manifest = JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
const source = await fs.readFile(path.join(root,'viewer.js'),'utf8');
const html = await fs.readFile(path.join(root,'index.html'),'utf8');

async function load(record, { failImage = false, actualWidth = record.width, records = [record], hash = '#'+record.id, tourCatalog = catalog } = {}) {
  const copies = [], uploads = [], uniforms = new Map(), frames = [], imageRequests = [];
  const gl = new Proxy({ NO_ERROR:0, getError:() => 0, getParameter:() => 4096,
    getShaderParameter:() => true, getProgramParameter:() => true,
    getAttribLocation:() => 0, getUniformLocation:(_,name) => name,
    uniform1f:(name,value) => uniforms.set(name,value),
    texImage2D:(...args) => { if (args.length === 6) uploads.push([args[5].width,args[5].height]); }
  },{get:(target,key) => key in target ? target[key] : /^[A-Z_0-9]+$/.test(key) ? 1 : () => ({})});
  class Element {
    constructor(tag = 'div') { this.tagName = tag; this.dataset = {}; this.style = {}; this.children = []; this.attributes = {}; this.hidden = false; this.clientHeight = 800; }
    setAttribute(name,value) { this.attributes[name] = String(value); }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    addEventListener() {}
    querySelector() { return this.children[0] ||= new Element('span'); }
    getContext(type) { return type === 'webgl' ? gl : {drawImage:(...args) => copies.push(args.slice(1))}; }
  }
  const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m => [m[1],new Element()]));
  const tour = buildTour(tourCatalog,records);
  vm.runInNewContext(source,{
    window:{TOUR:tour}, document:{getElementById:id => elements[id],createElement:tag => new Element(tag),createElementNS:(_,tag) => new Element(tag),body:{classList:{toggle:() => true}}},
    Image:class { set src(value) { imageRequests.push(value); this.naturalWidth = actualWidth; this.naturalHeight = record.height; queueMicrotask(() => failImage ? this.onerror() : this.onload()); } },
    location:{hash},history:{replaceState(){}},addEventListener(){},requestAnimationFrame:fn => frames.push(fn),
    devicePixelRatio:1,innerWidth:1200,innerHeight:800
  });
  await new Promise(resolve => setImmediate(resolve));
  frames.shift()(100);
  return {elements,copies,uploads,uniforms,imageRequests};
}

const originalURL = item => item.image + '?v=' + encodeURIComponent(item.revision || item.sha256);

const hd = manifest.nodes.find(n => n.id === 'standard_02');
const hdResult = await load(hd);
assert.equal(hdResult.elements.view.dataset.sourcePixels,'3840×1920');
assert.equal(hdResult.uniforms.get('stripCount'),4);
assert.equal(hdResult.uploads.length,4);
assert.equal(hdResult.elements.map.children[0].dataset.mapType,'legacy-walls');
assert.equal(hdResult.elements.map.children[0].attributes.viewBox,'-0.5 -0.5 13.1 22.5');
assert.equal(hdResult.elements.planOriginal.hidden,true);
assert.equal(hdResult.elements.map.children[0].children.find(e => e.tagName === 'circle').attributes.cx,String(catalog.nodes.find(n => n.id === hd.id).x));
const rentalPoint = hdResult.elements.map.children[0].children.find(e => e.tagName === 'circle');
for (const attribute of ['stroke','stroke-width','pointer-events']) assert.equal(rentalPoint.attributes[attribute],undefined,'Rental hit areas remain unchanged.');
assert.equal(rentalPoint.attributes.r,'0.36');
for (const item of manifest.nodes.filter(n => n.quality_tier === 'STYLE_PREVIEW')) {
  const accepted = {...item,approval_status:'STYLE_PREVIEW_ACCEPTED'};
  const result = await load(accepted);
  assert.equal(result.elements.view.dataset.sourcePixels,`${item.width}×${item.height}`);
  assert.equal(result.elements.view.dataset.loaded,'true');
  assert.match(result.elements.qualityBadge.textContent,/内置模型风格预览.*未达4K/);
  assert.equal(result.elements.materialNote.textContent,item.material_note);
  assert.equal(result.elements.original.href,originalURL(item));
  assert.equal(result.elements.download.href,originalURL(item));
  assert.deepEqual(result.imageRequests,[originalURL(item)]);
  const count = item.width % 4 ? 2 : 4;
  assert.equal(result.uniforms.get('stripCount'),count);
  assert.deepEqual(result.uploads,Array.from({length:count},() => [item.width/count+2,item.height]));
  for (const [sx,sy,sw,sh,dx,dy,dw,dh] of result.copies) {
    assert.ok([sx,sy,sw,sh,dx,dy,dw,dh].every(Number.isInteger),'No fractional copy rectangles');
    assert.equal(sw,dw,'No horizontal resampling'); assert.equal(sh,dh,'No vertical resampling');
  }
  const failure = await load(accepted,{failImage:true});
  assert.equal(failure.elements.view.hidden,true);
  assert.equal(failure.elements.view.dataset.loaded,'false');
  assert.match(failure.elements.error.textContent,/完整原图读取失败/);
  assert.equal(failure.elements.zoomIn.disabled,true);
  assert.equal(failure.elements.original.href,originalURL(item));
  const mismatch = await load(accepted,{actualWidth:item.width+2});
  assert.match(mismatch.elements.error.textContent,/实际尺寸与导入记录不一致/);
  assert.equal(mismatch.uploads.length,0);
}
const living = manifest.nodes.find(n => n.id === 'floor10_11');
const hall = manifest.nodes.find(n => n.id === 'floor10_12');
const defaultResult = await load(living,{hash:'',records:[living,hall]});
assert.equal(defaultResult.elements.view.dataset.scene,'floor10_11','An unbookmarked visit uses catalog.start.');
const planSVG = defaultResult.elements.map.children[0];
assert.equal(planSVG.dataset.mapType,'plan-image');
assert.equal(planSVG.attributes.viewBox,'0 0 768 1024');
assert.equal(planSVG.attributes.preserveAspectRatio,'xMidYMid meet');
assert.equal(planSVG.children.filter(e => e.tagName === 'line').length,0,'New plans must not overlay legacy walls.');
const planImage = planSVG.children.find(e => e.tagName === 'image');
assert.equal(planImage.attributes.width,'768');
assert.equal(planImage.attributes.height,'1024');
assert.equal(planImage.attributes.href,catalog.models.floor10.map.image+'?v='+catalog.models.floor10.map.revision);
assert.equal(defaultResult.elements.planOriginal.hidden,false);
assert.match(defaultResult.elements.mapNote.textContent,/不代表米制测量/);
const hallPoint = planSVG.children.find(e => e.dataset.scene === hall.id);
const hallLocation = catalog.nodes.find(n => n.id === hall.id);
assert.equal(Number(hallPoint.attributes.cx),hallLocation.map_point.u*768);
assert.equal(Number(hallPoint.attributes.cy),hallLocation.map_point.v*1024);
for (const point of planSVG.children.filter(e => e.tagName === 'circle')) {
  assert.equal(point.attributes.stroke,'transparent');
  assert.equal(point.attributes['pointer-events'],'all');
  const selected = point.attributes['aria-pressed'] === 'true';
  assert.equal(Number(point.attributes.r),768*(selected ? .012 : .009),'The visible circle stays small.');
  const hitDiameter = (2*Number(point.attributes.r)+Number(point.attributes['stroke-width']))/768*270;
  assert.ok(hitDiameter >= 16 && hitDiameter <= 22,'A 270px-wide plan has a 16–22px hit diameter.');
}
await hallPoint.onclick();
assert.equal(defaultResult.elements.view.dataset.scene,hall.id,'Map point click enters its room.');

// This fixture verifies the new kitchen route before its reviewed image is imported.
const kitchen = {...living,id:'floor11_07',image:'panoramas/floor11_07.png'};
const kitchenResult = await load(kitchen);
assert.equal(kitchenResult.elements.view.dataset.scene,'floor11_07');
assert.match(kitchenResult.elements.roomName.textContent,/独立厨房/);
assert.equal(kitchenResult.elements.map.children[0].attributes.viewBox,'0 0 1302 1736');
const confirmedWall = kitchenResult.elements.map.children[0].children.find(e => e.dataset.annotation === 'confirmed-full-height-wall');
assert.ok(confirmedWall,'The user-confirmed solid wall must appear on the 11th-floor map.');
assert.equal(Number(confirmedWall.attributes.x),616);
assert.equal(Number(confirmedWall.attributes.y),632);
assert.equal(Number(confirmedWall.attributes.width),124);
assert.equal(Number(confirmedWall.attributes.height),38);
assert.match(kitchenResult.elements.planOriginal.href,/floor11-labeled\.png\?v=/);
const broken = structuredClone(catalog);
broken.nodes.find(n => n.id === 'floor11_07').map_point.u = 1.2;
assert.throws(() => buildTour(broken,[kitchen]),/Invalid normalized plan point/);
const staleLocation = buildTour(catalog,[{...kitchen,map_point:{u:0,v:0},x:99,y:99}]).nodes[0];
assert.deepEqual(staleLocation.map_point,catalog.nodes.find(n => n.id === 'floor11_07').map_point,'The catalog owns map coordinates.');
assert.equal(staleLocation.x,undefined);
assert.equal(staleLocation.y,undefined);
console.log(JSON.stringify({status:'PASS',hdCases:1,stylePreviewCases:manifest.nodes.filter(n => n.quality_tier === 'STYLE_PREVIEW').length,mapCases:['rental legacy','floor10 normalized image','floor11 new kitchen fixture','map click navigation','catalog start','image revision URLs'],browserGpuVisualRendering:'NOT RUN'},null,2));
