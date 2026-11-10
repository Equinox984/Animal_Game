(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const W = 1080, H = 740;
  const keys = new Set();
  let state = 'ready', time = 90, score = 0, energy = 100, last = 0, elapsed = 0;
  let player, ollie, shadow, paws, particles = [], soundOn = false, audio;
  const trees = [], plants = [];
  let seed = 243;
  function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  for (let i = 0; i < 67; i++) {
    const edge = i < 42;
    trees.push({ x: random() * W, y: edge ? (i % 2 ? random() * 100 : H - random() * 95) : random() * H, r: 24 + random() * 38, tone: random() });
  }
  for (let i = 0; i < 120; i++) plants.push({ x: random() * W, y: random() * H, size: 3 + random() * 9, angle: random() * 6.28 });
  function reset() {
    player = { x: 300, y: 420, face: 1, moving: false };
    shadow = { x: 225, y: 490, face: 1 };
    ollie = { x: 780, y: 260, face: -1, turn: 0 };
    paws = [{x:440,y:350},{x:590,y:200},{x:730,y:440},{x:480,y:560},{x:860,y:550},{x:220,y:230},{x:625,y:590},{x:870,y:180}].map(p => ({...p, collected:false}));
    time = 90; score = 0; energy = 100; elapsed = 0; particles = []; updateHUD();
  }
  function updateHUD() {
    const t = Math.ceil(time);
    $('timer').textContent = `${String(Math.floor(t / 60)).padStart(2,'0')}:${String(t % 60).padStart(2,'0')}`;
    $('timer').style.color = t <= 15 ? '#b45d3b' : '';
    $('score').innerHTML = `${String(score).padStart(3,'0')}<span> / 080</span>`;
    $('energy').style.width = `${energy}%`;
    $('energy-label').textContent = `${Math.round(energy)}%`;
  }
  function beep(frequency, duration = .1) {
    if (!soundOn) return;
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); const o = audio.createOscillator(), g = audio.createGain(); o.connect(g); g.connect(audio.destination); o.frequency.value = frequency; o.type = 'sine'; g.gain.setValueAtTime(.055, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration); o.start(); o.stop(audio.currentTime + duration); } catch (_) { /* Sound is optional. */ }
  }
  function showOverlay(eyebrow, title, description, button) {
    $('overlay-eyebrow').textContent = eyebrow; $('overlay-title').textContent = title;
    $('overlay-description').textContent = description; $('start').innerHTML = `${button} <span>↗</span>`;
    $('overlay').classList.remove('hidden');
  }
  function start() { if (state !== 'paused') reset(); state = 'playing'; $('overlay').classList.add('hidden'); $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label','Pause game'); canvas.focus({preventScroll:true}); }
  function pause() {
    if (state === 'playing') { state = 'paused'; keys.clear(); showOverlay('EVEN TIGERS NEED A BREATHER', 'A little paws.', 'The jungle can wait. Your adventure is right here.', 'Back to the wild'); $('pause').textContent = '▷'; $('pause').setAttribute('aria-label','Resume game'); }
    else if (state === 'paused') start();
  }
  function finish(won) {
    state = won ? 'won' : 'lost'; keys.clear();
    if (won) { burst(ollie.x, ollie.y, 45); beep(660,.4); }
    else beep(180,.3);
    showOverlay(won ? 'A WILD LITTLE VICTORY' : 'THAT CHEEKY LITTLE ESCAPE ARTIST', won ? 'You did it, Alessia!' : 'Ollie got away!', won ? `Tagged with love! ${score} paw points and ${Math.ceil(time)} seconds to spare. Shadow is very impressed.` : `You found ${score} paw points. Take another run through the grove?`, 'Chase again');
  }
  $('start').addEventListener('click', start);
  $('pause').addEventListener('click', pause);
  $('restart').addEventListener('click', () => { reset(); state = 'playing'; $('overlay').classList.add('hidden'); $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label','Pause game'); canvas.focus({preventScroll:true}); });
  $('sound').addEventListener('click', () => { soundOn = !soundOn; $('sound').innerHTML = `♫ <span>${soundOn ? 'ON' : 'OFF'}</span>`; $('sound').setAttribute('aria-label', soundOn ? 'Disable sound' : 'Enable sound'); beep(440); });
  const gameKeys = ['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','shift',' '];
  window.addEventListener('keydown', e => {
    if (!gameKeys.includes(e.key.toLowerCase()) || e.target.tagName === 'INPUT') return;
    if (e.key === ' ' && e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    if (e.key === ' ' && !e.repeat) { if (state === 'ready' || state === 'won' || state === 'lost') start(); else pause(); return; }
    keys.add(e.key.toLowerCase());
  });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => { keys.clear(); if (state === 'playing') pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); });
  document.querySelectorAll('[data-dir]').forEach(button => {
    const key = 'arrow' + button.dataset.dir;
    button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); keys.add(key); });
    for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event, () => keys.delete(key));
  });
  function burst(x, y, count = 12) { for (let i=0;i<count;i++) { const a=Math.random()*Math.PI*2, s=30+Math.random()*95; particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color:i%2?'#e8d98b':'#b6cf7f'}); } }
  function update(dt) {
    if (state !== 'playing') return;
    elapsed += dt; time = Math.max(0,time-dt);
    let dx = +(keys.has('arrowright') || keys.has('d')) - +(keys.has('arrowleft') || keys.has('a'));
    let dy = +(keys.has('arrowdown') || keys.has('s')) - +(keys.has('arrowup') || keys.has('w'));
    const moving = dx !== 0 || dy !== 0, sprint = keys.has('shift') && energy > 1 && moving;
    energy = Math.max(0,Math.min(100,energy+(sprint ? -32 : 19)*dt));
    if (moving) { const length = Math.hypot(dx,dy); dx/=length; dy/=length; const speed = sprint ? 285 : 175; player.x += dx*speed*dt; player.y += dy*speed*dt; if(dx) player.face = dx > 0 ? 1 : -1; }
    player.moving = moving;
    player.x = Math.max(78,Math.min(W-78,player.x)); player.y = Math.max(125,Math.min(H-85,player.y));
    const sx = player.x - player.face*76 - shadow.x, sy = player.y + 46 - shadow.y;
    shadow.x += sx * Math.min(1,dt*2.7); shadow.y += sy * Math.min(1,dt*2.7); if(Math.abs(sx)>3) shadow.face=sx>0?1:-1;
    const ox = ollie.x-player.x, oy = ollie.y-player.y, distance=Math.hypot(ox,oy);
    let vx,vy;
    if(distance<290) { vx=ox/Math.max(1,distance); vy=oy/Math.max(1,distance); }
    else { vx=Math.cos(elapsed*.7)*.7; vy=Math.sin(elapsed*.9)*.65; }
    if(ollie.x<150) vx+=1.8; if(ollie.x>W-150) vx-=1.8; if(ollie.y<170) vy+=1.8; if(ollie.y>H-140) vy-=1.8;
    const ol=Math.hypot(vx,vy)||1; ollie.x+=vx/ol*112*dt; ollie.y+=vy/ol*112*dt;
    ollie.x=Math.max(90,Math.min(W-90,ollie.x)); ollie.y=Math.max(135,Math.min(H-90,ollie.y)); if(Math.abs(vx)>.2) ollie.face=vx>0?1:-1;
    for(const paw of paws) if(!paw.collected && Math.hypot(paw.x-player.x,paw.y-player.y)<36) { paw.collected=true; score+=10; burst(paw.x,paw.y); beep(540+score*5); }
    for(const p of particles) { p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; } particles=particles.filter(p=>p.life>0);
    updateHUD();
    if(distance<43) finish(true); else if(time<=0) finish(false);
  }
  function ellipse(x,y,rx,ry,color,rotation=0) { ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2); ctx.fill(); }
  function path(points,color,width=1) { ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round';ctx.lineJoin='round'; ctx.beginPath(); points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p)); ctx.stroke(); }
  function leaf(x,y,size,angle,color) { ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-size,-size,size*.1,-size*2.7);ctx.quadraticCurveTo(size,size*-1.6,0,0);ctx.fill();ctx.restore(); }
  function background(t) {
    ctx.fillStyle='#214c3a';ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(590,340,20,590,340,650);glow.addColorStop(0,'#55744a');glow.addColorStop(.55,'#3b6344');glow.addColorStop(1,'#173e32');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    // A winding, sun-dappled trail through the grove.
    ctx.strokeStyle='#73815a35';ctx.lineWidth=115;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-30,560);ctx.bezierCurveTo(250,540,200,265,505,340);ctx.bezierCurveTo(780,420,710,100,1120,210);ctx.stroke();
    ctx.strokeStyle='#a6a16b13';ctx.lineWidth=74;ctx.stroke();
    // A quiet blue-green watering hole.
    ellipse(906,407,126,77,'#173f37',-.3);ellipse(905,401,112,64,'#356d61',-.3);ellipse(902,399,92,49,'#417c6b',-.3);
    for(let i=0;i<4;i++){ctx.strokeStyle='#8fba9828';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(907+i*8,396+i*8,35+i*9,7+i*3,-.3,0,Math.PI);ctx.stroke();}ellipse(938,377,13,5,'#759362',-.3);leaf(938,377,6,.9,'#9aa762');
    for(const p of plants) { const a=p.angle+Math.sin(t*.7+p.x)*.08;leaf(p.x,p.y,p.size,a,'#73935b44');leaf(p.x,p.y,p.size*.7,a+.7,'#8b9e6040'); }
    for(let i=0;i<36;i++){const x=(i*173+72)%W,y=(i*137+170)%H;ellipse(x,y,1.3,1.3,i%3?'#c1bc7040':'#c6cb8960');}
    // Soft shafts of light.
    ctx.fillStyle='#e2e7ab04';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(500+i*140,0);ctx.lineTo(555+i*140,0);ctx.lineTo(300+i*140,H);ctx.lineTo(190+i*140,H);ctx.fill();}
  }
  function tree(tree,t) {
    const {x,y,r,tone}=tree;
    ellipse(x+6,y+13,r*1.07,r*.7,'#102f2845');
    const colors = tone>.5 ? ['#214b36','#2e593b','#3a6541'] : ['#193e30','#254e34','#315d3d'];
    const sway=Math.sin(t*.5+x)*1.5;
    for(let i=0;i<5;i++){const a=i*1.256;ellipse(x+Math.cos(a)*r*.47+sway,y+Math.sin(a)*r*.3,r*.65,r*.51,colors[i%3],a*.2);}
    ellipse(x-7+sway,y-10,r*.48,r*.33,colors[2]);
    for(let i=0;i<3;i++) leaf(x+(i-1)*r*.3,y-r*.05,r*.29,-.7+i*.6,'#58804a3b');
  }
  function pawIcon(x,y,scale,color) {
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ellipse(0,3,8,6,color,-.2);ellipse(-9,-5,3.2,4,color,-.4);ellipse(-3,-10,3.2,4,color,-.15);ellipse(4,-10,3.2,4,color,.15);ellipse(10,-4,3.2,4,color,.4);ctx.restore();
  }
  function label(text,x,y,color='#f1edce',filled=false) {
    ctx.font='600 10px "DM Sans", sans-serif';const width=ctx.measureText(text).width+20;
    ctx.fillStyle=filled?'#e9edb2':'#163c2de6';ctx.beginPath();ctx.roundRect(x-width/2,y-11,width,23,5);ctx.fill();ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(text,x,y+4);
  }
  function cat(cat,isTiger,t) {
    const {x,y,face}=cat;const moving=isTiger?player.moving:state==='playing';const bounce=moving?Math.sin(t*15)*2:Math.sin(t*2)*.7;
    ellipse(x,y+23,35,11,'#102e2750');
    if(isTiger) { ctx.strokeStyle='#d7e68e50';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+19,42,19,0,0,Math.PI*2);ctx.stroke(); }
    ctx.save();ctx.translate(x,y+bounce);ctx.scale(face,1);
    const fur=isTiger?'#e9a34f':'#34443f', dark=isTiger?'#67462b':'#202e2b';
    path([[-22,2],[-39,-4],[-47,-20],[-42,-29]],fur,9);if(isTiger)path([[-46,-19],[-44,-25]],dark,6);
    for(let i=0;i<4;i++){const lx=i<2?-16:14, ly=i%2?14:6, step=moving?Math.sin(t*15+i*2)*4:0;ellipse(lx+step,ly+9,6,11,fur);ellipse(lx+step+2,ly+17,7,4,isTiger?'#f0d69b':'#40534a');}
    ellipse(-2,0,29,18,fur);ellipse(2,8,22,10,isTiger?'#f0bc6e':'#3c4e45');
    if(isTiger)for(let i=0;i<4;i++)path([[-20+i*10,-13],[-16+i*10,-4],[-19+i*10,1]],dark,3.5);
    ellipse(23,-16,8,9,dark);ellipse(40,-14,7,9,dark);ellipse(23,-16,4,5,isTiger?'#dfa177':'#61715c');ellipse(40,-14,3,5,isTiger?'#dfa177':'#61715c');
    ellipse(31,-3,21,21,fur);ellipse(38,6,14,10,isTiger?'#f5e0b1':'#576953');ellipse(25,7,8,7,isTiger?'#f5e0b1':'#576953');
    if(isTiger){path([[19,-13],[25,-7]],dark,3);path([[43,-13],[39,-8]],dark,3);path([[29,-21],[31,-13]],dark,3);path([[15,-3],[22,0]],dark,2.5);}
    ellipse(28,-4,2.5,3,'#25382b');ellipse(42,-3,2.5,3,'#25382b');ellipse(29,-5,1,1,'#fff4ce');ellipse(43,-4,1,1,'#fff4ce');ellipse(38,4,3,2.5,'#493d31');path([[38,6],[36,9],[33,9]],'#71563c',1);
    if(!isTiger){ellipse(28,-4,1.5,2,'#c9d58d');ellipse(42,-3,1.5,2,'#c9d58d');}
    ctx.restore();
    label(isTiger?'ALESSIA · YOU':'SHADOW',x,y-49,isTiger?'#30462d':'#e2e6c4',isTiger);
  }
  function orangutan(t) {
    const {x,y,face}=ollie;const b=state==='playing'?Math.sin(t*11)*3:Math.sin(t*2)*2;
    ellipse(x,y+26,30,10,'#102e2750');ctx.save();ctx.translate(x,y+b);ctx.scale(face,1);
    path([[-11,-3],[-27,8],[-32,25]],'#b16c3c',12);path([[12,-3],[26,9],[31,24]],'#bd7843',12);
    ellipse(-32,25,7,5,'#d29c68');ellipse(31,24,7,5,'#d29c68');ellipse(-9,21,7,9,'#8c5434');ellipse(10,21,7,9,'#8c5434');ellipse(0,4,20,26,'#b76d38');ellipse(0,8,13,19,'#cb854a');
    ellipse(-18,-17,7,8,'#b27140');ellipse(18,-17,7,8,'#b27140');ellipse(0,-18,21,21,'#c27c40');ellipse(0,-14,16,15,'#e4b27e');ellipse(-7,-21,7,7,'#e4b27e');ellipse(7,-21,7,7,'#e4b27e');
    ellipse(-7,-20,2.4,3,'#333c2b');ellipse(7,-20,2.4,3,'#333c2b');ellipse(-6,-21,1,1,'#fff2d6');ellipse(8,-21,1,1,'#fff2d6');ellipse(0,-10,5,3,'#b97f52');path([[-5,-5],[0,-2],[6,-5]],'#955e3e',1.5);
    path([[-5,-37],[1,-41],[6,-36]],'#b16c3c',4);ctx.restore();label('OLLIE · CATCH ME!',x,y-56);
  }
  function render(timestamp) {
    const dt=Math.min((timestamp-last)/1000 || 0,.04);last=timestamp;update(dt);const t=timestamp/1000;
    ctx.clearRect(0,0,W,H);background(t);
    for(const tr of trees) if(tr.y<130)tree(tr,t);
    for(const paw of paws) if(!paw.collected) { const pulse=1+Math.sin(t*2+paw.x)*.09;ellipse(paw.x,paw.y,20*pulse,20*pulse,'#dce59210');ellipse(paw.x,paw.y,15,15,'#dce59216');pawIcon(paw.x,paw.y,.75,'#dce7a3'); }
    // Keep characters legible while foliage frames the playfield.
    const actors=[{y:player.y,draw:()=>cat(player,true,t)},{y:shadow.y,draw:()=>cat(shadow,false,t)},{y:ollie.y,draw:()=>orangutan(t)}];actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());
    for(const tr of trees) if(tr.y>=130 && (tr.y>H-85 || tr.x<70 || tr.x>W-70))tree(tr,t);
    for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ellipse(p.x,p.y,3,3,p.color);}ctx.globalAlpha=1;
    // Fireflies drift through the forest canopy.
    for(let i=0;i<13;i++){const x=(i*177+Math.sin(t*.3+i)*23+W)%W,y=(i*139+Math.cos(t*.4+i)*19+H)%H;const alpha=.15+Math.max(0,Math.sin(t+i))* .4;ctx.globalAlpha=alpha;ellipse(x,y,2,2,'#edf4b8');}ctx.globalAlpha=1;
    const vignette=ctx.createRadialGradient(W/2,H/2,240,W/2,H/2,650);vignette.addColorStop(0,'#0a281f00');vignette.addColorStop(1,'#0a281f66');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
    requestAnimationFrame(render);
  }
  reset();requestAnimationFrame(render);
})();
