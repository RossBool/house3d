'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('view');
  const tour = window.TOUR;
  const nodes = tour.nodes || [];
  const models = tour.models;
  let current = null, model = 'standard', unit = 'A';
  let yaw = 0, pitch = 0, fov = 75, auto = false, token = 0, dirty = true, last = 0;
  let renderer = null;

  function showError(message) {
    $('error').textContent = message;
    $('error').hidden = false;
    $('loading').hidden = true;
  }

  // This retains the original equirectangular image's pixels. The temporary
  // GPU strips are not separate generated views or files.
  function createRenderer() {
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) throw Error('当前浏览器未开启 WebGL。仍可查看和下载完整原图。');
    const vertex = 'attribute vec2 p; varying vec2 v; void main(){v=p;gl_Position=vec4(p,0.,1.);}';
    const fragment = `precision highp float;
      varying vec2 v;
      uniform sampler2D panorama0,panorama1,panorama2,panorama3;
      uniform float stripWidth,stripCount,yaw,pitch,fov,aspect;
      void main(){
        float cp=cos(pitch),sp=sin(pitch),cy=cos(yaw),sy=sin(yaw);
        vec3 forward=vec3(sy*cp,sp,-cy*cp),right=vec3(cy,0.,sy),up=vec3(-sy*sp,cp,cy*sp);
        vec3 ray=normalize(forward+right*v.x*aspect*tan(fov/2.)+up*v.y*tan(fov/2.));
        vec2 uv=vec2(fract(.5+atan(ray.x,-ray.z)/6.28318530718),.5+asin(clamp(ray.y,-1.,1.))/3.14159265359);
        float part=floor(uv.x*stripCount);
        vec2 sampleUV=vec2((fract(uv.x*stripCount)*stripWidth+1.)/(stripWidth+2.),uv.y);
        if(part<.5)gl_FragColor=texture2D(panorama0,sampleUV);
        else if(part<1.5)gl_FragColor=texture2D(panorama1,sampleUV);
        else if(part<2.5)gl_FragColor=texture2D(panorama2,sampleUV);
        else gl_FragColor=texture2D(panorama3,sampleUV);
      }`;
    function shader(type, source) {
      const s = gl.createShader(type);
      gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error('全景着色器编译失败。');
      return s;
    }
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('全景渲染器初始化失败。');
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(['yaw','pitch','fov','aspect','stripWidth','stripCount'].map(n => [n, gl.getUniformLocation(program, n)]));
    const textures = Array.from({ length: 4 }, (_, i) => {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0]));
      gl.uniform1i(gl.getUniformLocation(program, 'panorama' + i), i);
      return texture;
    });
    function uploadNativePanorama(image, stylePreview) {
      const width = image.naturalWidth, height = image.naturalHeight;
      if (!height || width !== height * 2) throw Error('图片必须为完整2:1全景。');
      if (!stylePreview && (width < 3840 || width % 4)) throw Error('图片未达到完整2:1高清原图规格（至少3840像素宽）。');
      const stripCount = width % 4 ? 2 : 4;
      const stripWidth = width / stripCount, max = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if (max < height || max < stripWidth + 2) throw Error('当前设备纹理上限不足以按原始像素显示。请使用原图入口或更换设备。');
      const tile = document.createElement('canvas');
      tile.width = stripWidth + 2; tile.height = height;
      const context = tile.getContext('2d');
      if (!context) throw Error('浏览器无法准备全景纹理。');
      context.imageSmoothingEnabled = false;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      for (let i = 0; i < stripCount; i++) {
        context.drawImage(image, i * stripWidth, 0, stripWidth, height, 1, 0, stripWidth, height);
        context.drawImage(image, (i * stripWidth - 1 + width) % width, 0, 1, height, 0, 0, 1, height);
        context.drawImage(image, ((i + 1) * stripWidth) % width, 0, 1, height, stripWidth + 1, 0, 1, height);
        gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, tile);
      }
      if (gl.getError() !== gl.NO_ERROR) throw Error('GPU 无法载入原尺寸纹理。请使用原图入口。');
      gl.uniform1f(uniforms.stripWidth, stripWidth);
      gl.uniform1f(uniforms.stripCount, stripCount);
      canvas.dataset.sourcePixels = width + '×' + height;
      canvas.dataset.textureMode = stripCount + ' native-resolution strips, no resampling';
      canvas.dataset.maxTextureSize = String(max);
      tile.width = tile.height = 1;
    }
    function draw() {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const width = Math.round(innerWidth * ratio), height = Math.round(innerHeight * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width; canvas.height = height; gl.viewport(0, 0, width, height);
      }
      gl.uniform1f(uniforms.yaw, yaw); gl.uniform1f(uniforms.pitch, pitch);
      gl.uniform1f(uniforms.fov, fov * Math.PI / 180); gl.uniform1f(uniforms.aspect, width / height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    return { uploadNativePanorama, draw };
  }

  const filtered = () => nodes.filter(n => n.model === model && n.unit === unit);
  function revisedURL(source, revision) {
    if (!revision || /^(data:|blob:)/.test(source)) return source;
    return source + (source.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(revision);
  }
  function button(label, action) {
    const b = document.createElement('button'); b.textContent = label; b.onclick = action; return b;
  }
  function renderMenus() {
    $('floors').replaceChildren(...Object.entries(models).map(([id, m]) => {
      const available = nodes.filter(n => n.model === id);
      const b = button(`${m.label}（${available.length}/${m.total_count}）`, () => enter(available.find(n => n.id === m.start) || available[0]));
      b.disabled = !available.length; b.setAttribute('aria-pressed', String(id === model)); return b;
    }));
    $('units').replaceChildren(...Object.entries(models[model].units).map(([id, counts]) => {
      const available = nodes.filter(n => n.model === model && n.unit === id);
      const label = id === '自用' ? '全屋空间' : id === '公共' ? '公共走道' : id + ' 公寓';
      const b = button(`${label}（${available.length}/${counts.total}）`, () => enter(available[0]));
      b.disabled = !available.length; b.setAttribute('aria-pressed', String(id === unit)); return b;
    }));
    const list = filtered();
    $('counter').textContent = list.length ? `${Math.max(0, list.findIndex(n => n.id === current?.id) + 1)} / ${list.length} 个可浏览视点` : '0 个可浏览视点';
    $('rooms').replaceChildren(...list.map(n => {
      const b = button('', () => enter(n)); b.className = 'room'; b.setAttribute('aria-pressed', String(n.id === current?.id));
      if (n.thumbnail) { const image = document.createElement('img'); image.src = revisedURL(n.thumbnail,n.revision); image.alt = ''; image.loading = 'lazy'; b.append(image); }
      const label = document.createElement('span'); label.textContent = n.label; b.append(label); return b;
    }));
    $('previous').disabled = $('next').disabled = list.length < 2;
    for (const id of ['mapToggle','rotate','zoomIn','zoomOut']) $(id).disabled = !current || (id !== 'mapToggle' && canvas.dataset.loaded !== 'true');
  }
  function renderMap() {
    const ns = 'http://www.w3.org/2000/svg';
    const map = models[model].map;
    const planImage = map?.type === 'plan-image';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', planImage ? `0 0 ${map.width} ${map.height}` : '-0.5 -0.5 13.1 22.5');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-label', models[model].label + '视点导航');
    svg.dataset.mapType = planImage ? 'plan-image' : 'legacy-walls';
    const add = (tag, attrs) => { const e = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,v)); svg.append(e); return e; };
    if (planImage) {
      add('image', { x:0,y:0,width:map.width,height:map.height,href:revisedURL(map.image,map.revision),preserveAspectRatio:'xMidYMid meet' });
    } else {
      add('rect', { x:0,y:0,width:12.1,height:21.5,fill:'#e9e2d4' });
      for (const w of models[model].walls) add('line', { x1:w[0],y1:w[1],x2:w[2],y2:w[3],stroke:w[5] || '#6e6557','stroke-width':w[4] });
    }
    for (const n of nodes.filter(n => n.model === model)) {
      const selected = n.id === current?.id;
      const x = planImage ? n.map_point.u * map.width : n.x;
      const y = planImage ? n.map_point.v * map.height : n.y;
      const radius = planImage ? map.width * (selected ? .012 : .009) : selected ? .36 : .26;
      const point = add('circle', { cx:x,cy:y,r:radius,fill:selected ? '#aa6834' : '#3e746b',tabindex:0,role:'button','aria-label':n.label,'aria-pressed':String(selected),class:'point' });
      if (planImage) {
        point.setAttribute('stroke', 'transparent');
        point.setAttribute('stroke-width', map.width * .055);
        point.setAttribute('pointer-events', 'all');
      }
      point.dataset.scene = n.id;
      point.onclick = () => enter(n); point.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(n); } };
    }
    $('mapNote').textContent = planImage ? map.note : '只显示实际已接入的意式视点';
    $('map').replaceChildren(svg);
  }
  async function enter(node) {
    if (!node) return;
    const mine = ++token;
    auto = false; current = node; model = node.model; unit = node.unit;
    canvas.hidden = true; canvas.dataset.loaded = 'false'; delete canvas.dataset.sourcePixels; delete canvas.dataset.scene;
    $('empty').hidden = true; $('error').hidden = true; $('loading').hidden = false;
    $('loading').querySelector('span').textContent = '正在加载 ' + node.label + '…';
    $('roomName').textContent = models[model].label + ' / ' + node.label;
    $('previewNote').textContent = node.preview_note || '';
    $('previewNote').hidden = !node.preview_note;
    $('materialNote').textContent = node.material_note || '暖中性色、胡桃木、浅色石材质感与织物或皮革软包，具体搭配以当前房间原图为准。';
    $('helpPreviewNote').textContent = node.preview_note || '请以当前房间原图及实际像素为准。';
    $('qualityBadge').textContent = '正在读取完整原图…';
    $('rotate').setAttribute('aria-pressed', 'false');
    const imageURL = revisedURL(node.image,node.revision || node.sha256);
    for (const id of ['original','download']) { $(id).href = imageURL; $(id).hidden = false; }
    const map = models[model].map;
    $('planOriginal').hidden = map?.type !== 'plan-image';
    if (map?.type === 'plan-image') $('planOriginal').href = revisedURL(map.image,map.revision);
    $('download').download = `${node.id}_意式现代_${node.width}x${node.height}.png`;
    renderMenus(); renderMap();
    history.replaceState(null, '', '#' + node.id);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(Error('完整原图读取失败：' + node.image)); image.src = imageURL; });
      if (mine !== token) return;
      if (image.naturalWidth !== node.width || image.naturalHeight !== node.height) throw Error('原图实际尺寸与导入记录不一致，请重新核对文件。');
      const stylePreview = node.quality_tier === 'STYLE_PREVIEW' && node.approval_status === 'STYLE_PREVIEW_ACCEPTED';
      $('qualityBadge').textContent = `${stylePreview ? '内置模型风格预览' : '意式风格预览'} · ${image.naturalWidth} × ${image.naturalHeight}${image.naturalWidth < 3840 ? ' · 未达4K' : ''}`;
      if (!renderer) renderer = createRenderer();
      renderer.uploadNativePanorama(image, stylePreview);
      yaw = node.initial_yaw || 0; pitch = node.initial_pitch || 0; fov = 75;
      canvas.hidden = false; canvas.dataset.scene = node.id; canvas.dataset.loaded = 'true';
      $('loading').hidden = true; dirty = true; renderMenus();
    } catch (error) {
      if (mine === token) { showError(error.message + ' 可尝试重新选择房间或打开原图链接。'); renderMenus(); }
    }
  }
  function move(delta) { const list = filtered(); if (list.length) enter(list[(list.findIndex(n => n.id === current?.id) + delta + list.length) % list.length]); }
  function zoom(delta) { fov = Math.max(40, Math.min(100, fov + delta)); dirty = true; }
  $('previous').onclick = () => move(-1); $('next').onclick = () => move(1);
  $('zoomIn').onclick = () => zoom(-8); $('zoomOut').onclick = () => zoom(8);
  $('rotate').onclick = () => { auto = !auto; $('rotate').setAttribute('aria-pressed', String(auto)); };
  for (const [open,close,panel] of [['mapToggle','mapClose','mapPanel'],['helpToggle','helpClose','help']]) {
    $(open).onclick = () => { $(panel).hidden = !$(panel).hidden; }; $(close).onclick = () => { $(panel).hidden = true; };
  }
  $('trayToggle').onclick = () => $('trayToggle').setAttribute('aria-pressed', String(!document.body.classList.toggle('collapsed')));
  $('fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { showError('当前浏览器不支持页面全屏，请使用浏览器窗口的全屏功能。'); } };
  const pointers = new Map(); let pinch = 0;
  canvas.onpointerdown = e => { if (!current) return; canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x:e.clientX,y:e.clientY }); auto = false; $('rotate').setAttribute('aria-pressed','false'); if (pointers.size === 2) { const [a,b] = [...pointers.values()]; pinch = Math.hypot(a.x-b.x,a.y-b.y); } };
  canvas.onpointermove = e => {
    if (!pointers.has(e.pointerId)) return;
    const old = pointers.get(e.pointerId); pointers.set(e.pointerId, { x:e.clientX,y:e.clientY });
    if (pointers.size === 2) { const [a,b] = [...pointers.values()], distance = Math.hypot(a.x-b.x,a.y-b.y); if (pinch) zoom((pinch-distance)*.12); pinch = distance; }
    else { const speed = fov*Math.PI/180/canvas.clientHeight; yaw -= (e.clientX-old.x)*speed; pitch = Math.max(-1.5,Math.min(1.5,pitch+(e.clientY-old.y)*speed)); dirty = true; }
  };
  canvas.onpointerup = canvas.onpointercancel = e => { pointers.delete(e.pointerId); pinch = 0; };
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY*.035); }, { passive:false });
  canvas.onkeydown = e => {
    if (!current || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)) return;
    e.preventDefault(); auto = false; $('rotate').setAttribute('aria-pressed','false');
    if (e.key === 'ArrowLeft') yaw -= .1; if (e.key === 'ArrowRight') yaw += .1;
    if (e.key === 'ArrowUp') pitch = Math.min(1.5,pitch+.1); if (e.key === 'ArrowDown') pitch = Math.max(-1.5,pitch-.1);
    if (['+','='].includes(e.key)) zoom(-5); if (e.key === '-') zoom(5);
    if (e.key === 'Home') { yaw = current.initial_yaw || 0; pitch = current.initial_pitch || 0; fov = 75; } dirty = true;
  };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); renderer = null; canvas.hidden = true; canvas.dataset.loaded = 'false'; showError('显卡连接中断，请刷新页面；原图链接仍可使用。'); renderMenus(); });
  addEventListener('resize', () => { dirty = true; });
  addEventListener('keydown', e => { if (e.key === 'Escape') { $('help').hidden = true; $('mapPanel').hidden = true; } });
  function frame(time) {
    const dt = Math.min((time-last)/1000,.1); last = time;
    if (auto && !document.hidden) { yaw += dt*.08; dirty = true; }
    if (renderer && canvas.dataset.loaded === 'true' && dirty) {
      renderer.draw(); $('needle').style.transform = `rotate(${-yaw*180/Math.PI}deg)`;
      canvas.dataset.yaw = yaw.toFixed(3); canvas.dataset.pitch = pitch.toFixed(3); canvas.dataset.fov = String(fov); dirty = false;
    }
    requestAnimationFrame(frame);
  }
  $('renderProgress').textContent = `${nodes.length === 1 ? '首间意式方案 · ' : ''}已生成预览 ${nodes.length} / ${tour.progress.expected} 个视点`;
  renderMenus(); renderMap(); canvas.hidden = true;
  let requested = '';
  try { requested = decodeURIComponent(location.hash.slice(1)); } catch { /* A malformed bookmark falls back to the first approved room. */ }
  enter(nodes.find(n => n.id === requested) || nodes.find(n => n.id === tour.start) || nodes[0]);
  requestAnimationFrame(frame);
})();
