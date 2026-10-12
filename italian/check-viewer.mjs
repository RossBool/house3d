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

async function load(record, { failImage = false, actualWidth = record.width } = {}) {
  const copies = [], uploads = [], uniforms = new Map(), frames = [];
  const gl = new Proxy({ NO_ERROR:0, getError:() => 0, getParameter:() => 4096,
    getShaderParameter:() => true, getProgramParameter:() => true,
    getAttribLocation:() => 0, getUniformLocation:(_,name) => name,
    uniform1f:(name,value) => uniforms.set(name,value),
    texImage2D:(...args) => { if (args.length === 6) uploads.push([args[5].width,args[5].height]); }
  },{get:(target,key) => key in target ? target[key] : /^[A-Z_0-9]+$/.test(key) ? 1 : () => ({})});
  class Element {
    constructor(tag = 'div') { this.tagName = tag; this.dataset = {}; this.style = {}; this.children = []; this.attributes = {}; this.hidden = false; this.clientHeight = 800; }
    setAttribute(name,value) { this.attributes[name] = value; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    addEventListener() {}
    querySelector() { return this.children[0] ||= new Element('span'); }
    getContext(type) { return type === 'webgl' ? gl : {drawImage:(...args) => copies.push(args.slice(1))}; }
  }
  const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m => [m[1],new Element()]));
  const tour = buildTour(catalog,[record]);
  vm.runInNewContext(source,{
    window:{TOUR:tour}, document:{getElementById:id => elements[id],createElement:tag => new Element(tag),createElementNS:(_,tag) => new Element(tag),body:{classList:{toggle:() => true}}},
    Image:class { set src(_) { this.naturalWidth = actualWidth; this.naturalHeight = record.height; queueMicrotask(() => failImage ? this.onerror() : this.onload()); } },
    location:{hash:'#'+record.id},history:{replaceState(){}},addEventListener(){},requestAnimationFrame:fn => frames.push(fn),
    devicePixelRatio:1,innerWidth:1200,innerHeight:800
  });
  await new Promise(resolve => setImmediate(resolve));
  frames.shift()(100);
  return {elements,copies,uploads,uniforms};
}

const hd = manifest.nodes.find(n => n.id === 'standard_02');
const hdResult = await load(hd);
assert.equal(hdResult.elements.view.dataset.sourcePixels,'3840×1920');
assert.equal(hdResult.uniforms.get('stripCount'),4);
assert.equal(hdResult.uploads.length,4);
for (const item of manifest.nodes.filter(n => n.quality_tier === 'STYLE_PREVIEW')) {
  const accepted = {...item,approval_status:'STYLE_PREVIEW_ACCEPTED'};
  const result = await load(accepted);
  assert.equal(result.elements.view.dataset.sourcePixels,`${item.width}×${item.height}`);
  assert.equal(result.elements.view.dataset.loaded,'true');
  assert.match(result.elements.qualityBadge.textContent,/内置模型风格预览.*未达4K/);
  assert.equal(result.elements.materialNote.textContent,item.material_note);
  assert.equal(result.elements.original.href,item.image);
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
  assert.equal(failure.elements.original.href,item.image);
  const mismatch = await load(accepted,{actualWidth:item.width+2});
  assert.match(mismatch.elements.error.textContent,/实际尺寸与导入记录不一致/);
  assert.equal(mismatch.uploads.length,0);
}
console.log(JSON.stringify({status:'PASS',hdCases:1,stylePreviewCases:manifest.nodes.filter(n => n.quality_tier === 'STYLE_PREVIEW').length,browserGpuVisualRendering:'NOT RUN'},null,2));
