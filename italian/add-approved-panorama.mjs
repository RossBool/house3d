import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const root = path.dirname(fileURLToPath(import.meta.url));
const pngMagic = Buffer.from([137,80,78,71,13,10,26,10]);

export function inspectPanorama(bytes) {
  if (bytes.length < 33 || !bytes.subarray(0,8).equals(pngMagic) || bytes.toString('ascii',12,16) !== 'IHDR') {
    throw Error('Expected an original PNG file, not a renamed JPEG or preview.');
  }
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width < 3840 || width !== height * 2 || width % 4) {
    throw Error(`Expected a 2:1 PNG at least 3840 pixels wide, divisible by 4; received ${width}×${height}.`);
  }
  return { width, height, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export function buildTour(catalog, approvedNodes) {
  const ids = new Set();
  const lookup = new Map(catalog.nodes.map(n => [n.id,n]));
  const nodes = approvedNodes.map(node => {
    const location = lookup.get(node.id);
    if (!location || ids.has(node.id)) throw Error('Unknown or duplicate approved node: ' + node.id);
    if (node.image !== `panoramas/${node.id}.png` || !['APPROVED','PREVIEW_ACCEPTED'].includes(node.approval_status)) throw Error('Invalid reviewed image record: ' + node.id);
    if (node.approval_status === 'PREVIEW_ACCEPTED' && !node.preview_note) throw Error('Preview records require a visible limitation note.');
    ids.add(node.id);
    return { ...location, ...node, model: location.model, unit: location.unit, label: location.label };
  }).sort((a,b) => a.id.localeCompare(b.id));
  const models = structuredClone(catalog.models);
  for (const [id,model] of Object.entries(models)) {
    model.ready_count = nodes.filter(n => n.model === id).length;
    for (const [unit,count] of Object.entries(model.units)) count.ready = nodes.filter(n => n.model === id && n.unit === unit).length;
  }
  return { models, nodes, start: 'standard_02', style: '意式现代', progress: { completed: nodes.length, expected: catalog.nodes.length, status: nodes.length ? (nodes.length === catalog.nodes.length ? 'COMPLETE' : 'PARTIAL') : 'WAITING_FOR_APPROVED_IMAGES' } };
}

async function atomicWrite(file, contents) {
  const temporary = file + `.import-${process.pid}.tmp`;
  try { await fs.writeFile(temporary, contents, { flag:'wx' }); await fs.rename(temporary, file); }
  finally { await fs.unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
}

export async function addApprovedPanorama({ id, image, approved, preview, note, yaw, pitch, thumbnail, replace = false }) {
  if ((approved === true) === (preview === true)) throw Error('Choose --approved after acceptance, or --preview with --note for a reviewed preview. This script does not certify image quality.');
  if (preview && !note?.trim()) throw Error('--preview requires a visible limitation in --note.');
  if (yaw !== undefined && !Number.isFinite(Number(yaw))) throw Error('--yaw must be a finite number.');
  if (pitch !== undefined && (!Number.isFinite(Number(pitch)) || Math.abs(Number(pitch)) > 1.5)) throw Error('--pitch must be within -1.5 to 1.5 radians.');
  const catalog = JSON.parse(await fs.readFile(path.join(root,'catalog.json'),'utf8'));
  const location = catalog.nodes.find(n => n.id === id);
  if (!location) throw Error('Unknown room ID: ' + id);
  if (!image) throw Error('--image is required.');
  const bytes = await fs.readFile(path.resolve(image));
  const info = inspectPanorama(bytes);
  const lockPath = path.join(root,'.import.lock');
  let lock;
  try { lock = await fs.open(lockPath,'wx'); }
  catch (error) { if (error.code === 'EEXIST') throw Error('Another import is active. Finish it before retrying.'); throw error; }
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
    buildTour(catalog,manifest.nodes);
    const previous = manifest.nodes.find(n => n.id === id);
    if (previous && previous.sha256 !== info.sha256 && !replace) throw Error('This room already has a different approved image. Pass --replace only after accepting the replacement.');
    const node = { id, image:`panoramas/${id}.png`, ...info, style:'意式现代', approval_status:preview ? 'PREVIEW_ACCEPTED' : 'APPROVED', revision:info.sha256, reviewed_at:new Date().toISOString() };
    if (preview) node.preview_note = note.trim();
    if (yaw !== undefined) node.initial_yaw = Number(yaw);
    if (pitch !== undefined) node.initial_pitch = Number(pitch);
    let thumbnailBytes;
    if (thumbnail) {
      thumbnailBytes = await fs.readFile(path.resolve(thumbnail));
      let extension;
      if (thumbnailBytes.subarray(0,8).equals(pngMagic)) extension = 'png';
      else if (thumbnailBytes[0] === 255 && thumbnailBytes[1] === 216) extension = 'jpg';
      else throw Error('Thumbnail must be a PNG or JPEG.');
      node.thumbnail = `thumbs/${id}.${extension}`;
    }
    const nextNodes = [...manifest.nodes.filter(n => n.id !== id),node];
    const tour = buildTour(catalog,nextNodes);
    await fs.mkdir(path.join(root,'panoramas'),{ recursive:true });
    await atomicWrite(path.join(root,node.image),bytes);
    if (thumbnailBytes) { await fs.mkdir(path.join(root,'thumbs'),{ recursive:true }); await atomicWrite(path.join(root,node.thumbnail),thumbnailBytes); }
    const nextManifest = { schema_version:1,style:'意式现代',nodes:nextNodes.sort((a,b) => a.id.localeCompare(b.id)) };
    await atomicWrite(path.join(root,'manifest.json'),JSON.stringify(nextManifest,null,2)+'\n');
    await atomicWrite(path.join(root,'tour.js'),'window.TOUR = '+JSON.stringify(tour,null,2)+';\n');
    return { id,width:info.width,height:info.height,sha256:info.sha256,completed:tour.progress.completed,expected:tour.progress.expected,image:node.image };
  } finally { await lock.close(); await fs.unlink(lockPath); }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('node add-approved-panorama.mjs --id standard_02 --image /absolute/original.png (--approved | --preview --note "visible limitation") [--yaw -1.5 --pitch -0.18] [--thumbnail /absolute/thumb.jpg] [--replace]');
    return;
  }
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const option = args[i];
    if (option === '--approved') options.approved = true;
    else if (option === '--preview') options.preview = true;
    else if (option === '--replace') options.replace = true;
    else if (['--id','--image','--thumbnail','--note','--yaw','--pitch'].includes(option) && args[i+1] && !args[i+1].startsWith('--')) options[option.slice(2)] = args[++i];
    else throw Error('Unknown option or missing value: ' + option);
  }
  console.log(JSON.stringify(await addApprovedPanorama(options),null,2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
