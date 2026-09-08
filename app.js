/* ============================================================
   周湍淇住宅楼 · 全楼层互动模型 —— three.js 场景与交互
   plan(x, y)：原点在①轴∩Ⓔ轴（西北角），x 向东、y 向南；three.js X=x, Z=y
   ============================================================ */
import * as THREE from 'three';
import { OrbitControls } from './libs/OrbitControls.js';

const PX = (x, y) => new THREE.Vector3(x, 0, y);
const $ = s => document.querySelector(s);

/* ---------- 渲染器 / 场景 ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false, powerPreference: 'high-performance' });
const IS_MOBILE = matchMedia('(pointer: coarse)').matches || innerWidth < 860;
renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, IS_MOBILE ? 1 : 1.5), IS_MOBILE ? 1.6 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById('stage').appendChild(renderer.domElement);
/* 窗口/分栏尺寸变化：同步画布缓冲与相机纵横比（避免拉伸模糊与纵横比错乱） */
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  perspCam.aspect = innerWidth / innerHeight;
  perspCam.updateProjectionMatrix();
});

const scene = new THREE.Scene();

const perspCam = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.25, 260);
perspCam.position.set(21, 17, 30);

const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
orthoCam.position.set(5.95, 80, 9.35);
orthoCam.up.set(0, 0, -1);
orthoCam.lookAt(5.2, 0, 9.7);

let activeCam = perspCam;
const controls = new OrbitControls(perspCam, renderer.domElement);
controls.target.set(5.95, 0.6, 9.35);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxDistance = 120;
controls.minDistance = 1.2;
controls.maxPolarAngle = Math.PI * 0.495;

/* ---------- 光照 ---------- */
const hemi = new THREE.HemisphereLight(0xdfe8f2, 0x8d8672, 0.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 3.0);
sun.position.set(26, 32, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(IS_MOBILE ? 1024 : 2048, IS_MOBILE ? 1024 : 2048);
sun.shadow.normalBias = 0.03;
sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
sun.shadow.camera.top = 24; sun.shadow.camera.bottom = -24;
sun.shadow.camera.far = 100;
sun.shadow.bias = -0.0004;
scene.add(sun);
const sunFill = new THREE.DirectionalLight(0xcdd8ea, 0.7);
sunFill.position.set(-18, 14, -22);
scene.add(sunFill);
scene.add(sun.target);

/* ---------- 材质 ---------- */
const std = (c, r = 0.85, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const MAT = {
  extWall: std(0xf0ece2, 0.92),
  intWall: std(0xf1ece0, 0.95),
  parapet: std(0xd9d2c0, 0.9),
  slab: std(0xcbc4b2, 0.9),
  frame: std(0x6a6f74, 0.5, 0.6),
  glass: new THREE.MeshStandardMaterial({ color: 0x9fb6c4, roughness: 0.12, metalness: 0.4, transparent: true, opacity: 0.28 }),
  doorWood: std(0x8a6844, 0.6),
  doorGlass: std(0x7e99a8, 0.15, 0.3),
  steel: std(0xb9bec4, 0.35, 0.85),
  wood: std(0x9c7448, 0.62),
  woodDark: std(0x6f5233, 0.6),
  fabric: std(0xb9b0a2, 0.95),
  fabric2: std(0x5b6b82, 0.95),
  linen: std(0xece7dc, 0.95),
  white: std(0xf4f1ea, 0.9),
  black: std(0x24262a, 0.5),
  marble: std(0xdcd8cf, 0.3),
  leaf: std(0x5d7a4a, 0.9),
  leaf2: std(0x74875a, 0.9),
  pot: std(0xa55e42, 0.85),
  ceramic: std(0xf2f0ea, 0.25),
  counter: std(0xdedbd2, 0.5),
  lamp: new THREE.MeshStandardMaterial({ color: 0xf5e6c8, roughness: 0.6, emissive: 0xffd9a0, emissiveIntensity: 0 }),
  rattan: std(0xb08d5f, 0.85),
  water: std(0x9fc4d0, 0.2, 0.1),
  carBody: std(0x33455c, 0.32, 0.55),
  carBody2: std(0x8f3b34, 0.34, 0.5),
  carGlass: std(0x16202b, 0.18, 0.45),
};
/* 防频闪：面统一推后深度，让共面构造的描边线恒赢深度测试（否则运动时棱线马赛克闪烁） */
const FACE_OFFSET = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 3 };
Object.values(MAT).forEach(m => { if (m.isMeshStandardMaterial) Object.assign(m, FACE_OFFSET); });
const POLY = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 3 };
const whiteMat = std(0xf2f0eb, 0.94); Object.assign(whiteMat, POLY);
const whiteGlass = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, transparent: true, opacity: 0.14, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 3 });
const wireBasic = new THREE.MeshBasicMaterial({ color: 0xf8f5ed, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 3 });
const wireGlass = new THREE.MeshBasicMaterial({ color: 0xdfe7ec, transparent: true, opacity: 0.22, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 3 });
const edgeMat = new THREE.LineBasicMaterial({ color: 0x2a2620 });
/* 门洞穿越光环 */
const hotTexture = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.beginPath(); x.arc(64, 64, 52, 0, 7);
  x.strokeStyle = 'rgba(181,68,45,.95)'; x.lineWidth = 10; x.stroke();
  x.beginPath(); x.arc(64, 64, 22, 0, 7);
  x.fillStyle = 'rgba(244,239,228,.95)'; x.fill();
  const t = new THREE.CanvasTexture(c);
  return t;
})();
const hotPlaneGeo = new THREE.PlaneGeometry(0.52, 0.52);
const hotPlaneMat = () => new THREE.MeshBasicMaterial({ map: hotTexture, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false });
const skirtMat = new THREE.MeshStandardMaterial({ color: 0x8a7a63, roughness: 0.7 });
const exitSignMat = new THREE.MeshStandardMaterial({ color: 0x0b3d22, roughness: 0.5, emissive: 0x18e05a, emissiveIntensity: 0 });

/* ---------- 家具类型名 ---------- */
const TYPE_NAME = {
  bed: '双人床', nightstand: '床头柜', wardrobe: '衣柜', rug: '地毯', bathtub: '浴缸',
  toilet: '坐便器', basin: '台盆', diningSet: '餐桌椅', sideboard: '餐边柜', plant: '绿植',
  kitchenCounter: '橱柜', fridge: '冰箱', laundry: '洗衣机组', sink: '水槽', sofa3: '三人沙发',
  sofa1: '单人沙发', coffeeTable: '茶几', tvUnit: '电视柜', lSofa: '曲尺沙发', teaTable: '茶桌',
  shelf: '博古架', car: '轿车', table4: '餐桌（4 座）', desk: '书桌', chair: '座椅', bookshelf: '书架', armchair: '单人沙发',
  console: '条案', flowerPool: '花池', outdoorSet: '户外桌椅', lounger: '躺椅', liftCar: '电梯',
};

/* ============================================================
   逐层构建
   ============================================================ */
const floorObjs = {};   // id -> {group, solid, edge, furn, lights, pickables, data}

const geoCache = new Map();
function boxGeo(w, h, d) {
  const k = w.toFixed(3) + '|' + h.toFixed(3) + '|' + d.toFixed(3);
  if (!geoCache.has(k)) geoCache.set(k, new THREE.BoxGeometry(w, h, d));
  return geoCache.get(k);
}
function box(w, h, d, mat, x, yBase, z, ry = 0, parent, shadows = true) {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat);
  m.position.set(x, yBase + h / 2, z);
  m.rotation.y = ry;
  m.castShadow = shadows; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function addEdges(parent, mesh, thresh = 24) {
  const eg = new THREE.EdgesGeometry(mesh.geometry, thresh);
  const ls = new THREE.LineSegments(eg, edgeMat);
  mesh.updateMatrix();
  ls.applyMatrix4(mesh.matrix);   // 相对所在楼层组的局部矩阵
  parent.add(ls);
}

function buildWindow(g, cx, op, t) {
  const { w, s, h } = op;
  const fm = MAT.frame;
  [[0.06, h, t + 0.06, cx - w / 2 + 0.03, s + h / 2],
   [0.06, h, t + 0.06, cx + w / 2 - 0.03, s + h / 2],
   [w, 0.06, t + 0.06, cx, s + 0.03],
   [w, 0.06, t + 0.06, cx, s + h - 0.03],
   [0.05, h, 0.05, cx, s + h / 2]].forEach(([bw, bh, bd, bx, by]) => {
    addEdges(g, box(bw, bh, bd, fm, bx, by - bh / 2, 0, 0, g, false), 30);
  });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, h - 0.08, 0.02), MAT.glass);
  glass.position.set(cx, s + h / 2, 0);
  g.add(glass);
  box(w + 0.1, 0.04, t + 0.12, MAT.marble, cx, s - 0.02, 0, 0, g, false);
}
function buildDoor(g, cx, op, t) {
  const { w, h } = op;
  box(0.07, h, t + 0.04, MAT.frame, cx - w / 2 + 0.035, 0, 0, 0, g, false);
  box(0.07, h, t + 0.04, MAT.frame, cx + w / 2 - 0.035, 0, 0, 0, g, false);
  box(w, 0.07, t + 0.04, MAT.frame, cx, h - 0.07, 0, 0, g, false);
  const leafMat = op.code === 'M1021' || op.code === 'M1221' ? MAT.steel : MAT.doorWood;
  const hinge = new THREE.Group();
  hinge.position.set(cx - w / 2 + 0.05, 0, 0);
  addEdges(g, box(w - 0.1, h - 0.1, 0.045, leafMat, (w - 0.1) / 2, 0.05, 0, 0, hinge), 30);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), MAT.black);
  knob.position.set((w - 0.1) / 2 + 0.32, 1.05, 0.05);
  hinge.add(knob);
  hinge.rotation.y = op.swing[1] > 0 ? -0.5 : 0.5;
  g.add(hinge);
}
function buildSlider(g, cx, op, t) {
  const { w, h } = op;
  box(0.08, h, t + 0.04, MAT.frame, cx - w / 2 + 0.04, 0, 0, 0, g, false);
  box(0.08, h, t + 0.04, MAT.frame, cx + w / 2 - 0.04, 0, 0, 0, g, false);
  box(w, 0.08, t + 0.04, MAT.frame, cx, h - 0.08, 0, 0, g, false);
  addEdges(g, box(w / 2 - 0.05, h - 0.12, 0.05, MAT.doorGlass, cx - w / 4, 0.06, t * 0.18, 0, g, false));
  addEdges(g, box(w / 2 - 0.05, h - 0.12, 0.05, MAT.doorGlass, cx + w / 4, 0.06, -t * 0.18, 0, g, false));
}
function buildLiftDoor(g, cx, op, t) {
  const { w, h } = op;
  box(0.1, h + 0.1, t + 0.08, MAT.steel, cx - w / 2 - 0.02, 0, 0, 0, g, false);
  box(0.1, h + 0.1, t + 0.08, MAT.steel, cx + w / 2 + 0.02, 0, 0, 0, g, false);
  box(w + 0.24, 0.3, t + 0.08, MAT.steel, cx, h, 0, 0, g, false);
  addEdges(g, box(w / 2 - 0.015, h, 0.06, MAT.steel, cx - w / 4, 0, 0, 0, g, false));
  addEdges(g, box(w / 2 - 0.015, h, 0.06, MAT.steel, cx + w / 4, 0, 0, 0, g, false));
}
function buildWall(parent, w) {
  const A = PX(...w.a), Bv = PX(...w.b);
  const dir = new THREE.Vector3().subVectors(Bv, A);
  const L = dir.length();
  const ang = Math.atan2(dir.z, dir.x);
  const g = new THREE.Group();
  g.name = 'wall:' + (w.name || '墙');
  g.position.copy(A).addScaledVector(dir, 0.5);   // 局部原点=墙中点（下方构件按 opCoord−L/2 摆放）
  g.rotation.y = -ang;
  const t = w.t, H = w.h;
  const wallMat = w.parapet ? MAT.parapet : (w.name.includes('外') || w.name.includes('女儿') ? MAT.extWall : MAT.intWall);
  const ops = [...w.ops].sort((p, q) => p.o - q.o);
  const segs = [];
  let cursor = 0;
  for (const op of ops) {
    const o1 = op.o - op.w / 2, o2 = op.o + op.w / 2;
    if (o1 > cursor + 0.001) segs.push({ from: cursor, to: o1, y0: 0, y1: H });
    if (op.s > 0.001) segs.push({ from: o1, to: o2, y0: 0, y1: op.s });
    if (op.s + op.h < H - 0.001) segs.push({ from: o1, to: o2, y0: op.s + op.h, y1: H });
    cursor = o2;
  }
  if (cursor < L - 0.001) segs.push({ from: cursor, to: L, y0: 0, y1: H });
  for (const s of segs) {
    addEdges(g, box(s.to - s.from, s.y1 - s.y0, t, wallMat, (s.from + s.to) / 2 - L / 2, s.y0, 0, 0, g));
    if (s.y0 === 0 && !w.parapet) {
      box(s.to - s.from, 0.08, t + 0.03, skirtMat, (s.from + s.to) / 2 - L / 2, 0, 0, 0, g, false);
    }
  }
  for (const op of ops) {
    const cx = op.o - L / 2;
    if (op.type === 'win') buildWindow(g, cx, op, t);
    else if (op.type === 'door') buildDoor(g, cx, op, t);
    else if (op.type === 'slide') buildSlider(g, cx, op, t);
    else if (op.type === 'lift') buildLiftDoor(g, cx, op, t);
  }
  parent.add(g);
}

/* 标准双跑楼梯 */
function buildStairs(parent) {
  const g = new THREE.Group();
  const stepMat = MAT.marble;
  box(1.9, 0.15, 1.2, stepMat, 1.25, -0.13, 6.2, 0, g);
  for (let i = 0; i < 10; i++) box(0.9, (i + 1) * 0.16, 0.26, stepMat, 0.75, 0, 6.8 + i * 0.26 + 0.13, 0, g);
  box(1.9, 1.61, 0.8, stepMat, 1.25, 0, 9.0, 0, g);
  for (let i = 0; i < 10; i++) box(0.9, 1.6 + (i + 1) * 0.16, 0.26, stepMat, 1.75, 0, 8.6 - i * 0.26 - 0.13, 0, g);
  box(1.0, 0.15, 1.3, stepMat, 1.7, 3.06, 6.2, 0, g);
  function rail(x, y1, z1, y2, z2) {
    const len = Math.hypot(y2 - y1, z2 - z1);
    const r = box(0.05, 0.05, len, MAT.woodDark, x, 0, 0, 0, g, false);
    r.position.y = (y1 + y2) / 2 + 0.9;
    r.position.z = (z1 + z2) / 2;
    r.rotation.x = Math.atan2(y2 - y1, z2 - z1);
    for (let i = 0; i <= 4; i++) {
      const t2 = i / 4;
      box(0.04, 0.9, 0.04, MAT.woodDark, x, y1 + (y2 - y1) * t2, z1 + (z2 - z1) * t2, 0, g, false);
    }
  }
  rail(0.26, 0.16, 6.9, 1.75, 9.3);
  rail(2.24, 1.76, 8.6, 3.36, 6.0);
  box(1.9, 0.9, 0.05, MAT.woodDark, 1.25, 1.6, 9.38, 0, g, false);
  parent.add(g);
}
/* 电梯 */
function buildElevator(parent, h) {
  const g = new THREE.Group();
  addEdges(g, box(1.3, 2.3, 1.5, MAT.steel, 1.25, 0, 11.0, 0, g));
  box(1.1, 0.06, 1.3, MAT.wood, 1.25, 0.02, 11.0, 0, g, false);
  box(0.06, 0.35, 0.25, MAT.black, 1.98, 1.1, 10.75, 0, g, false);
  /* 出口标识灯箱：电梯门（南壁）正上方，夜间自发光 */
  const sign = box(0.5, 0.16, 0.05, exitSignMat, 1.25, (h || 3) * 0.52, 12.28, 0, g, false);
  glowMeshes.push({ mesh: sign });
  box(0.06, 0.35, 0.25, MAT.black, 0.5, 1.05, 12.32, 0, g, false); // 呼叫面板
  g.userData = { pick: 'furn', name: '电梯（井道+轿厢）', room: 'dt', desc: '1800×2200 电梯井，轿厢贯通 1—9 层；南壁电梯门与呼叫面板（剖面图注"电梯一"）。出电梯门向南即厅廊：正前 M1021 直通露台，向东经洞口入茶室/两房一厅客厅。' };
  parent.add(g);
  return g;
}
/* 负一层单跑楼梯（下行） */
function buildB1Stairs(parent) {
  const g = new THREE.Group();
  const stepMat = MAT.marble;
  for (let i = 0; i < 10; i++) {
    box(1.0, 3.0 - i * 0.3, 0.22, stepMat, 4.3, 0, 7.6 - i * 0.22 - 0.11, 0, g);
  }
  box(1.2, 0.15, 1.1, stepMat, 4.3, -0.13, 7.9, 0, g);
  parent.add(g);
}

/* ---------- 家具工厂 ---------- */
const glowMeshes = [];
function fb(g, w, h, d, mat, x, y, z, ry = 0, edge = false) {
  const m = box(w, h, d, mat, x, y, z, ry, g, false);
  if (edge) addEdges(g, m, 30);
  return m;
}
function cyl(g, r, h, mat, x, y, z, seg = 20, edge = false) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = false;
  g.add(m);
  if (edge) addEdges(g, m, 30);
  return m;
}
function lampGlow(g, shade) { glowMeshes.push({ mesh: shade }); }

const F = {
  bed(g) {
    fb(g, 1.8, 0.32, 2.0, MAT.wood, 0, 0, 0, 0, true);
    fb(g, 1.8, 0.9, 0.12, MAT.wood, 0, 0, -1.04, 0, true);
    fb(g, 1.7, 0.22, 1.9, MAT.linen, 0, 0.32, 0);
    fb(g, 1.72, 0.1, 1.15, MAT.fabric2, 0, 0.54, 0.36);
    fb(g, 0.65, 0.14, 0.4, MAT.white, -0.45, 0.54, -0.72).rotation.y = 0.06;
    fb(g, 0.65, 0.14, 0.4, MAT.white, 0.45, 0.54, -0.72).rotation.y = -0.05;
  },
  nightstand(g) {
    fb(g, 0.5, 0.5, 0.5, MAT.wood, 0, 0, 0, 0, true);
    const shade = cyl(g, 0.12, 0.2, MAT.lamp, 0, 0.62, 0);
    cyl(g, 0.03, 0.14, MAT.black, 0, 0.5, 0);
    lampGlow(g, shade);
  },
  wardrobe(g) {
    fb(g, 2.4, 2.3, 0.6, MAT.wood, 0, 0, 0, 0, true);
    for (let i = 0; i < 3; i++) fb(g, 0.75, 2.1, 0.03, MAT.woodDark, -0.8 + i * 0.8, 0.1, 0.3);
  },
  rug(g) { const m = fb(g, 2.3, 0.02, 1.7, MAT.fabric, 0, 0, 0); m.receiveShadow = true; },
  bathtub(g) {
    fb(g, 1.1, 0.55, 0.72, MAT.ceramic, 0, 0, 0, 0, true);
    fb(g, 0.9, 0.1, 0.52, MAT.water, 0, 0.42, 0);
  },
  toilet(g) {
    fb(g, 0.42, 0.42, 0.62, MAT.ceramic, 0, 0, 0, 0, true);
    fb(g, 0.42, 0.55, 0.16, MAT.ceramic, 0, 0.3, -0.26);
    cyl(g, 0.22, 0.05, MAT.ceramic, 0, 0.42, 0.05);
  },
  basin(g) {
    fb(g, 0.55, 0.8, 0.45, MAT.wood, 0, 0, 0, 0, true);
    const b = cyl(g, 0.2, 0.13, MAT.ceramic, 0, 0.8, 0, 24, true);
    b.scale.z = 0.8;
  },
  diningSet(g) {
    cyl(g, 0.9, 0.06, MAT.woodDark, 0, 0.72, 0, 40, true);
    cyl(g, 0.09, 0.72, MAT.woodDark, 0, 0, 0, 16);
    cyl(g, 0.35, 0.04, MAT.woodDark, 0, 0, 0, 24);
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI * 2 / 10;
      const cg = new THREE.Group();
      cg.position.set(Math.sin(a) * 1.22, 0, Math.cos(a) * 1.22);
      cg.rotation.y = a + Math.PI;
      fb(cg, 0.44, 0.05, 0.44, MAT.wood, 0, 0.45, 0);
      fb(cg, 0.44, 0.5, 0.05, MAT.wood, 0, 0.5, -0.2);
      [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([lx, lz]) =>
        cyl(cg, 0.018, 0.45, MAT.woodDark, lx, 0, lz, 8));
      g.add(cg);
    }
  },
  sideboard(g) { fb(g, 0.42, 0.85, 2.2, MAT.wood, 0, 0, 0, 0, true); },
  plant(g) {
    cyl(g, 0.18, 0.35, MAT.pot, 0, 0, 0, 14, true);
    cyl(g, 0.035, 0.5, MAT.woodDark, 0, 0.3, 0, 8);
    [[0, 0.95, 0, 0.3], [0.18, 0.8, 0.1, 0.2], [-0.16, 0.82, -0.08, 0.22], [0.05, 1.18, -0.05, 0.18]].forEach(([x, y, z, r]) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), Math.random() > 0.5 ? MAT.leaf : MAT.leaf2);
      s.position.set(x, y, z); s.castShadow = false;
      g.add(s);
    });
  },
  kitchenCounter(g) {
    const base = 0.85, dep = 0.6;
    fb(g, 2.0, base, dep, MAT.counter, -1.0, 0, 0, 0, true);
    fb(g, dep, base, 3.3, MAT.counter, 0, 0, 1.65, 0, true);
    fb(g, 2.04, 0.04, dep + 0.04, MAT.marble, -1.0, base, 0);
    fb(g, dep + 0.04, 0.04, 3.34, MAT.marble, 0, base, 1.65);
    fb(g, 0.7, 0.08, 0.45, MAT.black, -1.25, base + 0.02, 0);
    fb(g, 0.72, 0.5, 0.5, MAT.steel, -1.25, base + 0.75, 0, 0, true);
    fb(g, 0.5, 0.1, 0.42, MAT.steel, 0, base - 0.05, 1.45, 0, true);
    cyl(g, 0.02, 0.28, MAT.steel, -0.1, base + 0.04, 1.45, 8);
    fb(g, 2.0, 0.7, 0.35, MAT.white, -1.0, 1.55, -0.1, 0, true);
    fb(g, 0.35, 0.7, 3.3, MAT.white, 0.125, 1.55, 1.65, 0, true);
  },
  fridge(g) {
    fb(g, 0.65, 1.8, 0.62, MAT.steel, 0, 0, 0, 0, true);
    fb(g, 0.62, 0.03, 0.03, MAT.black, 0.28, 1.0, 0.31);
  },
  laundry(g) {
    fb(g, 0.6, 0.85, 0.62, MAT.white, -0.33, 0, 0, 0, true);
    fb(g, 0.6, 0.85, 0.62, MAT.white, 0.33, 0, 0, 0, true);
    cyl(g, 0.24, 0.03, MAT.black, -0.33, 0.55, 0.31, 24);
    cyl(g, 0.24, 0.03, MAT.black, 0.33, 0.55, 0.31, 24);
  },
  sink(g) {
    fb(g, 0.5, 0.8, 0.55, MAT.white, 0, 0, 0, 0, true);
    fb(g, 0.4, 0.12, 0.4, MAT.steel, 0, 0.8, 0, 0, true);
    cyl(g, 0.02, 0.25, MAT.steel, 0, 0.86, -0.18, 8);
  },
  sofa3(g) {
    fb(g, 0.85, 0.42, 2.2, MAT.fabric, 0, 0.12, 0, 0, true);
    fb(g, 0.25, 1.0, 2.2, MAT.fabric, -0.3, 0, 0, 0, true);
    fb(g, 0.85, 0.62, 0.25, MAT.fabric, 0, 0, -1.1, 0, true);
    fb(g, 0.85, 0.62, 0.25, MAT.fabric, 0, 0, 1.1, 0, true);
    for (let i = 0; i < 3; i++) fb(g, 0.55, 0.45, 0.16, MAT.fabric, -0.12, 0.54, -0.7 + i * 0.7);
  },
  sofa1(g) {
    fb(g, 0.8, 0.42, 0.8, MAT.fabric2, 0, 0.12, 0, 0, true);
    fb(g, 0.22, 0.95, 0.8, MAT.fabric2, -0.29, 0, 0, 0, true);
    fb(g, 0.8, 0.6, 0.22, MAT.fabric2, 0, 0, -0.31, 0, true);
    fb(g, 0.8, 0.6, 0.22, MAT.fabric2, 0, 0, 0.31, 0, true);
  },
  coffeeTable(g) {
    fb(g, 1.2, 0.06, 0.6, MAT.woodDark, 0, 0.32, 0, 0, true);
    fb(g, 1.0, 0.3, 0.45, MAT.black, 0, 0, 0);
    cyl(g, 0.12, 0.07, MAT.ceramic, 0.2, 0.38, 0, 18);
  },
  tvUnit(g) {
    fb(g, 1.8, 0.4, 0.4, MAT.woodDark, 0, 0, 0, 0, true);
    const tv = fb(g, 1.3, 0.75, 0.05, MAT.black, 0, 0.62, -0.05, 0, true);
    glowMeshes.push({ mesh: tv });
  },
  lSofa(g) {
    fb(g, 0.7, 0.4, 2.8, MAT.fabric, 0, 0.1, -0.2, 0, true);
    fb(g, 0.25, 0.95, 2.8, MAT.fabric, -0.24, 0, -0.2, 0, true);
    fb(g, 1.7, 0.4, 0.7, MAT.fabric, 0.75, 0.1, -1.25, 0, true);
    fb(g, 1.7, 0.95, 0.25, MAT.fabric, 0.75, 0, -1.52, 0, true);
    for (let i = 0; i < 3; i++) fb(g, 0.2, 0.42, 0.75, MAT.fabric, -0.12, 0.5, -1.0 + i * 0.85);
  },
  table4(g) {
    /* 小方餐桌：图纸标准层/两房一厅餐厅为 0.8×1.0 小桌 + 两侧各两椅 */
    fb(g, 1.0, 0.05, 0.8, MAT.wood, 0, 0.72, 0, 0, true);
    fb(g, 0.06, 0.72, 0.72, MAT.woodDark, -0.44, 0, 0);
    fb(g, 0.06, 0.72, 0.72, MAT.woodDark, 0.44, 0, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cg = new THREE.Group();
      cg.position.set(sx * 0.72, 0, sz * 0.32);
      cg.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
      fb(cg, 0.42, 0.05, 0.42, MAT.wood, 0, 0.44, 0);
      fb(cg, 0.42, 0.48, 0.05, MAT.wood, 0, 0.49, -0.19);
      [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([lx, lz]) =>
        cyl(cg, 0.017, 0.44, MAT.woodDark, lx, 0, lz, 8));
      g.add(cg);
    }
  },
  car(g) {
    /* 轿车 4.4×1.78×1.4：长轴沿 X，四轮轴沿 Z；车身/座舱/车窗/前后灯 */
    const paint = (g.userData && g.userData.carRed) ? MAT.carBody2 : MAT.carBody;
    fb(g, 4.4, 0.5, 1.78, paint, 0, 0.36, 0, 0, true);
    fb(g, 2.1, 0.44, 1.6, paint, -0.35, 0.86, 0, 0, true);
    fb(g, 1.92, 0.26, 1.64, MAT.carGlass, -0.35, 0.9, 0);
    fb(g, 0.95, 0.2, 1.62, paint, 1.45, 0.66, 0);
    for (const [wx, wz] of [[-1.42, 0.84], [1.42, 0.84], [-1.42, -0.84], [1.42, -0.84]]) {
      const w = cyl(g, 0.31, 0.22, MAT.black, wx, 0.2, wz, 14);
      w.rotation.x = Math.PI / 2;
    }
    fb(g, 0.07, 0.14, 0.42, MAT.lamp, -2.2, 0.55, 0.55);
    fb(g, 0.07, 0.14, 0.42, MAT.lamp, -2.2, 0.55, -0.55);
    fb(g, 0.07, 0.14, 0.42, MAT.black, 2.2, 0.6, 0.55);
    fb(g, 0.07, 0.14, 0.42, MAT.black, 2.2, 0.6, -0.55);
  },
  teaTable(g) {
    fb(g, 1.5, 0.06, 0.9, MAT.woodDark, 0, 0.3, 0, 0, true);
    fb(g, 1.3, 0.28, 0.7, MAT.black, 0, 0, 0);
    cyl(g, 0.09, 0.05, MAT.ceramic, -0.3, 0.36, 0.1, 16);
    cyl(g, 0.07, 0.04, MAT.ceramic, -0.1, 0.36, -0.15, 16);
    cyl(g, 0.05, 0.03, MAT.ceramic, 0.15, 0.36, 0.12, 12);
  },
  shelf(g) {
    fb(g, 2.4, 2.2, 0.32, MAT.wood, 0, 0, 0, 0, true);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++)
      fb(g, 0.3, 0.34, 0.2, i % 2 ? MAT.fabric2 : MAT.pot, -1.0 + j * 0.4, 0.25 + i * 0.5, 0.05);
  },
  desk(g) {
    fb(g, 1.6, 0.05, 0.7, MAT.wood, 0, 0.72, 0, 0, true);
    fb(g, 0.06, 0.72, 0.65, MAT.wood, -0.74, 0, 0);
    fb(g, 0.06, 0.72, 0.65, MAT.wood, 0.74, 0, 0);
    fb(g, 0.4, 0.3, 0.02, MAT.black, 0.3, 0.82, -0.2).rotation.x = -0.2;
  },
  chair(g) {
    fb(g, 0.46, 0.06, 0.46, MAT.woodDark, 0, 0.45, 0, 0, true);
    fb(g, 0.46, 0.55, 0.06, MAT.woodDark, 0, 0.5, -0.2);
    cyl(g, 0.03, 0.45, MAT.steel, 0, 0, 0, 8);
  },
  bookshelf(g) {
    fb(g, 3.0, 2.2, 0.32, MAT.wood, 0, 0, 0, 0, true);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 9; j++)
      fb(g, 0.26, 0.3, 0.2, [MAT.fabric2, MAT.pot, MAT.leaf2, MAT.rattan][(i + j) % 4], -1.32 + j * 0.33, 0.22 + i * 0.42, 0.04);
  },
  armchair(g) {
    fb(g, 0.75, 0.4, 0.75, MAT.rattan, 0, 0.12, 0, 0, true);
    fb(g, 0.2, 0.9, 0.75, MAT.rattan, -0.28, 0, 0, 0, true);
  },
  console(g) {
    fb(g, 0.4, 0.8, 1.8, MAT.woodDark, 0, 0, 0, 0, true);
    cyl(g, 0.1, 0.3, MAT.ceramic, 0, 0.8, -0.5, 14);
  },
  flowerPool(g) {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.45, 32, 1, false, Math.PI / 2, Math.PI / 2), MAT.extWall);
    wall.position.set(0, 0.225, 0);
    wall.castShadow = false; wall.receiveShadow = true;
    g.add(wall); addEdges(g, wall, 40);
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(1.56, 1.56, 0.4, 32, 1, false, Math.PI / 2, Math.PI / 2), std(0x4a3f33, 1));
    bed.position.set(0, 0.2, 0); g.add(bed);
    [[0.5, 0.75, 0.3], [1.0, 0.55, 0.22], [0.45, 1.2, 0.26]].forEach(([x, z, r]) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), MAT.leaf);
      s.position.set(x, 0.5 + r * 0.4, z); s.scale.y = 0.85; g.add(s);
    });
  },
  outdoorSet(g) {
    for (const sx of [-0.85, 0.85]) {
      const cg = new THREE.Group();
      cg.position.set(sx, 0, 0);
      cg.rotation.y = sx > 0 ? -0.5 : 0.5;
      fb(cg, 0.6, 0.35, 0.6, MAT.rattan, 0, 0.1, 0, 0, true);
      fb(cg, 0.6, 0.75, 0.15, MAT.rattan, 0, 0, -0.28);
      g.add(cg);
    }
    cyl(g, 0.45, 0.05, MAT.wood, 0, 0.68, 0, 24, true);
    cyl(g, 0.05, 0.68, MAT.steel, 0, 0, 0, 10);
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.5, 10, 1, true), std(0xc9b8a0, 0.9));
    um.position.set(0, 2.35, 0); um.castShadow = false; g.add(um);
    cyl(g, 0.02, 1.7, MAT.steel, 0, 0.72, 0, 8);
  },
  lounger(g) {
    fb(g, 0.65, 0.25, 1.7, MAT.rattan, 0, 0.15, 0, 0, true);
    fb(g, 0.65, 0.08, 0.75, MAT.rattan, 0, 0.4, -0.55).rotation.x = -0.5;
    [[-0.28, -0.75], [0.28, -0.75], [-0.28, 0.75], [0.28, 0.75]].forEach(([x, z]) => fb(g, 0.06, 0.15, 0.06, MAT.woodDark, x, 0, z));
  },
};

/* ---------- 构造柱 ---------- */
function buildColumns() {
  const g = new THREE.Group();
  const pts = [[0, 0], [3.5, 0], [7, 0], [10.6, 0], [0, 5.5], [3.5, 5.5], [7, 5.5], [10.6, 5.5],
    [0, 9.5], [7, 9.5], [10.6, 9.5], [0, 13.6], [2.5, 13.6], [7, 13.6], [10.6, 13.6], [10.6, 18.4]];
  for (const [x, y] of pts) box(0.26, 4.0, 0.26, MAT.extWall, x, 0, y, 0, g, false);
  return g;
}

/* ============================================================
   逐层构建
   ============================================================ */
/* 自动去穿插：家具与墙体 AABB 最小平移分离（迭代到脱离为止） */
function decollideFloor(solid, furn, z) {
  const wallBoxes = [];
  solid.traverse(o => {
    if (o.isMesh && o.parent.name && o.parent.name.startsWith('wall:')) {
      wallBoxes.push(new THREE.Box3().setFromObject(o).expandByScalar(-0.015));
    }
  });
  for (let pass = 0; pass < 4; pass++) {
    let moved = 0;
    for (const g of furn.children) {
      if (!g.userData.pick) continue;
      for (let iter = 0; iter < 4; iter++) {
        const b = new THREE.Box3().setFromObject(g);
        let pen = 1e9, axis = 'x', sgn = 1;
        for (const wb of wallBoxes) {
          if (!b.intersectsBox(wb)) continue;
          const ox = Math.min(b.max.x, wb.max.x) - Math.max(b.min.x, wb.min.x);
          const oy = Math.min(b.max.y, wb.max.y) - Math.max(b.min.y, wb.min.y);
          const oz = Math.min(b.max.z, wb.max.z) - Math.max(b.min.z, wb.min.z);
          const m = Math.min(ox, oy, oz);
          if (m < pen) {
            pen = m;
            if (m === ox) { axis = 'x'; sgn = (b.min.x + b.max.x) / 2 < (wb.min.x + wb.max.x) / 2 ? -1 : 1; }
            else if (m === oy) { axis = 'y'; sgn = (b.min.y + b.max.y) / 2 < (wb.min.y + wb.max.y) / 2 ? -1 : 1; }
            else { axis = 'z'; sgn = (b.min.z + b.max.z) / 2 < (wb.min.z + wb.max.z) / 2 ? -1 : 1; }
          }
        }
        if (pen > 0.6) break;
        g.position[axis] += sgn * (pen + 0.006);
        moved++;
      }
    }
    if (!moved) break;
  }
}

FLOORS.forEach(F0 => {
  const group = new THREE.Group();
  group.position.y = F0.z;
  const solid = new THREE.Group();
  const edge = new THREE.Group();
  const furn = new THREE.Group();
  const pickables = [];
  const lights = [];
  const hot = new THREE.Group();
  hot.visible = false;
  group.add(solid, edge, furn, hot);
  scene.add(group);

  /* 墙体 */
  let walls = F0.walls;
  if ((F0.core || F0.lift) && F0.id !== 'f9') walls = walls.concat(SHAFT_WALLS.map(w => ({ ...w })));
  walls.forEach(w => buildWall(solid, w));

  /* 楼板 */
  const placed = [];
  F0.rooms.forEach(r => {
    const [x1, y1, x2, y2] = r.bbox;
    const fm = FLOOR_MATS[r.floor];
    const m = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, 0.14, y2 - y1), std(fm.color, fm.rough));
    let drop = 0;
    for (const p of placed) {
      const ox = Math.min(x2, p[2]) - Math.max(x1, p[0]);
      const oz = Math.min(y2, p[3]) - Math.max(y1, p[1]);
      if (ox > 0.01 && oz > 0.01) drop += 0.006;
    }
    placed.push([x1, y1, x2, y2]);
    m.position.set((x1 + x2) / 2, -0.07 - drop, (y1 + y2) / 2);
    m.receiveShadow = true;
    m.userData = { pick: 'room', room: r, floorId: F0.id };
    solid.add(m);
    pickables.push(m);
    addEdges(solid, m);
    /* 夜间房间灯 */
    const l = new THREE.PointLight(F0.id === 'rf' || r.id.startsWith('yt') ? 0xbfd4e6 : 0xffd9a3,
      18, Math.max(x2 - x1, y2 - y1) + 6, 1.8);
    l.position.set((x1 + x2) / 2, Math.min(2.9, (F0.h || 3) * 0.75), (y1 + y2) / 2);
    l.visible = false;
    group.add(l);
    lights.push(l);
  });

  /* 楼梯 / 电梯 / 屋面板 */
  if (F0.core) buildStairs(solid);
  if (F0.core || F0.lift) buildElevator(solid, F0.h);
  if (F0.id === 'fb1') buildB1Stairs(solid);
  if (F0.roof) {
    box(10.4, 0.15, 19.7, MAT.slab, 5.3, -0.20, 9.95, 0, solid, false);
    box(0.7, 0.3, 0.7, MAT.extWall, 9.6, 0, 0.9, 0, solid, false); // 检修孔
  }

  /* 墙体纳入拾取：悬停墙面显示墙名，同时充当射线遮挡体（防穿透） */
  solid.children.forEach(c => {
    if (!c.name || !c.name.startsWith('wall:')) return;
    c.userData = { pick: 'wall', floorId: F0.id, name: c.name.slice(5), desc: '墙体「' + c.name.slice(5) + '」（' + F0.name + '）' };
    pickables.push(c);
  });

  /* 家具 */
  F0.furniture.forEach(f => {
    if (f.type === 'liftCar') return;
    const g = new THREE.Group();
    g.position.set(f.pos[0], 0, f.pos[1]);
    g.rotation.y = f.rot || 0;
    if (f.s) g.scale.set(f.s, f.s, f.s);
    g.userData = { pick: 'furn', floorId: F0.id, typeKey: f.type, name: f.name || TYPE_NAME[f.type] || f.type, desc: f.desc || '', room: f.room || '', carRed: !!f.carRed };
    furn.add(g);
    pickables.push(g);
    F[f.type] && F[f.type](g);
  });

  buildHotspots(hot, F0, pickables);
  decollideFloor(solid, furn);

  floorObjs[F0.id] = { group, solid, edge, furn, hot, lights, pickables, data: F0 };
});

/* ---------- 场地 ---------- */
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(60, 72),
  new THREE.MeshStandardMaterial({ color: 0xcac2ae, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(5.95, -0.6, 9.35);
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(120, 30, 0xb4ac96, 0xbfb8a4);
grid.position.set(5.95, -0.58, 9.35);
grid.material.opacity = 0.22; grid.material.transparent = true;
scene.add(grid);

/* ============================================================
   楼层切换 / 模式 / 昼夜
   ============================================================ */
let mode = 'real', night = false, planMode = false, prevModeBeforePlan = null;
let activeId = 'f9';
const activeFloor = () => floorObjs[activeId];

function setMode(m) {
  mode = m;
  for (const id in floorObjs) {
    const o = floorObjs[id];
    [o.solid, o.furn].forEach(root => root.traverse(t => {
      if (!t.isMesh) return;
      if (!t.userData.om) t.userData.om = t.material;
      if (m === 'real') t.material = t.userData.om;
      else if (m === 'white') t.material = (t.userData.om === MAT.glass) ? whiteGlass : whiteMat;
      else t.material = (t.userData.om === MAT.glass) ? wireGlass : wireBasic;
    }));
    o.edge.visible = m === 'wire';
  }
  solidApplyEnv();
  syncUI();
}
function solidApplyEnv() {
  sun.castShadow = mode === 'real';
  if (mode === 'real') {
    scene.background = new THREE.Color(night ? 0x0b101d : 0xccd6df);
    scene.fog = new THREE.Fog(night ? 0x0b101d : 0xccd6df, 60, 180);
    hemi.intensity = night ? 0.12 : 0.55;
    hemi.color.set(night ? 0x36415e : 0xdfe8f2);
    sun.intensity = night ? 0.25 : 3.0;
    sun.color.set(night ? 0x8ea2c8 : 0xfff2dd);
    sunFill.intensity = night ? 0.1 : 0.7;
    ground.material.color.set(night ? 0x11151f : 0xcac2ae);
  } else {
    scene.background = new THREE.Color(mode === 'wire' ? (night ? 0x14171c : 0xf4efe4) : (night ? 0x1a1d24 : 0xe9e7e2));
    scene.fog = null;
    hemi.intensity = 0.75;
    sun.intensity = 1.6;
    sunFill.intensity = 0.4;
    ground.material.color.set(night ? 0x181c24 : (mode === 'wire' ? 0xefe9db : 0xdcdad4));
  }
  grid.visible = mode === 'real';
  edgeMat.color.set(night ? 0xd8d2c2 : 0x2a2620);
}
function setNight(v) {
  night = v;
  const act = activeFloor();
  for (const id in floorObjs) floorObjs[id].lights.forEach(l => l.visible = (v && id === activeId));
  glowMeshes.forEach(({ mesh }) => {
    if (!mesh.userData.glowMat) {
      mesh.userData.glowMat = mesh.material.clone();
      mesh.userData.glowMat.emissive = new THREE.Color(0xffd9a0);
    }
    if (!mesh.userData.om) mesh.userData.om = mesh.material;
    mesh.material = v ? mesh.userData.glowMat : mesh.userData.om;
    if (mesh.material.emissive) mesh.material.emissiveIntensity = v ? 1.6 : 0;
  });
  MAT.glass.emissive.set(v ? 0x2a2416 : 0x000000);
  MAT.glass.emissiveIntensity = v ? 0.7 : 0;
  solidApplyEnv();
  syncUI();
}

function switchFloor(id) {
  activeId = id;
  const F0 = activeFloor().data;
  for (const k in floorObjs) {
    floorObjs[k].group.visible = (k === id);
    floorObjs[k].hot.visible = vr.on && (k === id);
  }
  if (night) setNight(true);
  /* 场地高度 */
  const gy = id === 'fb1' ? -3.7 : -0.6;
  ground.position.y = gy; grid.position.y = gy + 0.02;
  /* 太阳跟随标高（保证阴影相机覆盖当前层） */
  const z = F0.z;
  sun.position.set(26, z + 32, 10);
  sun.target.position.set(5.95, z, 9.35);
  sun.target.updateMatrixWorld();
  sunFill.position.set(-18, z + 14, -22);
  /* 相机 */
  if (vr.on) {
    const v = vrDefaultView();
    perspCam.position.copy(v.pos);
    vr.yaw = v.yaw; vr.pitch = v.pitch;
    applyLook();
  } else {
    perspCam.position.set(21, z + 16, 30);
    controls.target.set(5.3, z + 0.5, 9.5);
  }
  hlBox.visible = false;
  $('#infoPanel').classList.remove('open');
  buildRoomList();
  $('#introText').textContent = F0.intro || META.intro;
  syncUI();
}

/* ---------- 相机飞行 ---------- */
let flyAnim = null;
function flyTo(pos, look, dur = 1.4) {
  flyAnim = {
    t0: performance.now(), dur: dur * 1000,
    p0: perspCam.position.clone(), p1: new THREE.Vector3(...pos),
    l0: controls.target.clone(), l1: new THREE.Vector3(...look),
  };
}
function tickFly() {
  if (!flyAnim) return;
  const k = Math.min(1, (performance.now() - flyAnim.t0) / flyAnim.dur);
  const e = 1 - Math.pow(1 - k, 3);
  perspCam.position.lerpVectors(flyAnim.p0, flyAnim.p1, e);
  controls.target.lerpVectors(flyAnim.l0, flyAnim.l1, e);
  if (k >= 1) flyAnim = null;
}

/* ---------- 拾取 ---------- */
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
const hlBox = new THREE.Box3Helper(new THREE.Box3(), new THREE.Color(0xb5442d));
hlBox.visible = false;
scene.add(hlBox);
const chip = $('#hoverChip');

function pickAt(cx, cy) {
  ptr.x = (cx / innerWidth) * 2 - 1;
  ptr.y = -(cy / innerHeight) * 2 + 1;
  ray.setFromCamera(ptr, activeCam);
  const hits = ray.intersectObjects(activeFloor().pickables.filter(p => p.visible), true);
  if (!hits.length) return null;
  /* 只认最近命中面：墙面/玻璃同样参与遮挡，杜绝"指着墙显示墙后家具"的穿透 */
  let o = hits[0].object;
  while (o && !o.userData.pick) o = o.parent;
  return o || null;
}
let hoverT = 0;
renderer.domElement.addEventListener('pointermove', e => {
  if (planMode || vr.on) { chip.style.display = 'none'; return; }
  const now = performance.now();
  if (now - hoverT < 30) return;
  hoverT = now;
  const o = pickAt(e.clientX, e.clientY);
  if (o) {
    const bb = new THREE.Box3().setFromObject(o);
    hlBox.box.copy(bb); hlBox.visible = true;
    chip.textContent = o.userData.pick === 'room' ? o.userData.room.name : o.userData.name;
    chip.style.display = 'block';
    chip.style.left = (e.clientX + 14) + 'px';
    chip.style.top = (e.clientY + 10) + 'px';
  } else { hlBox.visible = false; chip.style.display = 'none'; }
});
let downXY = null;
const vrPointers = new Map();
let pinchDist = 0;
renderer.domElement.addEventListener('pointerdown', e => {
  downXY = [e.clientX, e.clientY];
  if (!vr.on) return;
  vrPointers.set(e.pointerId, [e.clientX, e.clientY]);
  if (vrPointers.size === 2) {
    const pts = [...vrPointers.values()];
    pinchDist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
  }
});
renderer.domElement.addEventListener('pointermove', e => {
  if (!vr.on || !vrPointers.has(e.pointerId)) return;
  const prev = vrPointers.get(e.pointerId);
  const dx = e.clientX - prev[0], dy = e.clientY - prev[1];
  vrPointers.set(e.pointerId, [e.clientX, e.clientY]);
  if (vrPointers.size === 1) {
    const k = (vr.fov * Math.PI / 180) / innerHeight * 1.7;
    vr.yaw -= dx * k;
    vr.pitch = THREE.MathUtils.clamp(vr.pitch - dy * k, -1.35, 1.35);
  } else if (vrPointers.size === 2 && pinchDist) {
    const pts = [...vrPointers.values()];
    const d2 = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
    setFov(vr.fov * pinchDist / d2);
    pinchDist = d2;
  }
});
addEventListener('pointerup', e => { vrPointers.delete(e.pointerId); pinchDist = 0; });
renderer.domElement.addEventListener('wheel', e => {
  if (!vr.on) return;
  e.preventDefault();
  setFov(vr.fov + e.deltaY * 0.03);
}, { passive: false });
renderer.domElement.addEventListener('click', e => {
  window.__clickCount = (window.__clickCount || 0) + 1;
  if (downXY && Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) > 6) return;
  if (vr.on) {
    window.__diag = { client: [e.clientX, e.clientY], vrOn: vr.on };
    vrClick(e);
    window.__diag.done = true;
    return;
  }
  const o = pickAt(e.clientX, e.clientY);
  if (!o) return;
  if (o.userData.pick === 'room') {
    showInfo({ pick: 'room', room: o.userData.room });
    const [x1, y1, x2, y2] = o.userData.room.bbox;
    const zz = activeFloor().data.z;
    hlBox.box.setFromPoints([PX(x1, y1).setY(zz), PX(x2, y2).setY(zz + 1.2)]);
    hlBox.visible = true;
  } else {
    showInfo(o.userData);
    hlBox.box.setFromObject(o); hlBox.visible = true;
  }
});

/* ---------- 信息面板 ---------- */
function roomArea(r) { const [x1, y1, x2, y2] = r.bbox; return ((x2 - x1) * (y2 - y1)); }
function roomEnter(r) {
  if (r.enter) return r.enter;
  const [x1, y1, x2, y2] = r.bbox;
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const sx = (cx < 5.3 ? -1 : 1), sy = (cy < 9.95 ? -1 : 1);
  return {
    pos: [cx + sx * Math.min(1.1, (x2 - x1) * 0.28), 2.2, cy + sy * Math.min(1.1, (y2 - y1) * 0.28)],
    look: [cx, 0.7, cy],
  };
}
function showInfo(d) {
  const p = $('#infoPanel');
  if (d.pick === 'room') {
    const r = d.room;
    const F0 = activeFloor().data;
    p.innerHTML = `
      <div class="info-tag">${F0.name}</div>
      <h2>${r.name}</h2>
      <div class="info-grid">
        <div><i>开间×进深</i><b>${(r.bbox[2] - r.bbox[0]).toFixed(1)} × ${(r.bbox[3] - r.bbox[1]).toFixed(1)} m</b></div>
        <div><i>使用面积</i><b>约 ${roomArea(r).toFixed(1)} ㎡</b></div>
        ${r.win ? `<div><i>窗</i><b>${r.win}</b></div>` : ''}
        ${r.door ? `<div><i>门</i><b>${r.door}</b></div>` : ''}
        <div><i>地面</i><b>${FLOOR_MATS[r.floor].name}</b></div>
      </div>
      <p class="info-desc">${r.desc || '该房间按图纸轴线与门窗表建模，具体装修做法详见建筑构造表。'}</p>
      <div class="info-actions">
        <button class="btn primary" id="btnEnter">进入房间浏览</button>
        <button class="btn" id="btnBack">返回总览</button>
      </div>`;
    $('#btnEnter').onclick = () => enterRoom(r);
    $('#btnBack').onclick = resetView;
  } else {
    p.innerHTML = `
      <div class="info-tag">家具</div>
      <h2>${d.name}</h2>
      <p class="info-desc">${d.desc || '按图纸家具布置等比建模。'}</p>
      <div class="info-actions"><button class="btn" id="btnBack">返回总览</button></div>`;
    $('#btnBack').onclick = resetView;
  }
  p.classList.add('open');
}
function enterRoom(r) {
  if (planMode) togglePlan(false);
  const e = roomEnter(r);
  const z = activeFloor().data.z;
  flyTo([e.pos[0], e.pos[1] + z, e.pos[2]], [e.look[0], e.look[1] + z, e.look[2]]);
  showInfo({ pick: 'room', room: r });
  const [x1, y1, x2, y2] = r.bbox;
  hlBox.box.setFromPoints([PX(x1, y1).setY(z), PX(x2, y2).setY(z + 1.2)]);
  hlBox.visible = true;
}
function resetView() {
  if (planMode) togglePlan(false);
  const z = activeFloor().data.z;
  flyTo([21, z + 16, 30], [5.3, z + 0.5, 9.5]);
  hlBox.visible = false;
  $('#infoPanel').classList.remove('open');
}

/* ============================================================
   平面图模式（正交俯视 + CAD 标注全展示，默认线框）
   ============================================================ */
const planCanvas = $('#planCanvas');
const pctx = planCanvas.getContext('2d');

function fitOrtho() {
  const aspect = innerWidth / innerHeight;
  const S = 26.5;
  orthoCam.left = -S * aspect / 2; orthoCam.right = S * aspect / 2;
  orthoCam.top = S / 2; orthoCam.bottom = -S / 2;
  orthoCam.position.set(5.95, 80, 9.35);
  orthoCam.updateProjectionMatrix();
}
function w2s(x, z) {
  const v = new THREE.Vector3(x, 0, z).project(orthoCam);
  return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight];
}
function drawDim(p1, p2, off, texts, flip = 1) {
  const dx = p2[0] - p1[0], dz = p2[1] - p1[1];
  const len = Math.hypot(dx, dz) || 1;
  const nx = -dz / len * off * flip, nz = dx / len * off * flip;
  const a = w2s(p1[0] + nx, p1[1] + nz), b = w2s(p2[0] + nx, p2[1] + nz);
  const c = pctx;
  c.strokeStyle = '#4a6b9a'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  for (const p of [a, b]) { c.beginPath(); c.moveTo(p[0] - 4, p[1] + 4); c.lineTo(p[0] + 4, p[1] - 4); c.stroke(); }
  const segs = Array.isArray(texts) ? texts : [texts];
  const total = segs.reduce((s, t) => s + parseFloat(t), 0);
  c.font = '13px "IBM Plex Mono",monospace';
  c.textAlign = 'center'; c.textBaseline = 'bottom';
  let start = p1;
  for (const t of segs) {
    const frac = parseFloat(t) / total;
    const end = [p1[0] + dx * frac, p1[1] + dz * frac];
    const m1 = w2s(start[0] + nx, start[1] + nz), m2 = w2s(end[0] + nx, end[1] + nz);
    c.beginPath(); c.moveTo(m1[0], m1[1]); c.lineTo(m2[0], m2[1]); c.stroke();
    for (const p of [m1, m2]) { c.beginPath(); c.moveTo(p[0] - 4, p[1] + 4); c.lineTo(p[0] + 4, p[1] - 4); c.stroke(); }
    const mx = (m1[0] + m2[0]) / 2, my = (m1[1] + m2[1]) / 2;
    const vert = Math.abs(m2[1] - m1[1]) > Math.abs(m2[0] - m1[0]);
    c.save(); c.translate(mx, my);
    if (vert) c.rotate(-Math.PI / 2);
    c.fillText(t, 0, -5);
    c.restore();
    start = end;
  }
}

function drawPlan() {
  fitOrtho();
  const F0 = activeFloor().data;
  const c = pctx;
  c.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  c.clearRect(0, 0, innerWidth, innerHeight);
  const ink = '#26221a', accent = '#b5442d';

  /* 轴线 */
  c.strokeStyle = 'rgba(70,96,140,.5)'; c.lineWidth = 1;
  c.setLineDash([10, 4, 2, 4]);
  for (const x of GRID.x.vals) {
    const a = w2s(x, -1.0), b = w2s(x, 20.9);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  }
  for (const y of GRID.y.vals.slice(0, 5)) {
    const a = w2s(-1.0, y), b = w2s(11.6, y);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  }
  c.setLineDash([]);
  c.font = '12px "IBM Plex Mono",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
  GRID.x.vals.forEach((x, i) => {
    const p = w2s(x, 20.55);
    c.beginPath(); c.arc(p[0], p[1], 11, 0, 7); c.strokeStyle = accent; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = accent; c.fillText(GRID.x.labels[i], p[0], p[1]);
  });
  GRID.y.labels.slice(0, 5).forEach((lb, i) => {
    const p = w2s(-0.55, GRID.y.vals[i]);
    c.beginPath(); c.arc(p[0], p[1], 11, 0, 7); c.strokeStyle = accent; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = accent; c.fillText(lb, p[0], p[1]);
  });

  /* 尺寸 */
  drawDim([0, 0], [10.6, 0], -0.8, ['3500', '3500', '3600']);
  drawDim([0, 0], [10.6, 0], -1.7, ['10600']);
  drawDim([0, 0], [0, 19.9], -1.1, ['5500', '4000', '4100', '4800', '1500'], -1);
  drawDim([0, 0], [0, 19.9], -2.1, ['19900'], -1);
  drawDim([0, 19.9], [10.6, 19.9], 0.8, ['10600']);

  /* 窗 */
  for (const w of F0.walls) {
    const A = PX(...w.a);
    const dir = new THREE.Vector3().subVectors(PX(...w.b), A);
    const L = dir.length(); dir.normalize();
    const n = new THREE.Vector3(-dir.z, 0, dir.x);
    for (const op of w.ops) {
      if (op.type !== 'win') continue;
      const p0 = A.clone().addScaledVector(dir, op.o - op.w / 2);
      const p1 = A.clone().addScaledVector(dir, op.o + op.w / 2);
      c.strokeStyle = ink; c.lineWidth = 1;
      for (const off of [-w.t / 2, 0, w.t / 2]) {
        const a = w2s(p0.x + n.x * off, p0.z + n.z * off);
        const b = w2s(p1.x + n.x * off, p1.z + n.z * off);
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
    }
  }
  /* 门 / 推拉 / 洞口 */
  for (const w of F0.walls) {
    const A = PX(...w.a);
    const dir = new THREE.Vector3().subVectors(PX(...w.b), A);
    dir.normalize();
    const n = new THREE.Vector3(-dir.z, 0, dir.x);
    for (const op of w.ops) {
      if (op.type === 'door') {
        const hingeFrac = op.swing[0] === 's' ? (op.o - op.w / 2) : (op.o + op.w / 2);
        const otherFrac = op.swing[0] === 's' ? (op.o + op.w / 2) : (op.o - op.w / 2);
        const H = A.clone().addScaledVector(dir, hingeFrac);
        const O = A.clone().addScaledVector(dir, otherFrac);
        const side = op.swing[1];
        const leafEnd = H.clone().addScaledVector(n, side * op.w);
        const a1 = w2s(H.x, H.z), a2 = w2s(leafEnd.x, leafEnd.z), a3 = w2s(O.x, O.z);
        c.strokeStyle = ink; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(a1[0], a1[1]); c.lineTo(a2[0], a2[1]); c.stroke();
        const angH = Math.atan2(a3[1] - a1[1], a3[0] - a1[0]);
        const angL = Math.atan2(a2[1] - a1[1], a2[0] - a1[0]);
        let d = angL - angH; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        c.lineWidth = 0.8;
        c.beginPath();
        c.arc(a1[0], a1[1], Math.hypot(a2[0] - a1[0], a2[1] - a1[1]), angH, angH + d, d < 0);
        c.stroke();
      } else if (op.type === 'slide' || op.type === 'pass') {
        const p0 = A.clone().addScaledVector(dir, op.o - op.w / 2);
        const p1 = A.clone().addScaledVector(dir, op.o + op.w / 2);
        c.strokeStyle = ink; c.lineWidth = op.type === 'slide' ? 1.2 : 0.8;
        if (op.type === 'pass') c.setLineDash([5, 4]);
        for (const off of [w.t * 0.25, -w.t * 0.25]) {
          const a = w2s(p0.x + n.x * off, p0.z + n.z * off);
          const b = w2s(p1.x + n.x * off, p1.z + n.z * off);
          c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
        }
        c.setLineDash([]);
      }
    }
  }

  /* 房间名 + 面积 */
  c.textAlign = 'center';
  for (const r of F0.rooms) {
    const [x1, y1, x2, y2] = r.bbox;
    const p = w2s((x1 + x2) / 2, (y1 + y2) / 2);
    c.fillStyle = ink;
    c.font = '600 15px "Noto Serif SC",serif';
    c.fillText(r.name, p[0], p[1] - 4);
    c.fillStyle = '#7a7466';
    c.font = '11px "IBM Plex Mono",monospace';
    c.fillText(roomArea(r).toFixed(1) + '㎡', p[0], p[1] + 12);
  }

  /* 楼梯标注 */
  const hasStair = F0.rooms.some(r => r.stair);
  if (hasStair) {
    let p = w2s(0.75, 8.1); c.fillStyle = ink; c.font = '600 13px "Noto Serif SC",serif'; c.fillText('下', p[0], p[1]);
    p = w2s(1.75, 7.3); c.fillText('上', p[0], p[1]);
  }
  if (F0.core || F0.lift) {
    const p = w2s(1.25, 11.0);
    c.font = '12px "IBM Plex Mono",monospace'; c.fillStyle = ink; c.fillText('电梯', p[0], p[1]);
  }

  /* 露台坡度 */
  if (F0.id === 'f9' || F0.id === 'rf') {
    for (const [x, z, t] of [[2.2, 16.8, 'i=1%'], [6.2, 17.6, 'i=2%'], [9.6, 16.6, 'i=1%']]) {
      const a = w2s(x, z), b = w2s(x + 1.4, z + 0.9);
      c.strokeStyle = '#7a7466'; c.fillStyle = '#7a7466'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      c.save(); c.translate(b[0], b[1]); c.rotate(ang);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(-7, -3); c.lineTo(-7, 3); c.closePath(); c.fill();
      c.restore();
      c.font = '10px "IBM Plex Mono",monospace';
      c.fillText(t, a[0], a[1] - 4);
    }
  }

  /* 标高 */
  const [mx, mz, mv] = F0.mark || [4.75, 7.5, F0.level];
  const lv = w2s(mx, mz);
  c.strokeStyle = accent; c.fillStyle = accent; c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(lv[0] - 9, lv[1] - 14); c.lineTo(lv[0] + 9, lv[1] - 14); c.lineTo(lv[0], lv[1] - 4); c.closePath();
  c.stroke();
  c.beginPath(); c.moveTo(lv[0], lv[1] - 4); c.lineTo(lv[0], lv[1] + 6); c.stroke();
  c.beginPath(); c.moveTo(lv[0] - 9, lv[1] - 14); c.lineTo(lv[0] + 30, lv[1] - 14); c.stroke();
  c.font = '600 13px "IBM Plex Mono",monospace';
  c.fillText(mv, lv[0] + 34, lv[1] - 16);

  /* 指北针 */
  const np = w2s(12.6, 1.2);
  c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = 1.4;
  c.beginPath(); c.arc(np[0], np[1], 17, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(np[0], np[1] - 12); c.lineTo(np[0] - 5, np[1] + 8); c.lineTo(np[0], np[1] + 3); c.lineTo(np[0] + 5, np[1] + 8); c.closePath(); c.fill();
  c.font = '600 12px "Noto Serif SC",serif';
  c.fillText('北', np[0], np[1] + 30);

  /* 图框 + 图签 */
  const m = 14;
  c.strokeStyle = ink; c.lineWidth = 1.6;
  c.strokeRect(m, m, innerWidth - 2 * m, innerHeight - 2 * m);
  c.lineWidth = 0.8;
  c.strokeRect(m + 4, m + 4, innerWidth - 2 * m - 8, innerHeight - 2 * m - 8);
  const tw = 300, th = 92;
  const tx = innerWidth - m - 4 - tw, ty = innerHeight - m - 4 - th;
  c.fillStyle = 'rgba(244,239,228,.92)';
  c.fillRect(tx, ty, tw, th);
  c.strokeRect(tx, ty, tw, th);
  c.beginPath(); c.moveTo(tx, ty + 30); c.lineTo(tx + tw, ty + 30); c.stroke();
  c.beginPath(); c.moveTo(tx, ty + 58); c.lineTo(tx + tw, ty + 58); c.stroke();
  c.textAlign = 'left';
  c.fillStyle = ink;
  c.font = '600 15px "Noto Serif SC",serif';
  c.fillText(`${F0.name}    1:100`, tx + 12, ty + 20);
  c.font = '11px "IBM Plex Mono",monospace'; c.fillStyle = '#5c5648';
  c.fillText(`项目  ${META.project} · ${F0.sheet} · 标高 ${F0.level}`, tx + 12, ty + 47);
  c.fillText(`绘制 ${META.date} · 建施 · 依据原图等比建模`, tx + 12, ty + 76);
  c.textAlign = 'center';
}

function togglePlan(v) {
  planMode = v === undefined ? !planMode : v;
  planCanvas.style.display = planMode ? 'block' : 'none';
  if (planMode) {
    if (!prevModeBeforePlan) prevModeBeforePlan = mode;
    if (mode !== 'wire') setMode('wire');
    activeCam = orthoCam;
    controls.object = orthoCam;
    controls.enableRotate = false;
    controls.target.set(5.2, 0, 9.7);
    orthoCam.position.set(5.95, 80, 9.35);
    orthoCam.zoom = 1;
    orthoCam.updateProjectionMatrix();
    controls.update();
    chip.style.display = 'none';
    hlBox.visible = false;
    drawPlan();
  } else {
    activeCam = perspCam;
    controls.object = perspCam;
    controls.enableRotate = true;
    if (prevModeBeforePlan && prevModeBeforePlan !== 'wire') setMode(prevModeBeforePlan);
    prevModeBeforePlan = null;
    controls.update();
  }
  syncUI();
}

/* ============================================================
   VR 全景漫游（第一人称 720° 环视）
   ============================================================ */
const vr = { on: false, yaw: 0, pitch: -0.04, fov: 65 };
let vrFly = null;

function setFov(f) {
  vr.fov = THREE.MathUtils.clamp(f, 28, 95);
  perspCam.fov = vr.fov;
  perspCam.updateProjectionMatrix();
}
function applyLook() {
  perspCam.rotation.order = 'YXZ';
  perspCam.rotation.set(vr.pitch, vr.yaw, 0);
}
function vrDefaultView() {
  const F0 = activeFloor().data;
  const r = F0.rooms.find(r => ['gt', 'gk', 'guoke'].includes(r.id)) || F0.rooms[0];
  const [x1, y1, x2, y2] = r.bbox;
  const e = r.enter || roomEnter(r);
  return { pos: new THREE.Vector3(e.pos[0], F0.z + e.pos[1], e.pos[2]), yaw: vr.yaw, pitch: -0.04, room: r };
}
function enterVR() {
  if (planMode) togglePlan(false);
  vr.on = true;
  controls.enabled = false;
  setFov(65);
  const v = vrDefaultView();
  perspCam.position.copy(v.pos);
  vr.yaw = v.yaw; vr.pitch = v.pitch;
  /* 面向最近的门洞光环，保证一进来就看到可行方向 */
  let bd = 1e9, bt = null;
  for (const p of activeFloor().pickables) {
    if (p.userData.pick !== 'hotspot') continue;
    const d = (p.position.x - perspCam.position.x) ** 2 + (p.position.z - perspCam.position.z) ** 2;
    if (d < bd) { bd = d; bt = p.position; }
  }
  if (bt) vr.yaw = Math.atan2(-(bt.x - perspCam.position.x), -(bt.z - perspCam.position.z));
  vr.pitch = -0.05;
  applyLook();
  activeFloor().hot.visible = true;
  $('#vrChip').style.display = 'block';
  syncUI();
}
function exitVR() {
  vr.on = false;
  vrFly = null;
  controls.enabled = true;
  activeFloor().hot.visible = false;
  const cp = Math.cos(vr.pitch);
  const fwd = new THREE.Vector3(-Math.sin(vr.yaw) * cp, Math.sin(vr.pitch), -Math.cos(vr.yaw) * cp);
  controls.target.copy(perspCam.position).addScaledVector(fwd, 4);
  controls.update();
  $('#vrChip').style.display = 'none';
  syncUI();
}
function toggleVR() { vr.on ? exitVR() : enterVR(); }

function vrWalkTo(target) {
  const from = perspCam.position.clone();
  const dur = Math.min(1.2, 0.35 + from.distanceTo(target) * 0.12) * 1000;
  vrFly = { t0: performance.now(), dur, p0: from, p1: target.clone() };
}


function buildHotspots(parent, F0, pickables) {
  for (const w of F0.walls) {
    const A = PX(...w.a);
    const dir = new THREE.Vector3().subVectors(PX(...w.b), A);
    const L = dir.length(); if (L < 0.1) continue;
    dir.normalize();
    const n = new THREE.Vector3(-dir.z, 0, dir.x);
    for (const op of w.ops) {
      if (!['door', 'pass', 'slide'].includes(op.type)) continue;
      const c = A.clone().addScaledVector(dir, op.o);
      for (const side of [1, -1]) {
        const s = new THREE.Mesh(hotPlaneGeo, hotPlaneMat());
        s.rotation.x = -Math.PI / 2;
        s.position.set(c.x + n.x * side * 0.55, 0.06, c.z + n.z * side * 0.55);
        s.renderOrder = 5;
        s.userData = { pick: 'hotspot', floorId: F0.id, doorC: [c.x, c.z], n: [n.x, n.z],
          name: '门口 · 点击穿越', desc: '点击此光环，将穿过门洞移动到另一侧空间。' };
        parent.add(s);
        pickables.push(s);
      }
    }
  }
}

function vrClick(e) {
  ptr.x = (e.clientX / innerWidth) * 2 - 1;
  ptr.y = -(e.clientY / innerHeight) * 2 + 1;
  ray.setFromCamera(ptr, activeCam);
  const hits = ray.intersectObjects(activeFloor().pickables.filter(p => p.visible), true);
  /* 光环（穿越门洞）拥有最高优先级：只要射线扫到就穿越 */
  let hotspot = null, hotspotPt = null, roomHit = null, roomPt = null, furnHit = null, furnPt = null;
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData.pick) o = o.parent;
    if (!o) continue;
    const k = o.userData.pick;
    if (k === 'hotspot') { if (!hotspot) hotspot = o; }
    else if (k === 'room') { if (!roomHit) roomHit = { o, pt: h.point.clone() }; }
    else if (!furnHit) furnHit = { o, pt: h.point.clone() };
    if (hotspot && roomHit && furnHit) break;
  }
  if (hotspot) {
    const [cx, cz] = hotspot.userData.doorC;
    const [nx, nz] = hotspot.userData.n;
    const side = Math.sign((perspCam.position.x - cx) * nx + (perspCam.position.z - cz) * nz) || 1;
    vrWalkTo(new THREE.Vector3(cx - nx * side * 1.1, activeFloor().data.z + 1.6, cz - nz * side * 1.1));
    return;
  }
  if (roomHit) {
    const r = roomHit.o.userData.room;
    const [bx1, by1, bx2, by2] = r.bbox;
    const tx = THREE.MathUtils.clamp(roomHit.pt.x, bx1 + 0.3, bx2 - 0.3);
    const tz = THREE.MathUtils.clamp(roomHit.pt.z, by1 + 0.3, by2 - 0.3);
    vrWalkTo(new THREE.Vector3(tx, activeFloor().data.z + 1.6, tz));
    hlBox.box.setFromPoints([PX(bx1, by1).setY(activeFloor().data.z), PX(bx2, by2).setY(activeFloor().data.z + 1.2)]);
    hlBox.visible = true;
    showInfo({ pick: 'room', room: r });
    return;
  }
  if (furnHit) {
    showInfo(furnHit.o.userData);
    hlBox.box.setFromObject(furnHit.o); hlBox.visible = true;
  }
}

/* ============================================================
   UI
   ============================================================ */
function syncUI() {
  document.querySelectorAll('#modeSeg button').forEach(b =>
    b.classList.toggle('on', b.dataset.m === mode));
  $('#btnNight').classList.toggle('on', night);
  $('#btnNight').textContent = night ? '🌙 夜晚' : '☀️ 白天';
  $('#btnFurn').classList.toggle('on', activeFloor().furn.visible);
  $('#btnFurn').textContent = activeFloor().furn.visible ? '家具 · 显' : '家具 · 隐';
  $('#btnPlan').classList.toggle('on', planMode);
  const bv = $('#btnVR');
  bv.classList.toggle('on', vr.on);
  bv.textContent = vr.on ? '退出 VR' : 'VR 漫游';
  document.querySelectorAll('.floor-btn').forEach(b =>
    b.classList.toggle('on', b.dataset.f === activeId));
  document.body.classList.toggle('is-night', night && mode === 'real');
}

$('#modeSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  setMode(b.dataset.m);
});
$('#btnNight').onclick = () => setNight(!night);
$('#btnFurn').onclick = () => { const f = activeFloor().furn; f.visible = !f.visible; syncUI(); };
$('#btnPlan').onclick = () => togglePlan();
$('#btnVR').onclick = () => toggleVR();
$('#btnRooms').onclick = () => $('#sidebar').classList.toggle('open');
$('#btnReset').onclick = resetView;

/* 楼层切换器 */
const strip = $('#floorStrip');
FLOORS.forEach(F0 => {
  const b = document.createElement('button');
  b.className = 'floor-btn';
  b.dataset.f = F0.id;
  b.innerHTML = `<span>${F0.id === 'rf' ? 'RF' : F0.id === 'fb1' ? 'B1' : F0.id.slice(1)}</span><i>${F0.level}</i>`;
  b.title = F0.name;
  b.onclick = () => switchFloor(F0.id);
  strip.appendChild(b);
});

/* 房间列表 */
function buildRoomList() {
  const listEl = $('#roomList');
  listEl.innerHTML = '';
  activeFloor().data.rooms.forEach(r => {
    const d = document.createElement('div');
    d.className = 'room-item';
    d.innerHTML = `<span class="room-name">${r.name}</span><span class="room-area">${roomArea(r).toFixed(1)}㎡</span>`;
    d.onclick = () => enterRoom(r);
    listEl.appendChild(d);
  });
}

addEventListener('keydown', e => {
  if (e.key === '1') setMode('real');
  if (e.key === '2') setMode('white');
  if (e.key === '3') setMode('wire');
  if (e.key === 'n' || e.key === 'N') setNight(!night);
  if (e.key === 'f' || e.key === 'F') { const f = activeFloor().furn; f.visible = !f.visible; syncUI(); }
  if (e.key === 'p' || e.key === 'P') togglePlan();
  if (e.key === 'r' || e.key === 'R') resetView();
});

let lastW = innerWidth, lastH = innerHeight;
addEventListener('resize', () => {
  if (innerWidth === lastW && innerHeight === lastH) return;
  lastW = innerWidth; lastH = innerHeight;
  renderer.setSize(innerWidth, innerHeight);
  perspCam.aspect = innerWidth / innerHeight;
  perspCam.updateProjectionMatrix();
  planCanvas.width = innerWidth * devicePixelRatio;
  planCanvas.height = innerHeight * devicePixelRatio;
  planCanvas.style.width = innerWidth + 'px';
  planCanvas.style.height = innerHeight + 'px';
});
dispatchEvent(new Event('resize'));

/* ---------- 主循环 ---------- */
let booted = false;
let hudTick = 0;
function loop() {
  requestAnimationFrame(loop);
  tickFly();
  if (vr.on) {
    if (vrFly) {
      const k = Math.min(1, (performance.now() - vrFly.t0) / vrFly.dur);
      const e2 = 1 - Math.pow(1 - k, 3);
      perspCam.position.lerpVectors(vrFly.p0, vrFly.p1, e2);
      if (k >= 1) vrFly = null;
    }
    applyLook();
    if (++hudTick % 12 === 0) {
      const p = perspCam.position;
      const rr = activeFloor().data.rooms.find(r =>
        p.x >= r.bbox[0] && p.x <= r.bbox[2] && p.z >= r.bbox[1] && p.z <= r.bbox[3]);
      const chipEl = document.getElementById('vrChip');
      if (chipEl) chipEl.textContent = rr ? (rr.name + ' · ' + roomArea(rr).toFixed(1) + '㎡ ｜ 拖拽环视 · 点击地面行走 · 光环穿门') : '';
    }
    const hs = activeFloor().hot.children;
    const pulse = 1 + 0.1 * Math.sin(performance.now() * 0.004);
    for (const s of hs) s.scale.set(0.42 * pulse, 0.42 * pulse, 1);
  } else {
    controls.update();
  }
  if (!planMode) {
    /* 动态 near：near ≈ 视距 3%，深度量化噪声减半，抑制掠射角共享棱边的次采样深度打平闪烁 */
    const dc = perspCam.position.distanceTo(controls.target);
    const nr = THREE.MathUtils.clamp(dc * 0.03, 0.15, 2.5);
    if (Math.abs(perspCam.near - nr) > 0.005) {
      perspCam.near = nr; perspCam.far = nr + 260;
      perspCam.updateProjectionMatrix();
    }
  }
  renderer.render(scene, activeCam);
  if (planMode) drawPlan();
  if (!booted) {
    booted = true;
    const L = document.getElementById('loading');
    if (L) { L.classList.add('done'); setTimeout(() => L.remove(), 450); }
  }
}
solidApplyEnv();
switchFloor('f9');
syncUI();
loop();

/* VR 点击压测：视口网格采样射线，统计可直接点中的门洞穿越光环 */
window.__zclick = () => {
  const hitsList = [];
  for (let gx = 0.1; gx <= 0.9; gx += 0.08) {
    for (let gy = 0.25; gy <= 0.85; gy += 0.08) {
      ptr.set(gx * 2 - 1, -(gy * 2 - 1));
      ray.setFromCamera(ptr, activeCam);
      const hits = ray.intersectObjects(activeFloor().pickables.filter(p => p.visible), true);
      for (const h of hits) {
        let o = h.object;
        while (o && !o.userData.pick) o = o.parent;
        if (o && o.userData.pick === 'hotspot') { hitsList.push({ gx: +gx.toFixed(2), gy: +gy.toFixed(2), name: o.userData.name }); break; }
      }
    }
  }
  return { clickable: hitsList.length, samples: hitsList.slice(0, 6) };
};

/* 点击链路诊断：给定 NDC 坐标，返回射线命中的对象类型序列 */
window.__probeRay = (nx, ny) => {
  ptr.set(nx, ny);
  ray.setFromCamera(ptr, activeCam);
  const hits = ray.intersectObjects(activeFloor().pickables.filter(p => p.visible), true);
  const seq = [];
  for (const h of hits.slice(0, 8)) {
    let o = h.object;
    while (o && !o.userData.pick) o = o.parent;
    seq.push(o ? o.userData.pick : '?');
  }
  return seq.join(' > ') || 'none';
};

/* 开洞-隔墙相交检查：门窗/洞口横跨内隔墙 = 定位错误 */
window.__openCheck = () => {
  const out = [];
  FLOORS.forEach(F0 => {
    const walls = F0.walls;
    for (const w of walls) {
      const A = [w.a[0], w.a[1]];
      const du = [w.b[0] - w.a[0], w.b[1] - w.a[1]];
      const L = Math.hypot(du[0], du[1]); if (L < 0.05) continue;
      const u = [du[0] / L, du[1] / L];
      for (const v of walls) {
        if (v === w) continue;
        const dv = [v.b[0] - v.a[0], v.b[1] - v.a[1]];
        const Lv = Math.hypot(dv[0], dv[1]); if (Lv < 0.05) continue;
        const uu = [dv[0] / Lv, dv[1] / Lv];
        const den = u[0] * (-uu[1]) - u[1] * (-uu[0]);
        if (Math.abs(den) < 1e-9) continue;
        const q = [v.a[0] - A[0], v.a[1] - A[1]];
        const s = (q[0] * (-uu[1]) - q[1] * (-uu[0])) / den;
        const t2 = (q[0] * u[1] - q[1] * u[0]) / den;
        if (t2 < -0.01 || t2 > Lv + 0.01) continue;
        if (s < -0.05 || s > L + 0.05) continue;
        for (const op of v.ops) {
          if (!['win', 'door', 'slide', 'pass', 'lift'].includes(op.type)) continue;
          const o1 = op.o - op.w / 2, o2 = op.o + op.w / 2;
          const crossed = t2 > 0.02 && t2 < Lv - 0.02;
          if (crossed && s > o1 - 0.02 && s < o2 + 0.02) {
            out.push(`[${F0.id}] 「${v.name}」的 ${op.code} 开洞(${o1.toFixed(2)}–${o2.toFixed(2)})被「${w.name}」在 s=${s.toFixed(2)} 处截断`);
          }
        }
      }
    }
  });
  return out.length ? out : ['门窗开洞均未跨墙 ✓'];
};

/* 穿插审计（逐 mesh 精确版）：家具 mesh × 墙 mesh、家具 mesh × 家具 mesh 的真实穿插 */
window.__audit = () => {
  const out = [];
  const shrink = (b, s = 0.012) => { const c = b.clone(); c.min.addScalar(s); c.max.addScalar(-s); return c; };
  for (const id in floorObjs) {
    const wm = [], fm = [];
    floorObjs[id].solid.traverse(o => {
      if (!o.isMesh) return;
      if (o.parent.name && o.parent.name.startsWith('wall:')) wm.push({ n: o.parent.name, b: shrink(new THREE.Box3().setFromObject(o)) });
    });
    floorObjs[id].furn.traverse(o => {
      if (!o.isMesh) return;
      let g = o, nm = '';
      while (g && !g.userData.name) g = g.parent;
      if (g) nm = g.userData.name;
      fm.push({ n: nm, b: shrink(new THREE.Box3().setFromObject(o)) });
    });
    const hit = (a, b) => a.min.x < b.max.x && a.max.x > b.min.x && a.min.y < b.max.y && a.max.y > b.min.y && a.min.z < b.max.z && a.max.z > b.min.z;
    for (const f of fm) for (const w of wm) {
      if (hit(f.b, w.b)) { out.push(`[${id}] 「${f.n}」× 墙「${w.n}」 mesh@(${f.b.min.x.toFixed(2)},${f.b.min.z.toFixed(2)})`); break; }
    }
    for (let i = 0; i < fm.length; i++) for (let j = i + 1; j < fm.length; j++) {
      if (fm[i].n === fm[j].n) continue;
      if (hit(fm[i].b, fm[j].b)) { out.push(`[${id}] 「${fm[i].n}」× 「${fm[j].n}」`); break; }
    }
  }
  return out.length ? out : ['全部干净 ✓'];
};

/* 调试/无头截图钩子 *//* 调试/无头截图钩子 */
window.__snap = () => {
  renderer.render(scene, activeCam);
  return renderer.domElement.toDataURL('image/jpeg', 0.85);
};
window.__step = (n = 1) => {
  for (let i = 0; i < n; i++) {
    tickFly();
    controls.update();
    if (vr.on) applyLook();
    renderer.render(scene, activeCam);
    if (planMode) drawPlan();
  }
  return n;
};
window.__app = { setMode, setNight, togglePlan, enterVR, exitVR, enterRoom, resetView, switchFloor, FLOORS, perspCam, controls, cancelFly: () => { flyAnim = null; }, pickables: () => activeFloor().pickables };
/* 全楼层最终去穿插（在所有组装完成后统一执行） */
for (const id in floorObjs) decollideFloor(floorObjs[id].solid, floorObjs[id].furn);

/* 性能优化：静态网格冻结世界矩阵（渲染期免每帧矩阵分解） */
for (const id in floorObjs) {
  const o = floorObjs[id];
  [o.solid, o.edge, o.furn].forEach(root => root.traverse(x => {
    x.updateMatrix();
    x.matrixAutoUpdate = false;
  }));
}

window.__perf = () => ({
  calls: renderer.info.render.calls,
  tris: renderer.info.render.triangles,
  geoms: renderer.info.memory.geometries,
  programs: renderer.info.programs ? renderer.info.programs.length : 0,
});
window.__auditHelper = { Box3: THREE.Box3, V3: THREE.Vector3 };
window.__app.floorObjs = floorObjs;
window.__app.decollideFloor = decollideFloor;
window.__vr = {
  look: (yaw, pitch) => { vr.yaw = yaw; vr.pitch = pitch; applyLook(); },
  walk: (x, y, z2) => vrWalkTo(new THREE.Vector3(x, y, z2)),
  walkV: v => vrWalkTo(v),
  fov: setFov,
  project: (x, y, z2) => { const v = new THREE.Vector3(x, y, z2).project(perspCam); return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight]; },
  V: (x, y, z2) => new THREE.Vector3(x, y, z2),
};

/* 缩放维度的频闪压力测试：逐档相机距离 × 多角度 × 5mm 抖动，
   返回 {距离: 最差机位的翻转像素占比%}，用于定位深度精度临界点。 */
window.__zstress = (distances = [6, 12, 20, 30, 45, 65, 90, 120], angles = 12, jitter = 0.005) => {
  const W = 320, H = 200;
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const octx = out.getContext('2d', { willReadFrequently: true });
  const z = activeFloor().data.z;
  const camSave = perspCam.position.clone(), tgtSave = controls.target.clone();
  const result = {};
  for (const D of distances) {
    let worst = 0;
    for (let k = 0; k < angles; k++) {
      const th = k / angles * Math.PI * 2;
      const pos = new THREE.Vector3(5.3 + Math.cos(th) * D * 0.8, z + 5 + D * 0.45, 9.5 + Math.sin(th) * D * 0.8);
      const tgt = new THREE.Vector3(5.3, z + 0.5, 9.5);
      const grab = () => {
        perspCam.position.copy(pos);
        controls.target.copy(tgt);
        perspCam.lookAt(tgt);
        renderer.render(scene, perspCam);
        octx.drawImage(renderer.domElement, 0, 0, W, H);
        return octx.getImageData(0, 0, W, H).data;
      };
      const f1 = grab();
      const toward = new THREE.Vector3().subVectors(tgt, pos).normalize().multiplyScalar(jitter);
      perspCam.position.add(toward);
      perspCam.lookAt(tgt);
      renderer.render(scene, perspCam);
      octx.drawImage(renderer.domElement, 0, 0, W, H);
      const f2 = octx.getImageData(0, 0, W, H).data;
      const mask = new Uint8Array(W * H);
      for (let i = 0, p = 0; i < f1.length; i += 4, p++) {
        const d = Math.abs(f1[i] - f2[i]) + Math.abs(f1[i+1] - f2[i+1]) + Math.abs(f1[i+2] - f2[i+2]);
        if (d > 45) mask[p] = 1;
      }
      let inner = 0;
      for (let yy = 1; yy < H - 1; yy++) for (let xx = 1; xx < W - 1; xx++) {
        const p = yy * W + xx;
        if (mask[p] && mask[p-1] && mask[p+1] && mask[p-W] && mask[p+W]) inner++;
      }
      worst = Math.max(worst, inner / (W * H) * 100);
    }
    result[D] = Math.round(worst * 100) / 100;
  }
  perspCam.position.copy(camSave);
  controls.target.copy(tgtSave);
  return result;
};

/* 频闪压力测试：36 个环视机位，每个机位向目标推进 3cm 渲两帧。
   3cm 在数十米距离上视差 <0.5px，正常表面像素应当不变；
   z-fighting 表面会整片翻转。返回每个机位的“变化像素占比%”。 */
window.__zflick = (n = 36, jitter = 0.005) => {
  const W = 320, H = 200;
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const octx = out.getContext('2d', { willReadFrequently: true });
  const ratios = [], masks = [];
  const z = activeFloor().data.z;
  const camSave = perspCam.position.clone(), tgtSave = controls.target.clone();
  let worstPoses = [];
  for (let k = 0; k < n; k++) {
    const th = k / n * Math.PI * 2;
    const h = z + 10 + 14 * Math.abs(Math.sin(k * 1.7));
    const pos = new THREE.Vector3(5.3 + Math.cos(th) * 28, h, 9.5 + Math.sin(th) * 28);
    const tgt = new THREE.Vector3(5.3, z + 0.5, 9.5);
    const grab = () => {
      perspCam.position.copy(pos);
      controls.target.copy(tgt);
      perspCam.lookAt(tgt);
      renderer.render(scene, perspCam);
      octx.drawImage(renderer.domElement, 0, 0, W, H);
      return octx.getImageData(0, 0, W, H).data;
    };
    const f1 = grab();
    const toward = new THREE.Vector3().subVectors(tgt, pos).normalize().multiplyScalar(jitter);
    perspCam.position.add(toward);
    perspCam.lookAt(tgt);
    renderer.render(scene, perspCam);
    octx.drawImage(renderer.domElement, 0, 0, W, H);
    const f2 = octx.getImageData(0, 0, W, H).data;
    /* 差异掩膜：通道差>25 记为翻转像素 */
    const mask = new Uint8Array(W * H);
    let diff = 0;
    for (let i = 0, p = 0; i < f1.length; i += 4, p++) {
      const d = Math.abs(f1[i] - f2[i]) + Math.abs(f1[i+1] - f2[i+1]) + Math.abs(f1[i+2] - f2[i+2]);
      if (d > 45) { mask[p] = 1; diff++; }
    }
    /* 腐蚀一次：只保留大块内部的翻转像素（剔除 1px 视差边缘噪声） */
    const inner = new Uint8Array(W * H);
    let innerCnt = 0;
    for (let yy = 1; yy < H - 1; yy++) for (let xx = 1; xx < W - 1; xx++) {
      const p = yy * W + xx;
      if (mask[p] && mask[p-1] && mask[p+1] && mask[p-W] && mask[p+W]) { inner[p] = 1; innerCnt++; }
    }
    ratios.push(Math.round(innerCnt / (W * H) * 10000) / 100);
    if (innerCnt > 30) {
      const m = new Uint8ClampedArray(W * H * 4);
      for (let p = 0; p < W * H; p++) {
        const v = inner[p] ? 255 : (mask[p] ? 90 : 30);
        m[p*4] = inner[p] ? 255 : v; m[p*4+1] = mask[p] ? 60 : 28; m[p*4+2] = 28; m[p*4+3] = 255;
      }
      masks.push({ pose: k, png: null, data: m, W, H });
      worstPoses.push(k);
    }
  }
  perspCam.position.copy(camSave);
  controls.target.copy(tgtSave);
  /* 最差机位掩膜转 dataURL */
  let worstMask = null;
  if (masks.length) {
    masks.sort((a, b) => b.data.length && 0);
    const mk = masks[masks.length - 1];
    const c = document.createElement('canvas'); c.width = mk.W; c.height = mk.H;
    c.getContext('2d').putImageData(new ImageData(mk.data, mk.W, mk.H), 0, 0);
    worstMask = c.toDataURL('image/png');
  }
  return { ratios, worstMask, worstPoses };
};
