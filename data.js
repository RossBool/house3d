/* ============================================================
   周湍淇住宅楼 · 全楼层 互动模型 数据层
   plan(x, y)：原点在①轴∩Ⓔ轴（西北角），x 向东 0→10.6，y 向南 0→19.9
   映射 three.js：X = x，Z = y（北 = -Z）；各楼层组整体抬高至标高 z
   ============================================================ */

const META = {
  project: '周湍淇住宅楼',
  owner: '周湍淇',
  date: '2025-11',
  total: '地下 1 层 + 地上 9 层 · 建筑总高 31.25m',
  intro: '依据《周湍淇建筑修改图 2025.11.10》全套建筑施工图等比建模：负一层储藏、首层车库与沿街铺面、二至五层与七层为合租式标准层（一房一厅/单间/两房一厅）、六层与八层为整层大宅、九层为带大露台的顶层宅邸，屋面层为上人屋面。使用右侧楼层切换器逐层查看 3D 与平面图。',
};

const GRID = {
  x: { vals: [0, 3.5, 7.0, 10.6], labels: ['1', '2', '3', '4'] },
  y: { vals: [0, 5.5, 9.5, 13.6, 18.4, 19.9], labels: ['E', 'D', 'C', 'B', 'A', null] },
};

const H_STD = 3.0;
const H_PARAPET = 1.5;

const FLOOR_MATS = {
  wood: { color: 0xb08a5e, rough: 0.72, name: '实木地板' },
  tile: { color: 0xcdd0d2, rough: 0.35, name: '防滑地砖' },
  stone: { color: 0xd8d4c8, rough: 0.42, name: '抛光砖/大理石' },
  deck: { color: 0x9aa0a2, rough: 0.8, name: '防滑露台砖' },
  cement: { color: 0xb8b2a4, rough: 0.95, name: '水泥砂浆地面' },
};

/* 电梯井壁（一至九层通用） */
const SHAFT_WALLS = [
  { a: [0.35, 9.9], b: [2.15, 9.9], t: 0.2, h: H_STD, name: '电梯井北壁', ops: [] },
  { a: [0.35, 12.1], b: [2.15, 12.1], t: 0.2, h: H_STD, name: '电梯井南壁', ops: [
    { o: 1.10, w: 0.9, s: 0, h: 2.2, type: 'lift', code: '电梯门' },
  ]},
  { a: [0.35, 9.9], b: [0.35, 12.1], t: 0.2, h: H_STD, name: '电梯井西壁', ops: [] },
  { a: [2.15, 9.9], b: [2.15, 12.1], t: 0.2, h: H_STD, name: '电梯井东壁', ops: [] },
];

/* ---------------- 标准层（二至五层、七层） ---------------- */
function stdFloor(z, level) {
  return {
    z, level, h: H_STD, core: true,
    walls: [
      { a: [0, 0], b: [10.6, 0], t: 0.2, h: H_STD, name: '北外墙', ops: [
        { o: 0.65, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 1.85, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 5.30, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
        { o: 6.10, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
      ]},
      { a: [10.6, 0], b: [10.6, 18.4], t: 0.2, h: H_STD, name: '东外墙', ops: [
        { o: 2.80, w: 3.0, s: 0.9, h: 1.8, type: 'win', code: 'C3018' },
        { o: 4.80, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 8.40, w: 2.0, s: 0.9, h: 1.8, type: 'win', code: 'C2018' },
        { o: 15.50, w: 1.5, s: 0.9, h: 1.8, type: 'win', code: 'C1518' },
        { o: 17.20, w: 1.5, s: 0.9, h: 1.8, type: 'win', code: 'C1518' },
      ]},
      { a: [0, 0], b: [0, 18.4], t: 0.2, h: H_STD, name: '西外墙', ops: [
        { o: 2.70, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
        { o: 7.50, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 11.50, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 16.60, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
      ]},
      { a: [0, 18.4], b: [10.6, 18.4], t: 0.2, h: H_STD, name: '南外墙', ops: [
        { o: 1.40, w: 2.4, s: 0.9, h: 1.8, type: 'win', code: 'C2418' },
        { o: 4.00, w: 2.4, s: 0.9, h: 1.8, type: 'win', code: 'C2418' },
        { o: 7.00, w: 2.4, s: 0.9, h: 1.8, type: 'win', code: 'C2418' },
        { o: 9.70, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
      ]},
      { a: [1.2, 0], b: [1.2, 1.5], t: 0.2, h: H_STD, name: '卫阳台隔墙', ops: [] },
      { a: [0, 1.5], b: [2.5, 1.5], t: 0.2, h: H_STD, name: '厅北墙', ops: [
        { o: 0.65, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['s', +1] },
        { o: 1.85, w: 0.9, s: 0, h: 2.1, type: 'slide', code: 'M0921' },
      ]},
      { a: [0, 4.1], b: [2.5, 4.1], t: 0.2, h: H_STD, name: '厅厨房隔墙', ops: [
        { o: 1.95, w: 1.2, s: 0, h: 2.7, type: 'pass', code: '洞口' },
      ]},
      { a: [0, 5.5], b: [2.5, 5.5], t: 0.2, h: H_STD, name: '厨房楼梯间墙', ops: [] },
      { a: [2.5, 0], b: [2.5, 5.5], t: 0.2, h: H_STD, name: '厅卧室隔墙', ops: [
        { o: 3.95, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', -1] },
      ]},
      { a: [5.2, 0], b: [5.2, 4.1], t: 0.2, h: H_STD, name: '卧室隔墙', ops: [] },
      { a: [2.5, 4.1], b: [7.0, 4.1], t: 0.2, h: H_STD, name: '卧室餐厅隔墙', ops: [
        { o: 2.90, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['s', -1] },
        { o: 5.90, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['s', +1] },
      ]},
      { a: [7.0, 0], b: [7.0, 4.1], t: 0.2, h: H_STD, name: '厨房隔墙', ops: [
        { o: 2.80, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['e', +1] },
      ]},
      { a: [7.0, 1.5], b: [10.6, 1.5], t: 0.2, h: H_STD, name: '卫阳台隔墙', ops: [
        { o: 2.75, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['s', -1] },
      ]},
      { a: [9.0, 1.5], b: [9.0, 4.1], t: 0.2, h: H_STD, name: '厨阳台隔墙', ops: [
        { o: 2.80, w: 1.6, s: 0, h: 2.7, type: 'slide', code: 'M1627' },
      ]},
      { a: [7.0, 4.1], b: [10.6, 4.1], t: 0.2, h: H_STD, name: '走道隔墙', ops: [
        { o: 1.60, w: 0.8, s: 0, h: 2.1, type: 'door', code: 'M0821', swing: ['s', -1] },
      ]},
      { a: [2.5, 5.5], b: [2.5, 9.5], t: 0.2, h: H_STD, name: '楼梯间门墙', ops: [
        { o: 1.05, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['s', +1] },
      ]},
      { a: [2.5, 9.5], b: [7.0, 9.5], t: 0.2, h: H_STD, name: '过厅墙', ops: [
        { o: 1.95, w: 1.2, s: 0, h: 2.7, type: 'pass', code: '洞口' },
      ]},
      { a: [7.0, 5.5], b: [7.0, 9.5], t: 0.2, h: H_STD, name: '餐厅卫生间隔墙', ops: [] },
      { a: [7.0, 7.4], b: [10.6, 7.4], t: 0.2, h: H_STD, name: '卫阳台隔墙', ops: [
        { o: 1.80, w: 1.6, s: 0, h: 2.7, type: 'slide', code: 'M1627' },
      ]},
      { a: [0, 13.5], b: [7.0, 13.5], t: 0.2, h: H_STD, name: '厅厨房隔墙', ops: [] },
      { a: [7.0, 9.5], b: [7.0, 13.5], t: 0.2, h: H_STD, name: '厨房阳台隔墙', ops: [] },
      { a: [7.0, 11.0], b: [10.6, 11.0], t: 0.2, h: H_STD, name: '厨房阳台隔墙', ops: [] },
      { a: [0, 14.9], b: [2.5, 14.9], t: 0.2, h: H_STD, name: '厨房卧室隔墙', ops: [
        { o: 1.25, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['s', -1] },
      ]},
      { a: [2.5, 13.5], b: [2.5, 18.4], t: 0.2, h: H_STD, name: '餐厅客厅隔墙', ops: [
        { o: 2.60, w: 2.2, s: 0, h: 2.7, type: 'pass', code: '洞口' },
      ]},
      { a: [2.5, 15.3], b: [5.2, 15.3], t: 0.2, h: H_STD, name: '餐厅客厅隔墙', ops: [
        { o: 1.30, w: 2.2, s: 0, h: 2.7, type: 'pass', code: '洞口' },
      ]},
      { a: [5.2, 13.5], b: [5.2, 18.4], t: 0.2, h: H_STD, name: '餐厅卧室隔墙', ops: [
        { o: 3.10, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['e', -1] },
      ]},
      { a: [5.2, 15.0], b: [8.6, 15.0], t: 0.2, h: H_STD, name: '餐厅卧室隔墙', ops: [] },
      { a: [8.6, 13.5], b: [8.6, 18.4], t: 0.2, h: H_STD, name: '卫阳台隔墙', ops: [
        { o: 4.30, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['e', -1] },
      ]},
      { a: [8.6, 15.1], b: [10.6, 15.1], t: 0.2, h: H_STD, name: '阳台卫隔墙', ops: [] },
    ],
    rooms: [
      { id: 'wsA', name: '卫生间', bbox: [0.1, 0.1, 1.2, 1.4], floor: 'tile' },
      { id: 'ytA', name: '阳台', bbox: [1.3, 0.1, 2.4, 1.4], floor: 'deck' },
      { id: 'tA', name: '一房一厅·厅', bbox: [0.1, 1.6, 2.4, 4.0], floor: 'wood' },
      { id: 'cfA', name: '厨房', bbox: [0.1, 4.2, 2.4, 5.4], floor: 'tile' },
      { id: 'wfB', name: '卧室', bbox: [2.6, 0.1, 5.1, 4.0], floor: 'wood' },
      { id: 'wfC', name: '卧室', bbox: [5.3, 0.1, 6.9, 4.0], floor: 'wood' },
      { id: 'cfB', name: '厨房', bbox: [7.1, 1.6, 8.9, 4.0], floor: 'tile' },
      { id: 'ytB', name: '阳台', bbox: [9.1, 1.6, 10.5, 4.0], floor: 'deck' },
      { id: 'wsD', name: '卫生间', bbox: [9.1, 0.1, 10.5, 1.4], floor: 'tile' },
      { id: 'ctB', name: '餐厅', bbox: [5.3, 4.2, 6.9, 5.4], floor: 'wood' },
      { id: 'zkC', name: '走道', bbox: [7.1, 4.2, 10.5, 5.4], floor: 'stone' },
      { id: 'dj', name: '单间', bbox: [2.6, 5.6, 5.1, 9.3], floor: 'wood' },
      { id: 'lt', name: '楼梯间', bbox: [0.1, 5.6, 2.4, 9.3], floor: 'stone', stair: true },
      { id: 'dt', name: '电梯厅', bbox: [0.1, 9.6, 2.4, 13.4], floor: 'stone' },
      { id: 'gk', name: '过厅', bbox: [2.6, 9.6, 6.9, 13.4], floor: 'stone' },
      { id: 'wsE', name: '卫生间', bbox: [7.1, 5.6, 8.9, 7.3], floor: 'tile' },
      { id: 'ytE', name: '阳台', bbox: [7.1, 7.5, 10.5, 9.3], floor: 'deck' },
      { id: 'ktD', name: '两房一厅·客厅', bbox: [2.7, 9.6, 6.9, 13.4], floor: 'wood' },
      { id: 'cfD', name: '厨房', bbox: [7.1, 9.6, 10.5, 10.9], floor: 'tile' },
      { id: 'ytD', name: '阳台', bbox: [7.1, 11.1, 10.5, 13.4], floor: 'deck' },
      { id: 'cfE', name: '厨房', bbox: [0.1, 13.7, 2.4, 14.8], floor: 'tile' },
      { id: 'wfE', name: '卧室', bbox: [0.1, 15.0, 2.4, 18.3], floor: 'wood' },
      { id: 'ctE', name: '两房一厅·餐厅', bbox: [2.6, 13.7, 5.1, 15.2], floor: 'wood' },
      { id: 'ktE', name: '两房一厅·客厅', bbox: [2.6, 15.4, 5.1, 18.3], floor: 'wood' },
      { id: 'ctF', name: '餐厅', bbox: [5.3, 13.7, 8.5, 14.9], floor: 'wood' },
      { id: 'wfF', name: '卧室', bbox: [5.3, 15.2, 8.5, 18.3], floor: 'wood' },
      { id: 'ytF', name: '阳台', bbox: [8.7, 13.7, 10.5, 15.0], floor: 'deck' },
      { id: 'wsF', name: '卫生间', bbox: [8.7, 15.2, 10.5, 18.3], floor: 'tile' },
    ],
    furniture: [
      { type: 'bed', pos: [3.6, 1.9], rot: 0 },
      { type: 'bed', pos: [6.1, 2.0], rot: 0 },
      { type: 'bed', pos: [3.9, 7.4], rot: Math.PI },
      { type: 'bed', pos: [1.25, 16.6], rot: 0 },
      { type: 'bed', pos: [6.9, 16.7], rot: 0 },
      { type: 'lSofa', pos: [3.5, 12.3], rot: 0 },
      { type: 'teaTable', pos: [4.9, 11.6], rot: 0 },
      { type: 'sofa3', pos: [3.9, 16.9], rot: 0 },
      { type: 'coffeeTable', pos: [3.9, 15.7], rot: 0 },
      { type: 'toilet', pos: [0.45, 0.5], rot: 0 },
      { type: 'toilet', pos: [9.8, 0.5], rot: 0 },
      { type: 'toilet', pos: [7.6, 6.2], rot: 0 },
      { type: 'toilet', pos: [8.9, 16.2], rot: Math.PI / 2 },
      { type: 'basin', pos: [10.1, 17.6], rot: Math.PI },
      { type: 'plant', pos: [0.5, 3.6], rot: 0 },
      { type: 'plant', pos: [6.6, 13.1], rot: 0 },
    ],
  };
}

/* ---------------- 六层 / 八层：整层大宅 ---------------- */
function bigFloor(z, level) {
  return {
    z, level, h: H_STD, core: true,
    walls: [
      { a: [0, 0], b: [10.6, 0], t: 0.2, h: H_STD, name: '北外墙', ops: [
        { o: 0.65, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 2.30, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 3.75, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
        { o: 6.60, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
      ]},
      { a: [10.6, 0], b: [10.6, 18.4], t: 0.2, h: H_STD, name: '东外墙', ops: [
        { o: 1.10, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 2.70, w: 3.0, s: 0.9, h: 1.8, type: 'win', code: 'C3018' },
        { o: 6.00, w: 2.0, s: 0.9, h: 1.8, type: 'win', code: 'C2018' },
        { o: 8.30, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 10.70, w: 2.0, s: 0.9, h: 1.8, type: 'win', code: 'C2018' },
        { o: 15.40, w: 1.5, s: 0.9, h: 1.8, type: 'win', code: 'C1518' },
      ]},
      { a: [0, 0], b: [0, 18.4], t: 0.2, h: H_STD, name: '西外墙', ops: [
        { o: 2.70, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
        { o: 6.90, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 11.40, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 15.90, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
      ]},
      { a: [0, 18.4], b: [10.6, 18.4], t: 0.2, h: H_STD, name: '南外墙', ops: [
        { o: 1.90, w: 2.4, s: 0.9, h: 1.8, type: 'win', code: 'C2418' },
        { o: 5.50, w: 2.4, s: 0.9, h: 1.8, type: 'win', code: 'C2418' },
        { o: 8.05, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
      ]},
      { a: [0, 1.5], b: [2.5, 1.5], t: 0.2, h: H_STD, name: '浴室卧室隔墙', ops: [
        { o: 1.55, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['s', +1] },
      ]},
      { a: [2.5, 1.5], b: [2.5, 4.5], t: 0.2, h: H_STD, name: '卧室隔墙', ops: [
        { o: 1.45, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', -1] },
      ]},
      { a: [2.5, 4.5], b: [5.4, 4.5], t: 0.2, h: H_STD, name: '卧室过厅隔墙', ops: [
        { o: 1.40, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['s', -1] },
      ]},
      { a: [4.9, 0], b: [4.9, 4.5], t: 0.2, h: H_STD, name: '卧室隔墙', ops: [] },
      { a: [4.9, 1.5], b: [7.0, 1.5], t: 0.2, h: H_STD, name: '卫浴隔墙', ops: [
        { o: 1.05, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['s', -1] },
      ]},
      { a: [7.0, 0], b: [7.0, 4.5], t: 0.2, h: H_STD, name: '卧室隔墙', ops: [
        { o: 3.00, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['e', -1] },
      ]},
      { a: [5.4, 4.5], b: [7.0, 4.5], t: 0.2, h: H_STD, name: '储物隔墙', ops: [] },
      { a: [5.4, 4.5], b: [5.4, 9.5], t: 0.2, h: H_STD, name: '过厅隔墙', ops: [
        { o: 2.30, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['e', -1] },
      ]},
      { a: [5.4, 7.8], b: [7.0, 7.8], t: 0.2, h: H_STD, name: '储物浴室隔墙', ops: [] },
      { a: [2.5, 4.5], b: [2.5, 9.5], t: 0.2, h: H_STD, name: '楼梯间门墙', ops: [
        { o: 1.40, w: 1.2, s: 0, h: 2.1, type: 'door', code: 'M1221', swing: ['s', +1] },
      ]},
      { a: [2.5, 9.5], b: [2.5, 13.5], t: 0.2, h: H_STD, name: '电梯厅隔墙', ops: [
        { o: 3.45, w: 0.9, s: 0, h: 2.1, type: 'pass', code: '洞口' },
      ]},
      { a: [7.0, 4.5], b: [7.0, 9.5], t: 0.2, h: H_STD, name: '卧室④隔墙', ops: [
        { o: 1.40, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['s', -1] },
      ]},
      { a: [7.0, 9.5], b: [10.6, 9.5], t: 0.2, h: H_STD, name: '卧室衣帽隔墙', ops: [
        { o: 3.20, w: 1.6, s: 0, h: 2.7, type: 'slide', code: 'M1627' },
      ]},
      { a: [0, 13.5], b: [7.0, 13.5], t: 0.2, h: H_STD, name: '客厅主人房隔墙', ops: [
        { o: 2.90, w: 2.4, s: 0, h: 2.7, type: 'pass', code: '洞口' },
      ]},
      { a: [4.4, 13.5], b: [4.4, 18.4], t: 0.2, h: H_STD, name: '客厅主人房纵墙', ops: [] },
      { a: [7.0, 9.5], b: [7.0, 13.5], t: 0.2, h: H_STD, name: '衣帽过厅隔墙', ops: [
        { o: 2.80, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['s', +1] },
      ]},
      { a: [7.0, 13.5], b: [10.6, 13.5], t: 0.2, h: H_STD, name: '主人房主卫隔墙', ops: [
        { o: 1.05, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['s', +1] },
      ]},
      { a: [8.6, 13.5], b: [8.6, 18.4], t: 0.2, h: H_STD, name: '主卫隔墙', ops: [] },
      { a: [8.6, 16.2], b: [10.6, 16.2], t: 0.2, h: H_STD, name: '储藏浴室隔墙', ops: [] },
    ],
    rooms: [
      { id: 'ys1', name: '浴室', bbox: [0.1, 0.1, 2.4, 1.4], floor: 'tile' },
      { id: 'wd2', name: '卧室 15.58㎡', bbox: [0.1, 1.6, 2.4, 4.3], floor: 'wood' },
      { id: 'wd1', name: '卧室 16.63㎡', bbox: [2.6, 0.1, 4.8, 4.3], floor: 'wood' },
      { id: 'ws2', name: '浴室·卫', bbox: [5.0, 0.1, 6.9, 1.4], floor: 'tile' },
      { id: 'wd3', name: '卧室 22.54㎡', bbox: [5.0, 1.6, 6.9, 4.3], floor: 'wood' },
      { id: 'wd5', name: '卧室', bbox: [7.1, 1.6, 10.5, 4.3], floor: 'wood' },
      { id: 'wsD', name: '卫', bbox: [8.6, 0.1, 10.5, 1.4], floor: 'tile' },
      { id: 'lt', name: '楼梯间', bbox: [0.1, 4.6, 2.4, 9.3], floor: 'stone', stair: true },
      { id: 'gt', name: '过厅', bbox: [2.6, 4.6, 5.3, 13.4], floor: 'stone' },
      { id: 'cwA', name: '储物间', bbox: [5.5, 4.6, 6.9, 7.7], floor: 'wood' },
      { id: 'ys2', name: '浴室', bbox: [5.5, 7.9, 6.9, 9.3], floor: 'tile' },
      { id: 'wd4', name: '卧室', bbox: [7.1, 4.6, 10.5, 9.3], floor: 'wood' },
      { id: 'dt', name: '电梯厅', bbox: [0.1, 9.6, 2.4, 13.4], floor: 'stone' },
      { id: 'ymj', name: '衣帽间', bbox: [7.1, 9.6, 10.5, 11.8], floor: 'wood' },
      { id: 'kt', name: '客厅', bbox: [0.1, 13.6, 4.3, 18.3], floor: 'wood' },
      { id: 'zrf', name: '主人房', bbox: [4.5, 13.6, 6.9, 18.3], floor: 'wood' },
      { id: 'zw', name: '主卫', bbox: [7.1, 13.6, 8.5, 18.3], floor: 'tile' },
      { id: 'cz', name: '储藏间', bbox: [8.7, 13.6, 10.5, 16.1], floor: 'stone' },
      { id: 'ys4', name: '浴室', bbox: [8.7, 16.3, 10.5, 18.3], floor: 'tile' },
    ],
    furniture: [
      { type: 'bed', pos: [1.25, 2.9], rot: Math.PI / 2 },
      { type: 'bed', pos: [3.7, 2.6], rot: 0 },
      { type: 'bed', pos: [5.95, 2.7], rot: 0 },
      { type: 'bed', pos: [8.4, 2.9], rot: 0 },
      { type: 'wardrobe', pos: [3.5, 4.05], rot: 0 },
      { type: 'wardrobe', pos: [5.95, 4.05], rot: 0 },
      { type: 'bed', pos: [8.4, 5.8], rot: Math.PI / 2 },
      { type: 'wardrobe', pos: [8.9, 10.2], rot: 0 },
      { type: 'wardrobe', pos: [8.9, 11.0], rot: 0 },
      { type: 'sofa3', pos: [1.7, 16.6], rot: 0 },
      { type: 'armchair', pos: [3.5, 15.5], rot: Math.PI },
      { type: 'armchair', pos: [3.5, 17.6], rot: Math.PI },
      { type: 'coffeeTable', pos: [2.7, 16.6], rot: 0 },
      { type: 'tvUnit', pos: [4.0, 16.6], rot: Math.PI / 2 },
      { type: 'rug', pos: [2.6, 16.6], rot: 0 },
      { type: 'plant', pos: [0.6, 14.3], rot: 0 },
      { type: 'bed', pos: [5.75, 16.0], rot: 0 },
      { type: 'toilet', pos: [0.5, 0.45], rot: 0 },
      { type: 'bathtub', pos: [1.6, 0.6], rot: 0 },
      { type: 'toilet', pos: [5.3, 0.45], rot: 0 },
      { type: 'basin', pos: [6.5, 0.5], rot: 0 },
      { type: 'bathtub', pos: [9.55, 17.2], rot: Math.PI / 2 },
      { type: 'toilet', pos: [7.6, 14.3], rot: 0 },
      { type: 'basin', pos: [7.6, 15.6], rot: 0 },
      { type: 'toilet', pos: [7.6, 8.6], rot: 0 },
    ],
  };
}
function bigFloorParts(z, level) { const f = bigFloor(z, level); return { walls: f.walls, rooms: f.rooms, furniture: f.furniture, core: true, h: f.h }; }
function stdFloorParts(z, level) { const f = stdFloor(z, level); return { walls: f.walls, rooms: f.rooms, furniture: f.furniture, core: true, h: f.h }; }

/* ============================================================
   全部楼层（自上而下）
   ============================================================ */
const FLOORS = [
  {
    id: 'rf', name: '屋面层', sheet: 'JS-10', level: '31.100', z: 31.1, h: 0, roof: true, core: false,
    intro: '屋面层（图号 JS-10，标高 31.100）：上人屋面，四周 200 厚女儿墙、压顶泛水与泄水孔按 17/17 露台大样施工，面层 1%、2% 找坡；东北角设屋面检修孔，楼梯间出屋面。建筑于此封顶，总高 31.25m。',
    walls: [
      { a: [0, 0], b: [10.6, 0], t: 0.2, h: H_PARAPET, parapet: true, name: '北女儿墙', ops: [] },
      { a: [10.6, 0], b: [10.6, 19.9], t: 0.2, h: H_PARAPET, parapet: true, name: '东女儿墙', ops: [] },
      { a: [0, 0], b: [0, 19.9], t: 0.2, h: H_PARAPET, parapet: true, name: '西女儿墙', ops: [] },
      { a: [0, 19.9], b: [10.6, 19.9], t: 0.2, h: H_PARAPET, parapet: true, name: '南女儿墙', ops: [] },
      { a: [0.1, 5.5], b: [2.5, 5.5], t: 0.2, h: 2.2, name: '梯间北壁', ops: [] },
      { a: [0.1, 9.5], b: [2.5, 9.5], t: 0.2, h: 2.2, name: '梯间南壁', ops: [
        { o: 1.2, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', +1] },
      ]},
      { a: [2.5, 5.5], b: [2.5, 9.5], t: 0.2, h: 2.2, name: '梯间东壁', ops: [] },
      { a: [0.1, 5.5], b: [0.1, 9.5], t: 0.2, h: 2.2, name: '梯间西壁', ops: [] },
    ],
    rooms: [
      { id: 'lt', name: '楼梯间（出屋面）', bbox: [0.1, 5.6, 2.4, 9.4], floor: 'stone' },
      { id: 'yt1', name: '露台', bbox: [2.6, 0.1, 10.5, 19.8], floor: 'deck' },
      { id: 'yt2', name: '露台', bbox: [0.1, 0.1, 2.4, 5.4], floor: 'deck' },
      { id: 'yt3', name: '露台', bbox: [0.1, 9.5, 2.4, 19.8], floor: 'deck' },
    ],
    furniture: [],
    mark: [6.5, 9.5, '31.100'],
  },
  {
    id: 'f9', name: '九层平面图', sheet: 'JS-09', level: '26.900', z: 26.9, h: 4.0, core: true,
    intro: '九层（图号 JS-09，标高 26.900）为整层一户的顶层宅邸：北半部为主卧、餐厅、厨房与会客厅，中部围绕楼梯与电梯厅，南半部为整层大露台。为便于俯瞰，模型未建屋顶楼板。',
    walls: [
      { a: [0, 0], b: [10.6, 0], t: 0.2, h: 4.0, name: '北外墙', ops: [
        { o: 0.80, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 2.30, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 5.30, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
        { o: 8.30, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
      ]},
      { a: [10.6, 0], b: [10.6, 13.6], t: 0.2, h: 4.0, name: '东外墙', ops: [
        { o: 0.80, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 3.40, w: 3.0, s: 0.9, h: 1.8, type: 'win', code: 'C3018' },
        { o: 7.55, w: 3.0, s: 0.9, h: 1.8, type: 'win', code: 'C3018' },
        { o: 11.60, w: 2.0, s: 0.9, h: 1.8, type: 'win', code: 'C2018' },
      ]},
      { a: [0, 0], b: [0, 13.6], t: 0.2, h: 4.0, name: '西外墙', ops: [
        { o: 3.20, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
        { o: 7.50, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 10.60, w: 0.7, s: 1.5, h: 1.2, type: 'win', code: 'C0714' },
      ]},
      { a: [0, 19.9], b: [10.6, 19.9], t: 0.2, h: 1.5, parapet: true, name: '南女儿墙', ops: [] },
      { a: [0, 13.6], b: [0, 19.9], t: 0.2, h: 1.5, parapet: true, name: '西女儿墙', ops: [] },
      { a: [10.6, 13.6], b: [10.6, 19.9], t: 0.2, h: 1.5, parapet: true, name: '东女儿墙', ops: [] },
      { a: [0, 1.5], b: [3.5, 1.5], t: 0.2, h: 4.0, name: '卫浴南墙', ops: [
        { o: 0.95, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['e', +1] },
        { o: 2.75, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['s', -1] },
      ]},
      { a: [1.5, 0], b: [1.5, 1.5], t: 0.2, h: 4.0, name: '卫浴隔墙', ops: [
        { o: 0.75, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['e', -1] },
      ]},
      { a: [3.5, 0], b: [3.5, 5.5], t: 0.2, h: 4.0, name: '卧室隔墙', ops: [
        { o: 4.95, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', -1] },
      ]},
      { a: [7.0, 1.5], b: [7.0, 5.5], t: 0.2, h: 4.0, name: '餐厅厨房隔墙', ops: [
        { o: 1.90, w: 2.4, s: 0, h: 2.7, type: 'slide', code: 'M2427' },
      ]},
      { a: [7.0, 1.5], b: [10.6, 1.5], t: 0.2, h: 4.0, name: '厨房洗衣间隔墙', ops: [
        { o: 0.6, w: 0.8, s: 0, h: 2.1, type: 'door', code: 'M0821', swing: ['s', -1] },
      ]},
      { a: [0, 5.5], b: [2.5, 5.5], t: 0.2, h: 4.0, name: '卧室楼梯间墙', ops: [] },
      { a: [7.0, 5.5], b: [7.0, 9.5], t: 0.2, h: 4.0, name: '过厅会客厅隔墙', ops: [
        { o: 2.20, w: 1.6, s: 0, h: 2.7, type: 'slide', code: 'M1627' },
      ]},
      { a: [2.5, 5.5], b: [2.5, 9.5], t: 0.2, h: 4.0, name: '楼梯间门墙', ops: [
        { o: 1.05, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['s', +1] },
      ]},
      { a: [0, 9.5], b: [2.5, 9.5], t: 0.2, h: 4.0, name: '楼梯电梯厅墙', ops: [] },
      { a: [2.5, 9.5], b: [7.0, 9.5], t: 0.2, h: 4.0, name: '过厅茶室墙', ops: [
        { o: 1.40, w: 1.4, s: 0, h: 2.7, type: 'pass', code: '洞口' },
      ]},
      { a: [7.0, 9.5], b: [10.6, 9.5], t: 0.2, h: 4.0, name: '会客厅书房墙', ops: [] },
      { a: [2.5, 9.5], b: [2.5, 13.6], t: 0.2, h: 4.0, name: '电梯厅茶室墙', ops: [
        { o: 3.45, w: 0.9, s: 0, h: 2.1, type: 'pass', code: '洞口' },
      ]},
      { a: [7.0, 9.5], b: [7.0, 13.6], t: 0.2, h: 4.0, name: '茶室书房隔墙', ops: [
        { o: 2.00, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['e', +1] },
      ]},
      { a: [0, 13.6], b: [2.5, 13.6], t: 0.2, h: 4.0, name: '电梯厅露台墙', ops: [
        { o: 1.95, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', +1] },
      ]},
      { a: [2.5, 13.6], b: [10.6, 13.6], t: 0.2, h: 4.0, name: '茶室露台墙', ops: [
        { o: 3.20, w: 1.6, s: 0, h: 2.7, type: 'slide', code: 'M1627' },
      ]},
      { a: [0.35, 9.9], b: [2.15, 9.9], t: 0.2, h: 4.0, name: '电梯井北壁', ops: [] },
      { a: [0.35, 12.1], b: [2.15, 12.1], t: 0.2, h: 4.0, name: '电梯井南壁', ops: [
        { o: 1.10, w: 0.9, s: 0, h: 2.2, type: 'lift', code: '电梯门' },
      ]},
      { a: [0.35, 9.9], b: [0.35, 12.1], t: 0.2, h: 4.0, name: '电梯井西壁', ops: [] },
      { a: [2.15, 9.9], b: [2.15, 12.1], t: 0.2, h: 4.0, name: '电梯井东壁', ops: [] },
    ],
    rooms: [
      { id: 'woshi', name: '主卧', bbox: [0.1, 1.6, 3.4, 5.4], floor: 'wood',
        win: 'C1818 铝合金推拉窗（西向）', door: 'M1021 不锈钢门 · M0721 套装门×2（连卫浴）',
        enter: { pos: [2.8, 2.2, 2.0], look: [0.9, 0.5, 3.6] },
        desc: '位于西北角的静谧主卧，开间 3.3m、进深 3.8m，套内约 12.5㎡。西墙整樘 C1818 铝合金推拉窗（1800×1800，窗台高 900），采光充沛。套房式布局：北侧设独立主卫与客卫两间，通过 M0721 铝合金全玻璃套装门进入，动线私密。' },
      { id: 'bath', name: '浴室', bbox: [0.1, 0.1, 1.4, 1.4], floor: 'tile',
        win: 'C0714 高窗（北向）', door: 'M0721 套装门×2',
        desc: '主卧套内浴室，约 1.7㎡，沿北墙布置浴缸并预留淋浴位，北墙 C0714 高窗通风防潮。隔墙按图纸采用 200 厚砌块墙并砌至梁板底。' },
      { id: 'wei', name: '客卫', bbox: [1.6, 0.1, 3.4, 1.4], floor: 'tile',
        win: 'C1218 推拉窗（北向）', door: 'M0721 套装门',
        desc: '客用卫生间，约 2.3㎡，布置坐便器与台盆，北向 C1218 推拉窗直接采光。按总说明，卫生间墙面粉刷采用防水釉面砖至顶。' },
      { id: 'canting', name: '餐厅', bbox: [3.6, 0.1, 6.9, 5.4], floor: 'wood',
        win: 'C1818 推拉窗（北向）', door: 'M2427 推拉门（连厨房）',
        enter: { pos: [6.4, 1.7, 4.9], look: [4.6, 1.0, 2.4] },
        desc: '家宴厅堂，约 17.5㎡，北向 C1818 大窗。图纸在厅中央布置十人圆桌——与模型一致；西端 M1021 门直通主卧区，东墙 M2427（2400×2700）铝合金推拉门连通厨房，南向开敞衔接过厅，是整户的交通枢纽。' },
      { id: 'chufang', name: '厨房', bbox: [7.1, 1.6, 10.5, 5.4], floor: 'tile',
        win: 'C1818（北向）· C3018 大窗（东向）', door: 'M2427 推拉门 · M0821 门（连洗衣间）',
        enter: { pos: [8.0, 1.6, 4.7], look: [9.9, 1.1, 2.6] },
        desc: '约 12.9㎡ 的东向厨房：沿北墙与东墙布置 L 型橱柜，灶台位于北向 C1818 窗侧，东墙 C3018（3000×1800）通长大窗令操作台洒满晨光。北端 M0821 门直通洗衣间，形成"洗-烹"家务动线。' },
      { id: 'xiyijian', name: '洗衣间', bbox: [7.1, 0.1, 10.5, 1.4], floor: 'tile',
        win: 'C0714 高窗（东向）', door: 'M0821 门（连厨房）',
        desc: '家务辅助空间，约 4.4㎡，集中布置洗衣机、烘干机与水槽，东墙 C0714 高窗通风。与厨房之间以 M0821 夹木门相连，污净分区明确。' },
      { id: 'guoting', name: '会客厅', bbox: [7.1, 5.6, 10.5, 9.4], floor: 'wood',
        win: 'C3018 大窗（东向）', door: 'M1627 推拉门（连过厅）',
        enter: { pos: [8.1, 1.6, 6.6], look: [9.6, 1.2, 8.6] },
        desc: '正起居厅，约 12.9㎡。东墙整片 C3018 铝合金推拉窗（3000×1800）面向东南绿意，图纸于此布置组合沙发与茶几；西侧 M1627（1600×2700）推拉门与过厅相接，待客与家聚两相宜。' },
      { id: 'chashi', name: '茶室', bbox: [2.6, 9.6, 6.9, 13.5], floor: 'wood',
        win: '—（内庭采光）', door: 'M1627 推拉门（通露台）· 洞口（连过厅）',
        enter: { pos: [6.5, 1.7, 13.1], look: [3.5, 1.0, 11.2] },
        desc: '约 16.8㎡ 的茶室，四室动线的中心。图纸绘有曲尺型大榻与茶桌——模型照原样布置；南墙 M1627 推拉门推开后，整片南向露台绿意涌入，是品茗观景的灰空间过渡。' },
      { id: 'shufang', name: '书房', bbox: [7.1, 9.6, 10.5, 13.5], floor: 'wood',
        win: 'C2018 推拉窗（东向）', door: 'M0921 夹木门（连茶室）',
        enter: { pos: [10.1, 2.6, 10.0], look: [7.8, 0.8, 12.8] },
        desc: '东南隅书房，约 13.3㎡（原图纸此间未标注名称，按起居功能布置）。东墙 C2018 窗纳入晨光，南墙整面书架贴 Ⓑ轴 布置，与茶室以 M0921 夹木门相连，静闹分区。' },
      { id: 'guoke', name: '过厅', bbox: [2.6, 5.6, 6.9, 9.4], floor: 'stone',
        win: '—', door: 'M1627 推拉门 · M1021 门 · 洞口×2',
        enter: { pos: [6.3, 1.7, 6.2], look: [3.4, 1.0, 8.8] },
        desc: '整户交通枢纽，约 16.3㎡（图纸在此标注室内标高 ▽26.900）。北接餐厅、南达茶室与露台，西经 M1021 门通楼梯间，东以 M1627 推拉门入会客厅，各室环列、动线最短。' },
      { id: 'louti', name: '楼梯间', bbox: [0.1, 5.6, 2.4, 9.4], floor: 'stone',
        win: 'C1218 推拉窗（西向）', door: 'M1021 不锈钢门',
        desc: '现浇双跑楼梯：每跑 10 个踏面、踏步 260×10=2600，梯段宽 900+900，中间休息平台进深 1200，可由本层（26.900）上至屋面（31.100）、下达各层。剖面对应梯板 TB1—TB4 与平台梁 TL1。' },
      { id: 'dianti', name: '电梯厅', bbox: [0.1, 9.6, 2.4, 13.5], floor: 'stone',
        win: 'C0714 高窗（西向）', door: 'M1021 门（通露台）· 电梯门',
        enter: { pos: [1.6, 1.6, 12.9], look: [1.2, 1.4, 10.6] },
        desc: '电梯厅环绕 1800×2200 电梯井布置（剖面图注"电梯一"，贯通 ±0.000 至 26.900 各层）。出电梯门向南即厅廊：正前方 M1021 不锈钢门直通大露台，向东经洞口入茶室、通两房一厅与过厅——归家动线：电梯 → 厅堂 → 露台一气呵成。' },
      { id: 'lutai', name: '露台', bbox: [0.1, 13.7, 10.5, 19.8], floor: 'deck',
        win: '—（室外）', door: 'M1021 · M1627 两处出入口',
        enter: { pos: [9.4, 3.2, 14.2], look: [1.2, 0.5, 18.8] },
        desc: '整层南向大露台，约 63㎡，是本层的"空中院子"。面层按图纸做 1%、2% 找坡排水，四周女儿墙 200 厚、压顶泛水与泄水孔按 17/17 页露台大样施工；西南角设弧形花池（对应图纸西南角弧形构筑），居中预留屋面出入口检修空间。' },
    ],
    furniture: [
      { room: 'woshi', type: 'bed', pos: [1.30, 3.45], rot: Math.PI / 2, name: '双人床', desc: '1800×2000 双人床，床头板贴西墙 C1818 窗侧布置，配床头柜两组与台灯。' },
      { room: 'woshi', type: 'nightstand', pos: [0.55, 2.15], rot: 0, name: '床头柜', desc: '500×500 实木床头柜，上置台灯，夜间自动点亮。' },
      { room: 'woshi', type: 'nightstand', pos: [0.55, 4.75], rot: 0, name: '床头柜', desc: '500×500 实木床头柜，上置台灯，夜间自动点亮。' },
      { room: 'woshi', type: 'wardrobe', pos: [3.10, 2.90], rot: Math.PI / 2, name: '衣柜', desc: '600 深、2400 长通高衣柜，贴东墙布置，避开门洞动线。' },
      { room: 'woshi', type: 'rug', pos: [1.55, 3.45], rot: 0, name: '地毯', desc: '2300×1700 短绒地毯，柔化木地面脚感。' },
      { room: 'bath', type: 'bathtub', pos: [0.65, 0.52], rot: 0, name: '浴缸', desc: '沿北墙布置 1500×750 裙板浴缸，墙上预留淋浴花洒接口。' },
      { room: 'bath', type: 'toilet', pos: [1.06, 1.12], rot: Math.PI, name: '坐便器', desc: '连体坐便器，排污管按图纸沿墙暗敷。' },
      { room: 'wei', type: 'toilet', pos: [1.95, 0.55], rot: 0, name: '坐便器', desc: '客卫坐便器，北墙 C1218 窗下通风良好。' },
      { room: 'wei', type: 'basin', pos: [3.05, 0.45], rot: 0, name: '台盆', desc: '陶瓷台盆+镜箱，图纸所示椭圆洗手盆。' },
      { room: 'canting', type: 'diningSet', pos: [5.25, 2.75], rot: 0, name: '十人圆餐桌', desc: 'Ø1800 圆桌配十椅——与图纸家具布置完全一致，家宴待客皆宜。' },
      { room: 'canting', type: 'sideboard', pos: [3.85, 1.55], rot: 0, name: '餐边柜', desc: '2200 长餐边柜贴西墙，收纳茶器酒具。' },
      { room: 'canting', type: 'plant', pos: [6.55, 4.95], rot: 0, name: '绿植', desc: '大叶绿植，点缀餐厅东南角。' },
      { room: 'chufang', type: 'kitchenCounter', pos: [10.2, 1.9], rot: 0, name: 'L 型橱柜', desc: '沿北墙+东墙 600 深 L 型台面：北段双灶+油烟机，东段双槽水槽，上方吊柜。' },
      { room: 'chufang', type: 'fridge', pos: [7.45, 5.05], rot: Math.PI, name: '冰箱', desc: '双门冰箱置于南端，紧邻 M2427 推拉门取餐动线。' },
      { room: 'xiyijian', type: 'laundry', pos: [10.1, 0.80], rot: -Math.PI / 2, name: '洗衣机组', desc: '洗衣机+烘干机并列东墙，上方便于晾晒动线衔接露台。' },
      { room: 'xiyijian', type: 'sink', pos: [7.45, 0.80], rot: Math.PI / 2, name: '水槽', desc: '深盆洗衣水槽，带龙头与置物搁板。' },
      { room: 'guoting', type: 'sofa3', pos: [7.55, 7.50], rot: 0, name: '三人沙发', desc: '组合沙发主位，背靠过厅隔墙面向 C3018 大窗。' },
      { room: 'guoting', type: 'sofa1', pos: [9.55, 6.55], rot: Math.PI, name: '单人沙发', desc: '组合沙发配位之一。' },
      { room: 'guoting', type: 'sofa1', pos: [9.55, 8.45], rot: Math.PI, name: '单人沙发', desc: '组合沙发配位之二。' },
      { room: 'guoting', type: 'coffeeTable', pos: [8.60, 7.50], rot: 0, name: '茶几', desc: '1200×600 矮茶几，图纸中央家具位。' },
      { room: 'guoting', type: 'tvUnit', pos: [8.80, 5.95], rot: 0, name: '电视柜', desc: '北墙矮电视柜+壁挂电视，与沙发组相对。' },
      { room: 'guoting', type: 'rug', pos: [8.60, 7.55], rot: 0, name: '地毯', desc: '2800×2000 客厅地毯。' },
      { room: 'guoting', type: 'plant', pos: [10.15, 9.05], rot: 0, name: '绿植', desc: '客厅东南角绿植。' },
      { room: 'chashi', type: 'lSofa', pos: [3.60, 12.10], rot: 0, name: '曲尺大榻', desc: '图纸所绘 L 型曲尺沙发榻，围合出品茗区。' },
      { room: 'chashi', type: 'teaTable', pos: [4.85, 11.75], rot: 0, name: '茶桌', desc: '1500×900 矮茶桌，上置整套茶具。' },
      { room: 'chashi', type: 'shelf', pos: [5.80, 9.76], rot: 0, name: '博古架', desc: '北墙 2400 长博古架，陈列茶器。' },
      { room: 'chashi', type: 'plant', pos: [6.45, 13.00], rot: 0, name: '盆景', desc: '松柏盆景，与露台绿意呼应。' },
      { room: 'chashi', type: 'rug', pos: [4.60, 11.60], rot: 0, name: '地毯', desc: '茶区羊毛地毯。' },
      { room: 'shufang', type: 'desk', pos: [9.20, 10.35], rot: 0, name: '书桌', desc: '1600×700 书桌面向东窗，晨光阅读位。' },
      { room: 'shufang', type: 'chair', pos: [9.20, 10.95], rot: Math.PI, name: '座椅', desc: '书房座椅。' },
      { room: 'shufang', type: 'bookshelf', pos: [8.80, 13.20], rot: Math.PI, name: '书架', desc: '沿 Ⓑ轴 南墙 3000 长通高书架。' },
      { room: 'shufang', type: 'armchair', pos: [7.75, 12.60], rot: -Math.PI / 4, name: '单人沙发', desc: '窗边休闲位。' },
      { room: 'guoke', type: 'console', pos: [2.90, 8.30], rot: 0, name: '玄关柜', desc: '1800 长条案贴西墙，进出露台更衣过渡。' },
      { room: 'guoke', type: 'plant', pos: [6.45, 6.10], rot: 0, name: '绿植', desc: '过厅东北角绿植。' },
      { room: 'lutai', type: 'flowerPool', pos: [0.10, 19.80], rot: 0, name: '弧形花池', desc: '西南角 1/4 圆弧花池，池壁 240 厚、贴同色面砖，内植灌木球——对应图纸西南角弧形构筑。' },
      { room: 'lutai', type: 'outdoorSet', pos: [7.60, 16.30], rot: 0, name: '户外桌椅', desc: '藤编双椅+小圆桌+遮阳伞，露台会客角。' },
      { room: 'lutai', type: 'lounger', pos: [3.60, 15.60], rot: 0.35, name: '躺椅', desc: '南向日光躺椅之一。' },
      { room: 'lutai', type: 'lounger', pos: [4.90, 15.60], rot: 0.35, name: '躺椅', desc: '南向日光躺椅之二。' },
      { room: 'lutai', type: 'plant', pos: [0.75, 14.40], rot: 0, name: '盆栽', desc: '露台西北角盆栽。' },
      { room: 'lutai', type: 'plant', pos: [9.90, 19.10], rot: 0, name: '盆栽', desc: '露台东南角盆栽。' },
    ],
    mark: [4.75, 7.5, '26.900'],
  },
  { id: 'f8', name: '八层平面图', sheet: 'JS-08', level: '23.700', z: 23.7, core: true, mark: [3.6, 7.9, '23.700'], ...bigFloorParts(23.7, '23.700') },
  { id: 'f7', name: '七层平面图', sheet: 'JS-07', level: '20.500', z: 20.5, core: true, mark: [3.0, 5.9, '20.500'], ...stdFloorParts(20.5, '20.500') },
  { id: 'f6', name: '六层平面图', sheet: 'JS-06', level: '17.300', z: 17.3, core: true, mark: [3.6, 7.9, '17.300'], ...bigFloorParts(17.3, '17.300') },
  { id: 'f5', name: '五层平面图', sheet: 'JS-05', level: '14.100', z: 14.1, core: true, mark: [3.0, 5.9, '14.100'], ...stdFloorParts(14.1, '14.100') },
  { id: 'f4', name: '四层平面图', sheet: 'JS-05', level: '10.900', z: 10.9, core: true, mark: [3.0, 5.9, '10.900'], ...stdFloorParts(10.9, '10.900') },
  { id: 'f3', name: '三层平面图', sheet: 'JS-05', level: '7.700', z: 7.7, core: true, mark: [3.0, 5.9, '7.700'], ...stdFloorParts(7.7, '7.700') },
  { id: 'f2', name: '二层平面图', sheet: 'JS-05', level: '4.500', z: 4.5, core: true, mark: [3.0, 5.9, '4.500'], ...stdFloorParts(4.5, '4.500') },
  {
    id: 'f1', name: '首层平面图', sheet: 'JS-04', level: '±0.000', z: 0, h: 4.2, core: false, lift: true,
    intro: '首层（图号 JS-04，±0.000，室外 -0.150）：北侧公共车库与私人车库（M1530/M2730 车库门），中部卫生间、楼梯与电梯核心筒，南侧沿街三间铺面（M2730/M1530 临街开门、C1518 东窗），另设内取消车道与车库楼梯。层高 4.5m。',
    walls: [
      { a: [0, 0], b: [10.6, 0], t: 0.2, h: 4.2, name: '北外墙', ops: [
        { o: 1.45, w: 1.5, s: 0, h: 3.0, type: 'slide', code: 'M1530' },
        { o: 8.75, w: 2.7, s: 0, h: 3.0, type: 'slide', code: 'M2730' },
      ]},
      { a: [10.6, 0], b: [10.6, 18.4], t: 0.2, h: 4.2, name: '东外墙', ops: [
        { o: 1.70, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 7.75, w: 2.7, s: 0, h: 3.0, type: 'slide', code: 'M2730' },
        { o: 9.20, w: 0.6, s: 0.9, h: 1.2, type: 'win', code: 'C0612' },
        { o: 11.00, w: 1.5, s: 0.9, h: 1.8, type: 'win', code: 'C1518' },
        { o: 13.40, w: 1.5, s: 0.9, h: 1.8, type: 'win', code: 'C1518' },
        { o: 15.90, w: 1.5, s: 0.9, h: 1.8, type: 'win', code: 'C1518' },
      ]},
      { a: [0, 0], b: [0, 18.4], t: 0.2, h: 4.2, name: '西外墙', ops: [
        { o: 1.90, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 3.90, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 13.80, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
      ]},
      { a: [0, 18.4], b: [10.6, 18.4], t: 0.2, h: 4.2, name: '南外墙', ops: [
        { o: 1.45, w: 1.5, s: 0, h: 3.0, type: 'slide', code: 'M1530' },
        { o: 5.25, w: 2.7, s: 0, h: 3.0, type: 'slide', code: 'M2730' },
        { o: 8.75, w: 2.7, s: 0, h: 3.0, type: 'slide', code: 'M2730' },
      ]},
      { a: [0, 2.8], b: [6.0, 2.8], t: 0.2, h: 4.2, name: '车库南墙', ops: [
        { o: 2.0, w: 0.8, s: 0, h: 2.1, type: 'door', code: 'M0821', swing: ['s', +1] },
      ]},
      { a: [6.0, 0], b: [6.0, 6.0], t: 0.2, h: 4.2, name: '车库隔墙', ops: [] },
      { a: [6.0, 6.0], b: [10.6, 6.0], t: 0.2, h: 4.2, name: '私车车库南墙', ops: [] },
      { a: [0, 5.5], b: [2.5, 5.5], t: 0.2, h: 4.2, name: '走廊楼梯间墙', ops: [] },
      { a: [0, 7.8], b: [2.5, 7.8], t: 0.2, h: 4.2, name: '卫楼梯隔墙', ops: [
        { o: 1.25, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['s', -1] },
      ]},
      { a: [2.5, 5.5], b: [2.5, 11.9], t: 0.2, h: 4.2, name: '楼梯间门墙', ops: [
        { o: 2.90, w: 0.8, s: 0, h: 2.1, type: 'door', code: 'M0821', swing: ['e', -1] },
        { o: 3.95, w: 0.8, s: 0, h: 2.1, type: 'door', code: 'M0821', swing: ['e', +1] },
      ]},
      { a: [0, 11.9], b: [2.5, 11.9], t: 0.2, h: 4.2, name: '电梯厅南墙', ops: [] },
      { a: [2.5, 11.9], b: [6.0, 11.9], t: 0.2, h: 4.2, name: '过厅铺面隔墙', ops: [
        { o: 0.45, w: 0.8, s: 0, h: 2.1, type: 'door', code: 'M0821', swing: ['s', +1] },
      ]},
      { a: [6.0, 6.0], b: [6.0, 11.9], t: 0.2, h: 4.2, name: '过厅铺面纵墙', ops: [] },
      { a: [0, 12.1], b: [10.6, 12.1], t: 0.2, h: 4.2, name: '铺面北墙', ops: [] },
      { a: [2.5, 12.1], b: [2.5, 18.4], t: 0.2, h: 4.2, name: '铺面隔墙', ops: [] },
      { a: [6.0, 12.1], b: [6.0, 18.4], t: 0.2, h: 4.2, name: '铺面隔墙', ops: [] },
      { a: [6.0, 9.6], b: [8.0, 9.6], t: 0.2, h: 4.2, name: '卫南墙', ops: [
        { o: 0.35, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['s', -1] },
      ]},
      { a: [8.0, 9.6], b: [8.0, 12.1], t: 0.2, h: 4.2, name: '卫东墙', ops: [] },
      { a: [3.9, 5.9], b: [3.9, 8.0], t: 0.2, h: 4.2, name: '车库楼梯西墙', ops: [] },
      { a: [3.9, 8.0], b: [6.0, 8.0], t: 0.2, h: 4.2, name: '车库楼梯南墙', ops: [] },
    ],
    rooms: [
      { id: 'gga', name: '公共车库', bbox: [0.1, 0.1, 5.9, 2.7], floor: 'cement' },
      { id: 'sja', name: '私人车库', bbox: [6.1, 0.1, 10.5, 5.9], floor: 'cement' },
      { id: 'zl', name: '走廊', bbox: [0.1, 2.9, 2.4, 5.4], floor: 'cement' },
      { id: 'ws', name: '卫生间', bbox: [0.1, 5.6, 2.4, 7.7], floor: 'tile' },
      { id: 'lt', name: '楼梯间', bbox: [0.1, 7.9, 2.4, 9.4], floor: 'stone', stair: true },
      { id: 'dt', name: '电梯厅', bbox: [0.1, 9.6, 2.4, 11.8], floor: 'stone' },
      { id: 'gt', name: '过厅', bbox: [2.6, 6.1, 5.9, 11.8], floor: 'cement' },
      { id: 'lt2', name: '车库楼梯', bbox: [4.0, 6.2, 5.9, 7.9], floor: 'cement' },
      { id: 'wsW', name: '卫生间（水电预埋）', bbox: [6.1, 9.7, 7.9, 11.8], floor: 'tile' },
      { id: 'pm1', name: '铺面 ①', bbox: [0.1, 12.2, 2.4, 18.3], floor: 'cement' },
      { id: 'pm2', name: '铺面 ②', bbox: [2.6, 12.2, 5.9, 18.3], floor: 'cement' },
      { id: 'pm3', name: '铺面 ③', bbox: [6.1, 6.1, 7.9, 9.5], floor: 'cement' },
      { id: 'pm4', name: '铺面 ③', bbox: [6.1, 12.2, 10.5, 18.3], floor: 'cement' },
      { id: 'pm5', name: '铺面 ③（东侧）', bbox: [8.1, 6.1, 10.5, 9.5], floor: 'cement' },
    ],
    furniture: [],
    mark: [4.7, 13.6, '±0.000'],
  },
  {
    id: 'fb1', name: '负一层平面图', sheet: 'JS-03', level: '-3.000', z: -3.0, h: 2.9, core: false,
    intro: '负一层（图号 JS-03，标高 -3.000）：整层大空间储藏间，位于 Ⓑ—Ⓓ 轴之间，现浇 200 厚砼墙，西北角设单跑楼梯（踏步 220×10=2200）与 ±0.000 相接，墙身防潮与地下室大样按 16/17 页施工。',
    walls: [
      { a: [3.6, 5.3], b: [10.7, 5.3], t: 0.2, h: 2.9, name: '北外墙', ops: [] },
      { a: [10.7, 5.3], b: [10.7, 13.4], t: 0.2, h: 2.9, name: '东外墙', ops: [] },
      { a: [3.6, 13.4], b: [10.7, 13.4], t: 0.2, h: 2.9, name: '南外墙', ops: [] },
      { a: [3.6, 5.3], b: [3.6, 13.4], t: 0.2, h: 2.9, name: '西外墙', ops: [] },
      { a: [6.0, 5.3], b: [6.0, 7.8], t: 0.2, h: 2.9, name: '楼梯间隔墙', ops: [
        { o: 1.25, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', -1] },
      ]},
      { a: [3.6, 7.8], b: [6.0, 7.8], t: 0.2, h: 2.9, name: '楼梯间南墙', ops: [] },
    ],
    rooms: [
      { id: 'lt', name: '楼梯间', bbox: [3.7, 5.4, 5.9, 7.7], floor: 'cement', stair: true, b1: true },
      { id: 'cc', name: '储藏间', bbox: [3.7, 7.9, 10.6, 13.3], floor: 'cement' },
      { id: 'cc2', name: '储藏间', bbox: [6.1, 5.4, 10.6, 7.7], floor: 'cement' },
    ],
    furniture: [],
    mark: [4.6, 9.6, '-3.000'],
  },
];
