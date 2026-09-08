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
  x: { vals: [0, 3.5, 7.0, 10.6, 11.9], labels: ['1', '2', '3', '4', null] },
  y: { vals: [-1.3, 0, 5.5, 9.5, 13.6, 18.5, 20.0], labels: [null, 'E', 'D', 'C', 'B', 'A', null] },
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
  /* 二至五层·七层（图号 JS-05，1:100 实测）：外墙 11.9×21.3（Ⓔ 北悬挑 1300、④ 东悬挑 1300），
     卫生间/阳台位于北悬挑带；户门均贴墙端布置（垛 ≤300），卧室门按图纸贴边 */
  return {
    z, level, h: H_STD, core: true,
    walls: [
      { a: [0, -1.3], b: [11.9, -1.3], t: 0.2, h: H_STD, name: '北外墙', ops: [
        { o: 0.9, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 2.2, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 4.8, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
        { o: 8.8, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
      ]},
      { a: [11.9, -1.3], b: [11.9, 20.0], t: 0.2, h: H_STD, name: '东外墙', ops: [
        { o: 0.55, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 3.05, w: 3.0, s: 0.9, h: 1.8, type: 'win', code: 'C3018' },
        { o: 6.4, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 9.7, w: 0.6, s: 2.1, h: 0.6, type: 'win', code: 'GZ2' },
        { o: 11.9, w: 0.6, s: 2.1, h: 0.6, type: 'win', code: 'GZ2' },
        { o: 16.0, w: 1.5, s: 0.9, h: 1.8, type: 'win', code: 'C1518' },
        { o: 18.3, w: 1.5, s: 0.9, h: 1.8, type: 'win', code: 'C1518' },
        { o: 20.55, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
      ]},
      { a: [0, 20.0], b: [11.9, 20.0], t: 0.2, h: H_STD, name: '南外墙', ops: [
        { o: 1.9, w: 2.4, s: 0.9, h: 1.8, type: 'win', code: 'C2418' },
        { o: 5.55, w: 2.4, s: 0.9, h: 1.8, type: 'win', code: 'C2418' },
        { o: 9.15, w: 2.4, s: 0.9, h: 1.8, type: 'win', code: 'C2418' },
        { o: 11.15, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
      ]},
      { a: [0, -1.3], b: [0, 20.0], t: 0.2, h: H_STD, name: '西外墙', ops: [
        { o: 3.35, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
        { o: 5.85, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 8.6, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 12.2, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 15.85, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 18.25, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
      ]},
      { a: [0, 0], b: [1.7, 0], t: 0.12, h: H_STD, name: '卫A南墙', ops: [
        { o: 1.35, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['n', -1] },
      ]},
      { a: [1.7, -1.3], b: [1.7, 0], t: 0.12, h: H_STD, name: '卫阳台隔墙', ops: [] },
      { a: [1.7, 0], b: [3.5, 0], t: 0.12, h: H_STD, name: '阳台A南墙', ops: [] },
      { a: [3.5, -1.3], b: [3.5, 0.1], t: 0.12, h: H_STD, name: '阳台卧室隔墙', ops: [
        { o: 0.55, w: 0.9, s: 0, h: 2.1, type: 'slide', code: 'M0921' },
      ]},
      { a: [3.5, 0.1], b: [3.5, 5.5], t: 0.12, h: H_STD, name: '厅卧室隔墙', ops: [
        { o: 1.5, w: 0.9, s: 0, h: 2.1, type: 'slide', code: 'M0921' },
        { o: 4.4, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', +1] },
      ]},
      { a: [0, 3.5], b: [2.4, 3.5], t: 0.12, h: H_STD, name: '厅厨房隔墙', ops: [
        { o: 1.2, w: 1.0, s: 0, h: 2.7, type: 'pass', code: '洞口' },
      ]},
      { a: [2.4, 3.5], b: [2.4, 5.5], t: 0.12, h: H_STD, name: '厨房走道隔墙', ops: [
        { o: 1.1, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['w', -1] },
      ]},
      { a: [0, 5.5], b: [2.4, 5.5], t: 0.2, h: H_STD, name: '厨房楼梯间墙', ops: [] },
      { a: [2.4, 5.5], b: [2.4, 9.5], t: 0.2, h: H_STD, name: '楼梯间门墙', ops: [
        { o: 3.1, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', +1] },
      ]},
      { a: [3.5, 5.5], b: [3.5, 9.5], t: 0.12, h: H_STD, name: '走道单间隔墙', ops: [
        { o: 0.6, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', +1] },
      ]},
      { a: [3.5, 9.5], b: [7.0, 9.5], t: 0.2, h: H_STD, name: '单间客厅隔墙', ops: [] },
      { a: [2.4, 9.5], b: [2.4, 13.6], t: 0.2, h: H_STD, name: '走廊电梯厅墙', ops: [] },
      { a: [3.5, 9.5], b: [3.5, 13.6], t: 0.12, h: H_STD, name: '走廊客厅隔墙', ops: [] },
      { a: [2.4, 13.6], b: [3.5, 13.6], t: 0.12, h: H_STD, name: '走廊 studio 隔墙', ops: [
        { o: 0.55, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['s', +1] },
      ]},
      { a: [7.0, -1.3], b: [7.0, 2.05], t: 0.2, h: H_STD, name: '两卧室隔墙', ops: [] },
      { a: [7.0, 2.05], b: [10.6, 2.05], t: 0.12, h: H_STD, name: '卧室客厅隔墙', ops: [
        { o: 0.45, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['s', +1] },
      ]},
      { a: [10.6, 0.1], b: [10.6, 3.4], t: 0.12, h: H_STD, name: '卧室阳台隔墙', ops: [
        { o: 1.0, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['e', +1] },
      ]},
      { a: [10.6, 3.4], b: [11.9, 3.4], t: 0.12, h: H_STD, name: '阳台厨房隔墙', ops: [] },
      { a: [9.65, 7.4], b: [11.9, 7.4], t: 0.12, h: H_STD, name: '厨卫隔墙', ops: [] },
      { a: [9.65, 11.6], b: [11.9, 11.6], t: 0.12, h: H_STD, name: '卫厨隔墙', ops: [] },
      { a: [0, 13.6], b: [2.4, 13.6], t: 0.2, h: H_STD, name: '电梯厅厨房隔墙', ops: [] },
      { a: [2.4, 5.5], b: [3.5, 5.5], t: 0.12, h: H_STD, name: '玄关走廊隔墙', ops: [
        { o: 0.55, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['n', -1] },
      ]},
      { a: [3.5, 13.6], b: [3.5, 20.0], t: 0.12, h: H_STD, name: '玄关客厅隔墙', ops: [
        { o: 1.0, w: 1.2, s: 0, h: 2.7, type: 'pass', code: '洞口' },
        { o: 2.75, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['w', -1] },
      ]},
      { a: [7.0, 2.05], b: [7.0, 9.5], t: 0.12, h: H_STD, name: '厅餐隔墙', ops: [
        { o: 2.65, w: 1.4, s: 0, h: 2.7, type: 'pass', code: '洞口' },
      ]},
      { a: [9.65, 3.45], b: [9.65, 9.5], t: 0.12, h: H_STD, name: '餐厨卫隔墙', ops: [
        { o: 3.1, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['e', +1] },
        { o: 4.4, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['e', +1] },
      ]},
      { a: [7.0, 9.5], b: [7.0, 13.6], t: 0.12, h: H_STD, name: '客厅餐厅隔墙', ops: [
        { o: 1.1, w: 1.2, s: 0, h: 2.7, type: 'pass', code: '洞口' },
      ]},
      { a: [9.65, 9.5], b: [9.65, 13.6], t: 0.12, h: H_STD, name: '餐卫厨隔墙', ops: [
        { o: 1.1, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['w', -1] },
        { o: 3.05, w: 0.8, s: 0, h: 2.1, type: 'pass', code: '洞口' },
      ]},
      { a: [7.0, 13.6], b: [11.9, 13.6], t: 0.12, h: H_STD, name: '卧室餐厨隔墙', ops: [
        { o: 1.25, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['s', +1] },
      ]},
      { a: [7.0, 15.4], b: [11.9, 15.4], t: 0.12, h: H_STD, name: '两卧隔墙', ops: [] },
      { a: [7.0, 15.4], b: [7.0, 18.4], t: 0.12, h: H_STD, name: '客厅卧室隔墙', ops: [
        { o: 0.55, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['e', +1] },
      ]},
      { a: [7.0, 18.4], b: [11.9, 18.4], t: 0.12, h: H_STD, name: '卧室阳台卫生间隔墙', ops: [] },
      { a: [9.7, 18.4], b: [9.7, 20.0], t: 0.12, h: H_STD, name: '阳台卫生间隔墙', ops: [
        { o: 0.75, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['e', +1] },
      ]},
      { a: [0, 15.6], b: [3.5, 15.6], t: 0.12, h: H_STD, name: '厨房卧室隔墙', ops: [] },
      { a: [1.9, 13.6], b: [1.9, 15.6], t: 0.12, h: H_STD, name: '厨房隔墙', ops: [
        { o: 1.0, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['w', -1] },
      ]},
      { a: [0, 18.4], b: [3.4, 18.4], t: 0.12, h: H_STD, name: '卧室阳台隔墙', ops: [
        { o: 0.75, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['s', +1] },
      ]},
    ],
    rooms: [
      { id: 'wsA', name: '卫生间', bbox: [0.2, -1.1, 1.6, -0.2], floor: 'tile' },
      { id: 'ytA', name: '阳台', bbox: [1.85, -1.1, 3.35, -0.2], floor: 'deck' },
      { id: 'tA', name: '一房一厅·厅', bbox: [0.2, 0.2, 3.35, 3.4], floor: 'wood' },
      { id: 'cfA', name: '厨房', bbox: [0.2, 3.65, 2.3, 5.35], floor: 'tile' },
      { id: 'xtA', name: '玄关', bbox: [2.55, 3.65, 3.35, 5.35], floor: 'stone' },
      { id: 'wfW', name: '卧室', bbox: [3.7, -1.1, 6.8, 1.9], floor: 'wood' },
      { id: 'tB', name: '一房一厅·厅', bbox: [3.7, 2.25, 6.8, 5.35], floor: 'wood' },
      { id: 'wsC', name: '浴室', bbox: [7.2, -1.1, 8.9, -0.2], floor: 'tile' },
      { id: 'wsD', name: '卫生间', bbox: [9.2, -1.1, 11.75, -0.2], floor: 'tile' },
      { id: 'wfD', name: '卧室', bbox: [7.2, 0.2, 10.45, 1.9], floor: 'wood' },
      { id: 'ytD', name: '阳台', bbox: [10.75, 0.2, 11.75, 3.25], floor: 'deck' },
      { id: 'dj', name: '单间', bbox: [3.7, 5.7, 6.8, 9.3], floor: 'wood' },
      { id: 'ctM', name: '餐厅', bbox: [7.2, 2.25, 9.5, 9.3], floor: 'wood' },
      { id: 'cfM', name: '厨房', bbox: [9.85, 3.55, 11.75, 7.3], floor: 'tile' },
      { id: 'wsM', name: '卫生间', bbox: [9.85, 7.5, 11.75, 9.3], floor: 'tile' },
      { id: 'zkC', name: '走廊', bbox: [2.6, 5.7, 3.35, 13.4], floor: 'stone' },
      { id: 'lt', name: '楼梯间', bbox: [0.2, 5.7, 2.3, 9.3], floor: 'stone', stair: true },
      { id: 'dt', name: '电梯厅', bbox: [0.2, 9.7, 2.3, 13.4], floor: 'stone' },
      { id: 'ktD', name: '两房一厅·客厅', bbox: [3.7, 9.7, 6.8, 19.8], floor: 'wood' },
      { id: 'ctF', name: '餐厅', bbox: [7.2, 9.7, 9.5, 13.4], floor: 'wood' },
      { id: 'wsF', name: '卫生间', bbox: [9.85, 9.7, 11.75, 11.4], floor: 'tile' },
      { id: 'cfF', name: '厨房', bbox: [9.85, 11.7, 11.75, 13.4], floor: 'tile' },
      { id: 'xtE', name: '玄关', bbox: [2.0, 13.7, 3.35, 15.5], floor: 'stone' },
      { id: 'wfG', name: '卧室', bbox: [7.2, 13.8, 11.75, 15.25], floor: 'wood' },
      { id: 'wfF', name: '卧室', bbox: [7.2, 15.6, 11.75, 18.2], floor: 'wood' },
      { id: 'ytF', name: '阳台', bbox: [7.2, 18.6, 9.55, 19.8], floor: 'deck' },
      { id: 'wsG', name: '卫生间', bbox: [9.85, 18.6, 11.75, 19.8], floor: 'tile' },
      { id: 'cfE', name: '厨房', bbox: [0.2, 13.8, 1.8, 15.45], floor: 'tile' },
      { id: 'wfE', name: '卧室', bbox: [0.2, 15.8, 3.3, 18.25], floor: 'wood' },
      { id: 'ytE', name: '阳台', bbox: [0.2, 18.6, 3.3, 19.8], floor: 'deck' },
    ],
    furniture: [
      { type: 'toilet', pos: [0.5, -0.65], rot: 0 },
      { type: 'basin', pos: [1.35, -0.65], rot: 0 },
      { type: 'lSofa', pos: [1.1, 1.8], rot: 0 },
      { type: 'kitchenCounter', pos: [1.2, 3.82], rot: 0, s: 0.45 },
      { type: 'bed', pos: [5.35, 0.5], rot: 0 },
      { type: 'wardrobe', pos: [4.0, 0.4], rot: Math.PI / 2, s: 0.7 },
      { type: 'lSofa', pos: [4.7, 3.3], rot: 0 },
      { type: 'coffeeTable', pos: [6.1, 2.85], rot: 0 },
      { type: 'tvUnit', pos: [4.85, 5.15], rot: 0 },
      { type: 'bed', pos: [8.8, 1.05], rot: Math.PI / 2, s: 0.8 },
      { type: 'nightstand', pos: [7.45, 0.5], rot: 0 },
      { type: 'nightstand', pos: [10.15, 0.5], rot: 0 },
      { type: 'bathtub', pos: [7.9, -0.65], rot: 0 },
      { type: 'toilet', pos: [9.7, -0.65], rot: 0 },
      { type: 'basin', pos: [10.9, -0.65], rot: 0 },
      { type: 'bed', pos: [5.1, 7.4], rot: 0 },
      { type: 'wardrobe', pos: [3.95, 7.4], rot: Math.PI / 2, s: 0.75 },
      { type: 'table4', pos: [7.75, 8.4], rot: 0 },
      { type: 'kitchenCounter', pos: [10.75, 5.95], rot: 0, s: 0.4 },
      { type: 'toilet', pos: [10.9, 8.4], rot: -Math.PI / 2 },
      { type: 'basin', pos: [10.9, 7.85], rot: -Math.PI / 2 },
      { type: 'table4', pos: [7.75, 10.45], rot: 0 },
      { type: 'kitchenCounter', pos: [10.75, 11.95], rot: 0, s: 0.4 },
      { type: 'toilet', pos: [10.9, 10.1], rot: -Math.PI / 2 },
      { type: 'basin', pos: [10.9, 10.9], rot: -Math.PI / 2 },
      { type: 'bed', pos: [9.45, 14.5], rot: 0, s: 0.65 },
      { type: 'bed', pos: [9.5, 16.6], rot: 0 },
      { type: 'wardrobe', pos: [10.6, 18.1], rot: 0, s: 0.65 },
      { type: 'toilet', pos: [10.9, 19.2], rot: -Math.PI / 2 },
      { type: 'basin', pos: [10.2, 19.45], rot: Math.PI },
      { type: 'kitchenCounter', pos: [1.4, 13.95], rot: 0, s: 0.45 },
      { type: 'bed', pos: [1.75, 16.95], rot: 0 },
      { type: 'wardrobe', pos: [0.7, 18.12], rot: 0, s: 0.5 },
      { type: 'lSofa', pos: [4.5, 18.3], rot: Math.PI, s: 0.7 },
      { type: 'table4', pos: [5.2, 14.3], rot: 0, s: 0.9 },
    ],
  };
}

/* ---------------- 六层 / 八层：整层大宅 ---------------- */
function bigFloor(z, level) {
  /* 六层/八层（图号 JS-06/JS-08 同布局）：整层大宅，北悬挑浴卫带、东悬挑卧室/阳台，
     主卫独立成间（西墙 200 与主人房隔断）、南带浴室；卧室门全部贴墙端 */
  return {
    z, level, h: H_STD, core: true,
    walls: [
      { a: [0, -1.3], b: [11.9, -1.3], t: 0.2, h: H_STD, name: '北外墙', ops: [
        { o: 0.9, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 2.2, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 4.8, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
        { o: 8.8, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
      ]},
      { a: [11.9, -1.3], b: [11.9, 20.0], t: 0.2, h: H_STD, name: '东外墙', ops: [
        { o: 0.55, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 3.55, w: 3.0, s: 0.9, h: 1.8, type: 'win', code: 'C3018' },
        { o: 8.3, w: 2.0, s: 0.9, h: 1.8, type: 'win', code: 'C2018' },
        { o: 11.65, w: 0.7, s: 2.1, h: 0.6, type: 'win', code: 'GZ2' },
        { o: 14.9, w: 2.0, s: 0.9, h: 1.8, type: 'win', code: 'C2018' },
        { o: 17.3, w: 1.5, s: 0.9, h: 1.8, type: 'win', code: 'C1518' },
        { o: 20.65, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
      ]},
      { a: [0, 20.0], b: [11.9, 20.0], t: 0.2, h: H_STD, name: '南外墙', ops: [
        { o: 1.9, w: 2.4, s: 0.9, h: 1.8, type: 'win', code: 'C2418' },
        { o: 5.55, w: 2.4, s: 0.9, h: 1.8, type: 'win', code: 'C2418' },
        { o: 11.55, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
      ]},
      { a: [0, -1.3], b: [0, 20.0], t: 0.2, h: H_STD, name: '西外墙', ops: [
        { o: 3.35, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
        { o: 8.7, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 13.35, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 18.2, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
      ]},
      { a: [0, 0], b: [3.5, 0], t: 0.12, h: H_STD, name: '浴卫南墙', ops: [
        { o: 0.9, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['s', +1] },
      ]},
      { a: [2.0, -1.3], b: [2.0, 0], t: 0.12, h: H_STD, name: '卫浴隔墙', ops: [] },
      { a: [3.5, -1.3], b: [3.5, 4.95], t: 0.2, h: H_STD, name: '卧室隔墙', ops: [] },
      { a: [0, 4.95], b: [3.5, 4.95], t: 0.2, h: H_STD, name: '卧室南墙', ops: [
        { o: 2.1, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['n', -1] },
      ]},
      { a: [2.4, 4.95], b: [2.4, 9.5], t: 0.12, h: H_STD, name: '玄关楼梯间墙', ops: [
        { o: 1.55, w: 1.2, s: 0, h: 2.1, type: 'door', code: 'M1221', swing: ['e', +1] },
      ]},
      { a: [3.5, 3.95], b: [7.0, 3.95], t: 0.2, h: H_STD, name: '卧室B南墙', ops: [
        { o: 2.35, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['s', +1] },
      ]},
      { a: [7.0, -1.3], b: [7.0, 9.45], t: 0.2, h: H_STD, name: '卧室过厅墙', ops: [
        { o: 5.5, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['e', +1] },
      ]},
      { a: [7.0, 3.75], b: [11.9, 3.75], t: 0.12, h: H_STD, name: '卧室C南墙', ops: [] },
      { a: [7.0, 9.45], b: [7.0, 11.3], t: 0.12, h: H_STD, name: '过厅盥洗隔墙', ops: [
        { o: 0.55, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['e', +1] },
      ]},
      { a: [7.0, 9.45], b: [11.9, 9.45], t: 0.2, h: H_STD, name: '卧室卫浴隔墙', ops: [] },
      { a: [8.6, 9.45], b: [8.6, 13.5], t: 0.12, h: H_STD, name: '盥洗室衣帽间隔墙', ops: [
        { o: 0.65, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['w', -1] },
      ]},
      { a: [10.45, 9.45], b: [10.45, 11.3], t: 0.12, h: H_STD, name: '卫浴隔墙', ops: [] },
      { a: [7.0, 11.3], b: [11.9, 11.3], t: 0.12, h: H_STD, name: '卫浴衣帽隔墙', ops: [] },
      { a: [8.6, 13.5], b: [11.9, 13.5], t: 0.12, h: H_STD, name: '衣帽间主人房隔墙', ops: [
        { o: 1.1, w: 1.6, s: 0, h: 2.7, type: 'slide', code: 'M1627' },
      ]},
      { a: [2.4, 13.5], b: [7.0, 13.5], t: 0.2, h: H_STD, name: '过厅餐厅隔墙', ops: [
        { o: 1.85, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['s', +1] },
      ]},
      { a: [7.0, 13.5], b: [7.0, 20.0], t: 0.2, h: H_STD, name: '餐厅主人房隔墙', ops: [
        { o: 0.7, w: 0.9, s: 0, h: 2.1, type: 'door', code: 'M0921', swing: ['e', +1] },
      ]},
      { a: [10.65, 15.4], b: [11.9, 15.4], t: 0.2, h: H_STD, name: '主卫北墙', ops: [
        { o: 0.4, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['s', +1] },
      ]},
      { a: [10.65, 15.4], b: [10.65, 20.0], t: 0.2, h: H_STD, name: '主卫浴室西墙', ops: [
        { o: 3.75, w: 1.0, s: 0, h: 2.1, type: 'slide', code: 'M0921' },
      ]},
      { a: [10.65, 18.35], b: [11.9, 18.35], t: 0.12, h: H_STD, name: '主卫浴室隔墙', ops: [] },
      { a: [0, 5.5], b: [2.4, 5.5], t: 0.2, h: H_STD, name: '楼梯间北墙', ops: [] },
      { a: [0, 13.5], b: [2.4, 13.5], t: 0.2, h: H_STD, name: '电梯厅客厅隔墙', ops: [] },
    ],
    rooms: [
      { id: 'ws1', name: '卫生间', bbox: [0.2, -1.1, 1.9, -0.2], floor: 'tile' },
      { id: 'bs1', name: '浴室', bbox: [2.15, -1.1, 3.35, -0.2], floor: 'tile' },
      { id: 'wdA', name: '卧室 15.68㎡', bbox: [0.2, 0.2, 3.35, 4.8], floor: 'wood' },
      { id: 'wdB', name: '卧室 16.63㎡', bbox: [3.85, -1.1, 6.85, 3.75], floor: 'wood' },
      { id: 'wdC', name: '卧室 22.54㎡', bbox: [7.2, -1.1, 11.75, 3.65], floor: 'wood' },
      { id: 'wdD', name: '卧室', bbox: [7.2, 3.85, 11.75, 9.3], floor: 'wood' },
      { id: 'gtE', name: '过厅', bbox: [7.2, 11.45, 8.5, 13.3], floor: 'stone' },
      { id: 'xj', name: '盥洗区', bbox: [7.2, 9.6, 8.5, 11.2], floor: 'tile' },
      { id: 'ws2', name: '卫生间', bbox: [8.75, 9.6, 10.35, 11.15], floor: 'tile' },
      { id: 'bs2', name: '浴室', bbox: [10.6, 9.6, 11.75, 11.15], floor: 'tile' },
      { id: 'ymj', name: '衣帽间', bbox: [8.75, 11.45, 11.75, 13.3], floor: 'wood' },
      { id: 'lt', name: '楼梯间', bbox: [0.2, 5.2, 2.3, 9.3], floor: 'stone', stair: true },
      { id: 'dt', name: '电梯厅', bbox: [0.2, 9.7, 2.3, 13.3], floor: 'stone' },
      { id: 'gt', name: '过厅', bbox: [2.5, 4.85, 6.85, 13.3], floor: 'stone' },
      { id: 'gtN', name: '玄关', bbox: [3.6, 4.05, 6.85, 4.85], floor: 'stone' },
      { id: 'kt', name: '客厅', bbox: [0.2, 13.8, 6.85, 19.8], floor: 'wood' },
      { id: 'zrf', name: '主人房', bbox: [7.2, 13.8, 10.5, 19.8], floor: 'wood' },
      { id: 'zws', name: '主卫', bbox: [10.85, 15.6, 11.75, 18.2], floor: 'tile' },
      { id: 'yss', name: '浴室', bbox: [10.85, 18.6, 11.75, 19.8], floor: 'tile' },
    ],
    furniture: [
      { type: 'toilet', pos: [1.15, -0.65], rot: 0 },
      { type: 'basin', pos: [0.5, -0.65], rot: 0 },
      { type: 'bed', pos: [1.65, 2.45], rot: Math.PI / 2 },
      { type: 'wardrobe', pos: [1.0, 4.5], rot: 0, s: 0.9 },
      { type: 'bed', pos: [5.3, 1.35], rot: 0 },
      { type: 'wardrobe', pos: [5.5, 3.3], rot: 0, s: 0.9 },
      { type: 'bed', pos: [9.45, 1.3], rot: 0 },
      { type: 'wardrobe', pos: [9.7, 3.32], rot: 0, s: 0.85 },
      { type: 'bed', pos: [8.3, 6.0], rot: 0 },
      { type: 'basin', pos: [7.7, 10.75], rot: Math.PI / 2 },
      { type: 'toilet', pos: [9.75, 10.35], rot: -Math.PI / 2 },
      { type: 'wardrobe', pos: [10.25, 12.0], rot: 0, s: 0.85 },
      { type: 'wardrobe', pos: [9.15, 12.35], rot: Math.PI / 2, s: 0.8 },
      { type: 'tvUnit', pos: [1.55, 14.05], rot: 0 },
      { type: 'sofa3', pos: [1.85, 17.25], rot: Math.PI / 2, s: 0.75 },
      { type: 'sofa3', pos: [0.95, 16.15], rot: 0, s: 0.6 },
      { type: 'coffeeTable', pos: [1.85, 15.9], rot: 0 },
      { type: 'rug', pos: [1.6, 16.4], rot: 0 },
      { type: 'bed', pos: [8.3, 16.45], rot: 0 },
      { type: 'nightstand', pos: [7.5, 15.05], rot: 0 },
      { type: 'nightstand', pos: [9.1, 15.05], rot: 0 },
      { type: 'toilet', pos: [11.3, 17.0], rot: -Math.PI / 2 },
      { type: 'basin', pos: [11.3, 15.95], rot: -Math.PI / 2 },
      { type: 'toilet', pos: [10.15, -0.62], rot: 0 },
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
      { a: [0, -1.3], b: [11.9, -1.3], t: 0.2, h: H_PARAPET, parapet: true, name: '北女儿墙', ops: [] },
      { a: [11.9, -1.3], b: [11.9, 20.0], t: 0.2, h: H_PARAPET, parapet: true, name: '东女儿墙', ops: [] },
      { a: [0, -1.3], b: [0, 20.0], t: 0.2, h: H_PARAPET, parapet: true, name: '西女儿墙', ops: [] },
      { a: [0, 20.0], b: [11.9, 20.0], t: 0.2, h: H_PARAPET, parapet: true, name: '南女儿墙', ops: [] },
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
    intro: '九层（图号 JS-09，标高 26.900）为整层一户的顶层宅邸：北侧悬挑带布置浴室、卫生间与洗衣间，西北为卧室，东北为餐厅与大厨房，中部过厅连接楼梯电梯，南侧会客厅与茶室环通，整层南向大露台。为便于俯瞰，模型未建屋顶楼板。',
    walls: [
      { a: [0, -1.3], b: [11.9, -1.3], t: 0.2, h: 4.0, name: '北外墙', ops: [
        { o: 0.9, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 2.2, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
      ]},
      { a: [11.9, -1.3], b: [11.9, 13.5], t: 0.2, h: 4.0, name: '东外墙', ops: [
        { o: 0.55, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 3.75, w: 3.0, s: 0.9, h: 1.8, type: 'win', code: 'C3018' },
        { o: 6.4, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 8.0, w: 2.0, s: 0.9, h: 1.8, type: 'win', code: 'C2018' },
        { o: 10.2, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 11.55, w: 0.7, s: 0.9, h: 1.4, type: 'win', code: 'C0714' },
        { o: 13.7, w: 2.0, s: 0.9, h: 1.8, type: 'win', code: 'C2018' },
      ]},
      { a: [0, 20.0], b: [11.9, 20.0], t: 0.2, h: H_PARAPET, parapet: true, name: '露台南女儿墙', ops: [] },
      { a: [0, -1.3], b: [0, 13.5], t: 0.2, h: 4.0, name: '西外墙', ops: [
        { o: 3.35, w: 1.8, s: 0.9, h: 1.8, type: 'win', code: 'C1818' },
        { o: 8.6, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
        { o: 12.8, w: 1.2, s: 0.9, h: 1.8, type: 'win', code: 'C1218' },
      ]},
      { a: [0, 0], b: [3.5, 0], t: 0.12, h: 4.0, name: '浴卫南墙', ops: [
        { o: 3.15, w: 0.7, s: 0, h: 2.1, type: 'door', code: 'M0721', swing: ['n', -1] },
      ]},
      { a: [1.55, -1.3], b: [1.55, 0], t: 0.12, h: 4.0, name: '浴室卫生间隔墙', ops: [] },
      { a: [3.5, -1.3], b: [3.5, 0.1], t: 0.12, h: 4.0, name: '洗衣间隔墙', ops: [] },
      { a: [3.5, 0.1], b: [11.9, 0.1], t: 0.12, h: 4.0, name: '洗衣间厨餐隔墙', ops: [
        { o: 6.4, w: 0.8, s: 0, h: 2.1, type: 'pass', code: '洞口' },
      ]},
      { a: [3.5, 0.1], b: [3.5, 5.5], t: 0.2, h: 4.0, name: '卧室餐厅隔墙', ops: [
        { o: 4.75, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['w', -1] },
      ]},
      { a: [8.9, 0.1], b: [8.9, 5.5], t: 0.12, h: 4.0, name: '餐厅厨房隔墙', ops: [
        { o: 2.8, w: 2.4, s: 0, h: 2.7, type: 'slide', code: 'M2427' },
      ]},
      { a: [3.5, 5.5], b: [11.9, 5.5], t: 0.2, h: 4.0, name: '餐厨过厅墙', ops: [
        { o: 2.7, w: 1.6, s: 0, h: 2.7, type: 'pass', code: '洞口' },
      ]},
      { a: [2.5, 5.5], b: [2.5, 9.5], t: 0.2, h: 4.0, name: '楼梯间门墙', ops: [
        { o: 3.45, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', +1] },
      ]},
      { a: [0, 5.5], b: [2.5, 5.5], t: 0.2, h: 4.0, name: '楼梯间北墙', ops: [] },
      { a: [7.0, 5.5], b: [7.0, 9.5], t: 0.12, h: 4.0, name: '过厅会客隔墙', ops: [
        { o: 1.65, w: 1.6, s: 0, h: 2.7, type: 'slide', code: 'M1627' },
      ]},
      { a: [3.5, 9.5], b: [11.9, 9.5], t: 0.12, h: 4.0, name: '会客茶室隔墙', ops: [
        { o: 6.7, w: 1.6, s: 0, h: 2.7, type: 'pass', code: '洞口' },
      ]},
      { a: [3.5, 9.5], b: [3.5, 13.5], t: 0.2, h: 4.0, name: '电梯厅茶室墙', ops: [
        { o: 3.4, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', +1] },
      ]},
      { a: [3.5, 13.5], b: [11.9, 13.5], t: 0.2, h: 4.0, name: '茶室露台墙', ops: [
        { o: 4.7, w: 1.6, s: 0, h: 2.7, type: 'slide', code: 'M1627' },
      ]},
      { a: [0, 13.5], b: [3.5, 13.5], t: 0.2, h: 4.0, name: '楼梯间露台墙', ops: [
        { o: 2.95, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['s', +1] },
      ]},
      { a: [0, 13.5], b: [0, 20.0], t: 0.2, h: H_PARAPET, parapet: true, name: '露台西女儿墙', ops: [] },
      { a: [11.9, 13.5], b: [11.9, 20.0], t: 0.2, h: H_PARAPET, parapet: true, name: '露台东女儿墙', ops: [] },
    ],
    rooms: [
      { id: 'bsF', name: '浴室', bbox: [0.2, -1.1, 1.45, -0.2], floor: 'tile' },
      { id: 'wsF', name: '卫生间', bbox: [1.7, -1.1, 3.35, -0.2], floor: 'tile' },
      { id: 'woshi', name: '卧室', bbox: [0.2, 0.2, 3.35, 5.35], floor: 'wood',
        enter: { pos: [1.75, 1.6, 4.6], look: [1.75, 0.8, 1.2] },
        desc: '主卧，约 12.2㎡，床尾东向衣柜布置，北门 M1021 贴墙端。' },
      { id: 'canting', name: '餐厅', bbox: [3.7, 0.2, 8.75, 5.35], floor: 'wood',
        enter: { pos: [4.3, 1.6, 4.8], look: [6.3, 0.8, 2.7] },
        desc: '餐厅，Ø1800 十人圆桌居中，西连卧室、东经 M2427 推拉门入厨房、南通过厅。”' },
      { id: 'chufang', name: '厨房', bbox: [9.05, 0.2, 11.75, 4.35], floor: 'tile',
        enter: { pos: [9.4, 1.6, 4.0], look: [10.6, 0.8, 1.6] },
        desc: '全明厨房约 10.4㎡，L 型台面沿北墙与东墙，东墙 C3018 大窗，北通过洗衣间。”' },
      { id: 'xyj', name: '洗衣间', bbox: [3.7, -1.1, 11.75, -0.05], floor: 'tile',
        desc: '北悬挑洗衣间，贯穿 8.2m：洗衣机烘干机机组靠东墙，经厨房北部洞口进出。”' },
      { id: 'guoke', name: '过厅', bbox: [2.7, 5.7, 6.9, 9.3], floor: 'stone',
        enter: { pos: [6.3, 1.7, 6.4], look: [3.6, 1.0, 8.6] },
        desc: '整户交通枢纽，室内标高 ▽26.900：北接餐厅、南达茶室，西经 M1021 入楼梯间、东经 M1627 入会客厅。”' },
      { id: 'louti', name: '楼梯间', bbox: [0.2, 5.7, 2.4, 9.3], floor: 'stone',
        desc: '现浇双跑楼梯，可由本层（26.900）上至屋面（31.100）、下达各层；南门 M1021 直通露台兼作屋面出入口。”' },
      { id: 'dianti', name: '电梯厅', bbox: [0.2, 9.7, 3.4, 13.3], floor: 'stone',
        enter: { pos: [2.9, 1.6, 12.9], look: [1.2, 1.4, 10.8] },
        desc: '电梯厅环绕 1800×2200 电梯井，出电梯即厅廊：南 M1021 通露台，东 M1021 入茶室。”' },
      { id: 'guoting', name: '会客厅', bbox: [7.2, 5.7, 11.75, 9.3], floor: 'wood',
        enter: { pos: [7.6, 1.6, 8.9], look: [10.8, 0.9, 6.6] },
        desc: '正式会客厅约 43㎡，沙发组朝西，电视墙居南，C2018 东窗纳景，M1627 推拉门连过厅。”' },
      { id: 'chashi', name: '茶室', bbox: [3.7, 9.7, 11.75, 13.3], floor: 'wood',
        enter: { pos: [4.4, 1.6, 10.6], look: [8.6, 0.9, 12.0] },
        desc: '茶室约 34㎡，图纸此间未布置家具；应业主要求补置曲尺茶榻、茶桌（含整套茶具）与北墙博古架，为留白空间提供品茗场景。北通会客厅，南 M1627 推拉门整片开启直入露台。”' },
      { id: 'lutai', name: '露台', bbox: [0.2, 13.7, 11.75, 19.8], floor: 'deck',
        enter: { pos: [9.4, 3.2, 14.2], look: [1.2, 0.5, 18.8] },
        desc: '整层南向大露台约 63㎡，面层 1%、2% 找坡排水，四周女儿墙与泄水孔按露台大样施工；西南角弧形花池，M1021 兼作屋面出入口。”' },
    ],
    furniture: [
      { room: 'woshi', type: 'bed', pos: [2.05, 1.85], rot: -Math.PI / 2, name: '双人床', desc: '1800×2000 双人床，床头贴东墙（图纸原位），西侧 C1818 窗纳景。' },
      { room: 'woshi', type: 'nightstand', pos: [3.15, 0.6], rot: 0, name: '床头柜', desc: '500×500 实木床头柜，上置台灯（图纸原位）。' },
      { room: 'woshi', type: 'nightstand', pos: [3.15, 3.05], rot: 0, name: '床头柜', desc: '500×500 实木床头柜，上置台灯（图纸原位）。' },
      { room: 'wsF', type: 'toilet', pos: [2.95, -0.65], rot: Math.PI, name: '坐便器', desc: '坐便器，排污管沿墙暗敷。' },
      { room: 'wsF', type: 'basin', pos: [2.05, -0.62], rot: Math.PI, name: '台盆', desc: '陶瓷台盆。' },
      { room: 'bsF', type: 'bathtub', pos: [0.8, -0.62], rot: 0, name: '浴缸', desc: '1500×750 裙板浴缸，淋浴花洒。' },
      { room: 'xyj', type: 'laundry', pos: [10.9, -0.6], rot: 0, name: '洗衣机组', desc: '洗衣机+烘干机并列，北墙 C0714 通风采光。' },
      { room: 'canting', type: 'diningSet', pos: [6.25, 2.65], rot: 0, name: '十人圆餐桌', desc: 'Ø1800 圆桌配十椅，居餐厅正中，家宴待客。' },
      { room: 'chufang', type: 'kitchenCounter', pos: [10.7, 1.0], rot: 0, s: 0.85, name: 'L 型橱柜', desc: 'L 型台面沿北墙与东墙：双灶+双槽水槽，上方吊柜。' },
      { room: 'chufang', type: 'fridge', pos: [9.4, 3.9], rot: 0, name: '冰箱', desc: '双门冰箱置于南端，紧邻 M2427 取餐动线。' },
      { room: 'guoting', type: 'sofa3', pos: [9.65, 5.9], rot: Math.PI / 2, s: 0.8, name: '三人沙发', desc: '三人沙发贴北墙布置，面向南侧电视墙——图纸原位。' },
      { room: 'guoting', type: 'armchair', pos: [8.45, 6.9], rot: Math.PI / 2, name: '扶手椅', desc: '西侧扶手椅，与东侧成对。' },
      { room: 'guoting', type: 'armchair', pos: [10.85, 6.9], rot: -Math.PI / 2, name: '扶手椅', desc: '东侧扶手椅，与西侧成对。' },
      { room: 'guoting', type: 'rug', pos: [9.65, 8.1], rot: 0, s: 0.75, name: '地毯', desc: '沙发组地毯，图纸绘花饰。' },
      { room: 'guoting', type: 'coffeeTable', pos: [9.68, 7.15], rot: 0, name: '茶几', desc: '沙发组中央茶几——图纸原位。' },
      { room: 'guoting', type: 'tvUnit', pos: [9.9, 9.15], rot: 0, name: '电视柜', desc: '长几贴南墙，与沙发组相对——图纸原位。' },
      { room: 'chashi', type: 'shelf', pos: [5.6, 9.95], rot: 0, name: '博古架', desc: '北墙 2400 长博古架，陈列紫砂壶、茶盏与茶宠——业主指定补置。' },
      { room: 'chashi', type: 'lSofa', pos: [5.3, 11.6], rot: 0, s: 0.75, name: '曲尺茶榻', desc: 'L 型曲尺茶榻，围合出品茗主位——业主指定补置。' },
      { room: 'chashi', type: 'teaTable', pos: [7.2, 11.5], rot: 0, name: '茶桌', desc: '1500×900 茶桌，桌面置整套茶具（壶、公道、茶盏）——业主指定补置。' },
      { room: 'chashi', type: 'chair', pos: [7.35, 10.6], rot: Math.PI, name: '茶凳', desc: '茶桌两侧茶凳之一。' },
      { room: 'chashi', type: 'chair', pos: [7.35, 12.4], rot: 0, name: '茶凳', desc: '茶桌两侧茶凳之二。' },
      { room: 'lutai', type: 'flowerPool', pos: [0.15, 19.8], rot: 0, name: '弧形花池', desc: '西南角 1/4 圆弧花池，内植灌木球——对应图纸西南角弧形构筑。' },
    ],
    mark: [4.8, 7.5, '26.900'],
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
      { id: 'gt', name: '过厅', bbox: [2.6, 8.0, 5.9, 11.8], floor: 'cement' },
      { id: 'gtW', name: '过厅', bbox: [2.6, 6.1, 3.9, 8.0], floor: 'cement' },
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
      { a: [3.5, 5.5], b: [10.6, 5.5], t: 0.2, h: 2.9, name: '北外墙', ops: [] },
      { a: [10.6, 5.5], b: [10.6, 13.5], t: 0.2, h: 2.9, name: '东外墙', ops: [] },
      { a: [3.5, 13.5], b: [10.6, 13.5], t: 0.2, h: 2.9, name: '南外墙', ops: [] },
      { a: [3.5, 5.5], b: [3.5, 13.5], t: 0.2, h: 2.9, name: '西外墙', ops: [] },
      { a: [6.0, 5.5], b: [6.0, 7.8], t: 0.2, h: 2.9, name: '楼梯间隔墙', ops: [
        { o: 1.25, w: 1.0, s: 0, h: 2.1, type: 'door', code: 'M1021', swing: ['e', -1] },
      ]},
      { a: [3.6, 7.8], b: [6.0, 7.8], t: 0.2, h: 2.9, name: '楼梯间南墙', ops: [] },
    ],
    rooms: [
      { id: 'lt', name: '楼梯间', bbox: [3.6, 5.6, 5.9, 7.7], floor: 'stone', stair: true, b1: true },
      { id: 'cc', name: '储藏间', bbox: [3.6, 7.9, 10.5, 13.4], floor: 'cement' },
      { id: 'cc2', name: '储藏间', bbox: [6.1, 5.6, 10.5, 7.7], floor: 'cement' },
    ],
    furniture: [],
    mark: [4.6, 9.6, '-3.000'],
  },
];
