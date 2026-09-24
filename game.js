(() => {
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const TAU = Math.PI * 2;
const G = 120;

const ui = {
  menu: document.getElementById('menu'), start: document.getElementById('startBtn'), difficulty: document.getElementById('difficultyRow'),
  angle: document.getElementById('angleReadout'), power: document.getElementById('powerReadout'), slider: document.getElementById('powerSlider'),
  weaponName: document.getElementById('weaponName'), weaponDesc: document.getElementById('weaponDesc'), weaponIcon: document.getElementById('weaponIcon'), ammo: document.getElementById('ammoLabel'),
  fire: document.getElementById('fireBtn'), prev: document.getElementById('prevWeapon'), next: document.getElementById('nextWeapon'), mobileWeapon: document.getElementById('mobileWeapon'), mobileFire: document.getElementById('mobileFire'),
  p1Hp: document.getElementById('p1Hp'), p2Hp: document.getElementById('p2Hp'), p1HpText: document.getElementById('p1HpText'), p2HpText: document.getElementById('p2HpText'),
  p2Name: document.getElementById('p2Name'), turn: document.getElementById('turnLabel'), wind: document.getElementById('windLabel'),
  toast: document.getElementById('toast'), banner: document.getElementById('banner'), restart: document.getElementById('restartBtn'), sound: document.getElementById('soundBtn')
};

const weapons = [
  {name:'Pulse Shell', icon:'●', desc:'Reliable impact round', damage:34, radius:42, crater:35, ammo:Infinity, color:'#fff3b0'},
  {name:'Titan Core', icon:'⬢', desc:'Heavy blast, heavy terrain damage', damage:49, radius:61, crater:54, ammo:3, color:'#ff9c74'},
  {name:'Cluster Bloom', icon:'✣', desc:'Five bomblets scatter after impact', damage:18, radius:26, crater:20, ammo:3, color:'#f7c6ff', cluster:true},
  {name:'Fault Line', icon:'◆', desc:'Deep crater with a wide shockwave', damage:27, radius:80, crater:78, ammo:2, color:'#ffd166'},
  {name:'Ricochet', icon:'◉', desc:'Bounces once before detonating', damage:42, radius:46, crater:35, ammo:3, color:'#7cf29a', bounce:true},
  {name:'Prism Lance', icon:'⌁', desc:'Instant energy beam, no gravity', damage:38, radius:19, crater:12, ammo:2, color:'#5ee7ff', laser:true},
  {name:'Ember Rain', icon:'✦', desc:'Impact calls a vertical fire barrage', damage:13, radius:24, crater:12, ammo:2, color:'#ff7c67', rain:true},
  {name:'Nova Seed', icon:'✹', desc:'Huge blast. Everyone should duck.', damage:62, radius:92, crater:75, ammo:1, color:'#fff0a0'}
];

let state = {};
let audioEnabled = true;
let audioCtx = null;
let last = performance.now();

function resetState() {
  state = {
    mode: 'ai', diff: 'tactician', started:false, over:false, turn:0, locked:false,
    wind: 0, terrain: new Float32Array(W), stars: [], clouds: [], particles: [], shockwaves: [], floaters: [], projectiles: [],
    aimDots: [], shake:0, flash:0, time:0, messageTimer:0,
    tanks: [
      {x:145,y:0,angle:45,power:68,hp:150,maxHp:150,weapon:0,color:'#5ee7ff',dark:'#197b98',name:'PLAYER 1',ammo:[]},
      {x:1135,y:0,angle:135,power:68,hp:150,maxHp:150,weapon:0,color:'#ff6b74',dark:'#9e3040',name:'CPU',ammo:[]}
    ]
  };
  state.tanks.forEach(t => t.ammo = weapons.map(w => w.ammo));
  for(let i=0;i<130;i++) state.stars.push({x:Math.random()*W,y:Math.random()*H*.48,s:Math.random()*1.7+.2,a:Math.random()*.7+.15});
  for(let i=0;i<8;i++) state.clouds.push({x:Math.random()*W,y:70+Math.random()*170,w:130+Math.random()*160,v:3+Math.random()*6,a:.04+Math.random()*.05});
  generateTerrain();
  settleTanks();
  randomWind();
  updateUI();
}

function generateTerrain(){
  const seedA = Math.random()*10, seedB=Math.random()*10;
  for(let x=0;x<W;x++){
    const n = Math.sin(x*.0054+seedA)*46 + Math.sin(x*.011+seedB)*22 + Math.sin(x*.0022+1.7)*38;
    const bowl = Math.sin((x/W)*Math.PI)*18;
    state.terrain[x] = 500 + n - bowl;
  }
  // flatten spawn pads softly
  flattenAt(145,115); flattenAt(1135,115);
}
function flattenAt(cx,width){
  const base = state.terrain[Math.round(cx)];
  for(let x=Math.max(0,cx-width);x<Math.min(W,cx+width);x++){
    const d=Math.abs(x-cx)/width, k=Math.pow(1-d,2);
    state.terrain[x]=lerp(state.terrain[x],base,k*.9);
  }
}
function terrainY(x){ return state.terrain[Math.max(0,Math.min(W-1,Math.round(x)))]; }
function terrainSlope(x){ return Math.atan2(terrainY(x+8)-terrainY(x-8),16); }
function settleTanks(){
  state.tanks.forEach(t=>{ t.y=terrainY(t.x)-17; });
}
function randomWind(){ state.wind = (Math.random()*2-1)*30; updateUI(); }

function beginGame(){
  state.started=true; state.over=false; state.locked=false; state.turn=Math.random()<.5?0:1;
  ui.menu.classList.add('hidden');
  state.tanks[1].name = state.mode==='ai'?'CPU':'PLAYER 2'; ui.p2Name.textContent=state.tanks[1].name;
  toast(`${state.tanks[state.turn].name} has first shot`);
  updateUI();
  if(state.mode==='ai' && state.turn===1) setTimeout(aiTurn,700);
}

function restart(){
  const mode=state.mode, diff=state.diff;
  resetState(); state.mode=mode; state.diff=diff; beginGame();
}

function active(){ return state.tanks[state.turn]; }
function opponent(){ return state.tanks[1-state.turn]; }

function updateUI(){
  const t=active();
  ui.angle.textContent=`${Math.round(t.angle)}°`; ui.power.textContent=Math.round(t.power); ui.slider.value=t.power;
  const w=weapons[t.weapon]; ui.weaponName.textContent=w.name; ui.weaponDesc.textContent=w.desc; ui.weaponIcon.textContent=w.icon;
  const a=t.ammo?.[t.weapon]; ui.ammo.textContent=a===Infinity?'∞':`×${a}`;
  ui.p1Hp.style.width=`${Math.max(0,state.tanks[0].hp/state.tanks[0].maxHp*100)}%`;
  ui.p2Hp.style.width=`${Math.max(0,state.tanks[1].hp/state.tanks[1].maxHp*100)}%`;
  ui.p1HpText.textContent=Math.max(0,Math.ceil(state.tanks[0].hp)); ui.p2HpText.textContent=Math.max(0,Math.ceil(state.tanks[1].hp));
  ui.turn.textContent = state.over?'MATCH COMPLETE':`${t.name} TURN`;
  const arrow=state.wind>2?'→':state.wind<-2?'←':'·'; ui.wind.textContent=`WIND ${arrow} ${Math.abs(state.wind/10).toFixed(1)}`;
  const human = !(state.mode==='ai'&&state.turn===1); ui.fire.disabled=state.locked||state.over||!human;
}

function canHumanControl(){ return state.started&&!state.over&&!state.locked&&!(state.mode==='ai'&&state.turn===1); }
function adjustAngle(d){ if(!canHumanControl())return; const t=active(); t.angle=clamp(t.angle+d,8,172); updateUI(); }
function adjustPower(d){ if(!canHumanControl())return; const t=active(); t.power=clamp(t.power+d,20,100); updateUI(); }
function cycleWeapon(dir=1){
  if(!canHumanControl())return; const t=active();
  for(let i=0;i<weapons.length;i++){ t.weapon=(t.weapon+dir+weapons.length)%weapons.length; if(t.ammo[t.weapon]>0)break; }
  updateUI();
}

function fire(){
  if(!canHumanControl())return;
  shootCurrent();
}
function shootCurrent(){
  const t=active(), w=weapons[t.weapon];
  if(t.ammo[t.weapon]!==Infinity) t.ammo[t.weapon]--;
  state.locked=true; updateUI();
  beep(120,.05,'square',.025);
  if(w.laser) fireLaser(t,w); else spawnProjectile(t,w);
}

function cannonTip(t){
  const a=-t.angle*Math.PI/180;
  return {x:t.x+Math.cos(a)*35,y:t.y+Math.sin(a)*35};
}
function spawnProjectile(t,w, opts={}){
  const p=cannonTip(t), a=-t.angle*Math.PI/180;
  const speed=t.power*4.35;
  state.projectiles.push({x:p.x,y:p.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,weapon:t.weapon,owner:state.turn,life:0,bounces:0,child:!!opts.child,scale:opts.scale||1});
}

function fireLaser(t,w){
  const p=cannonTip(t), a=-t.angle*Math.PI/180, dx=Math.cos(a),dy=Math.sin(a);
  let x=p.x,y=p.y,hit=null;
  for(let i=0;i<1500;i+=4){
    x=p.x+dx*i; y=p.y+dy*i;
    if(x<0||x>=W||y<0||y>=H)break;
    const enemy=opponent();
    if(Math.hypot(x-enemy.x,y-enemy.y)<25){hit={x,y};break;}
    if(y>=terrainY(x)){hit={x,y:terrainY(x)};break;}
  }
  state.flash=.18; state.shockwaves.push({type:'beam',x1:p.x,y1:p.y,x2:x,y2:y,color:w.color,life:.28,max:.28});
  if(hit) explode(hit.x,hit.y,w,state.turn,.92);
  else setTimeout(endTurn,350);
}

function explode(x,y,w,owner,scale=1,autoEnd=true){
  state.shake=Math.min(18,state.shake+w.radius*.1); state.flash=Math.min(.45,state.flash+w.radius*.0025);
  beep(55,.18,'sawtooth',.08);
  deformTerrain(x,y,w.crater*scale);
  state.shockwaves.push({type:'ring',x,y,r:0,maxR:w.radius*1.35,life:.55,max:.55,color:w.color});
  const count=Math.round(22+w.radius*.35);
  for(let i=0;i<count;i++){
    const a=Math.random()*TAU,s=(40+Math.random()*260)*(w.radius/50);
    state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,life:.35+Math.random()*.8,max:1.1,size:1+Math.random()*4,color:Math.random()<.5?w.color:'#ffffff',grav:210});
  }
  state.tanks.forEach((t,idx)=>{
    const d=Math.hypot(t.x-x,t.y-y); if(d<w.radius){
      const factor=1-d/w.radius; const dmg=Math.max(2,w.damage*(.25+.75*factor))*scale;
      t.hp-=dmg; floatText(t.x,t.y-35,`-${Math.round(dmg)}`, idx===0?'#85edff':'#ff8790');
      const push=(t.x-x>=0?1:-1)*factor*w.radius*.12; t.x=clamp(t.x+push,35,W-35);
    }
  });
  settleTanks();

  if(w.cluster) {
    setTimeout(()=>clusterBurst(x,y,owner),120);
    return;
  }
  if(w.rain){
    setTimeout(()=>emberRain(x,owner),160);
    return;
  }
  if(autoEnd) setTimeout(checkAfterExplosion,650);
}

function clusterBurst(x,y,owner){
  const base=weapons[2];
  for(let i=0;i<5;i++){
    setTimeout(()=>{
      const ox=(i-2)*26+(Math.random()*18-9), tx=clamp(x+ox,8,W-8), ty=terrainY(tx);
      explode(tx,ty,{...base,cluster:false,damage:base.damage*.72,radius:base.radius*.86,crater:base.crater*.75},owner,.9,false);
    },i*90);
  }
  setTimeout(checkAfterExplosion,900);
}
function emberRain(x,owner){
  const w=weapons[6];
  for(let i=0;i<7;i++){
    setTimeout(()=>{
      const tx=clamp(x+(i-3)*34+(Math.random()*24-12),8,W-8), ty=terrainY(tx);
      state.shockwaves.push({type:'beam',x1:tx-30,y1:0,x2:tx,y2:ty,color:'#ff8b61',life:.16,max:.16});
      explode(tx,ty,{...w,rain:false,damage:w.damage*.72,radius:w.radius*.8,crater:w.crater*.5},owner,.8,false);
    },i*75);
  }
  setTimeout(checkAfterExplosion,1000);
}

function checkAfterExplosion(){
  if(state.tanks.some(t=>t.hp<=0)){ finishMatch(); return; }
  endTurn();
}
function endTurn(){
  if(state.over)return;
  state.turn=1-state.turn; state.locked=false; randomWind(); updateUI();
  if(state.mode==='local') toast(`${active().name}: line up your shot`);
  if(state.mode==='ai'&&state.turn===1){ state.locked=true; updateUI(); setTimeout(aiTurn,650); }
}
function finishMatch(){
  state.over=true; state.locked=true; const winner=state.tanks[0].hp>0?state.tanks[0]:state.tanks[1];
  ui.banner.classList.remove('hidden'); ui.banner.innerHTML=`<div><small style="display:block;font-size:14px;color:#8fa1bd;letter-spacing:.25em">VICTORY</small>${winner.name}<br><button id="againBtn" class="primary-btn" style="width:180px;margin-top:20px">REMATCH</button></div>`;
  setTimeout(()=>document.getElementById('againBtn')?.addEventListener('click',()=>{ui.banner.classList.add('hidden');restart();}),20);
  updateUI();
}

function deformTerrain(cx,cy,r){
  const min=Math.max(0,Math.floor(cx-r)),max=Math.min(W-1,Math.ceil(cx+r));
  for(let x=min;x<=max;x++){
    const dx=x-cx;if(Math.abs(dx)>r)continue;
    const lower=cy+Math.sqrt(Math.max(0,r*r-dx*dx))*.62;
    if(lower>state.terrain[x])state.terrain[x]=Math.min(H-8,lower);
  }
}

function aiTurn(){
  if(state.over||state.mode!=='ai'||state.turn!==1)return;
  const me=active(), target=opponent();
  const difficulty=state.diff;
  const samples=difficulty==='rookie'?900:difficulty==='oracle'?3300:1900;
  let best={score:Infinity,angle:135,power:65};
  const wIndex=chooseAIWeapon(me,target); me.weapon=wIndex;
  const w=weapons[wIndex];
  if(w.laser){
    const angle=Math.atan2(me.y-target.y,target.x-me.x)*-180/Math.PI;
    me.angle=clamp(angle+(difficulty==='rookie'?rand(-5,5):rand(-1.2,1.2)),95,172); me.power=70; updateUI();
    setTimeout(shootCurrent,450); return;
  }
  for(let i=0;i<samples;i++){
    const angle=rand(98,166), power=rand(28,100);
    const score=simulateShot(me,target,angle,power,w);
    if(score<best.score)best={score,angle,power};
  }
  let errA=difficulty==='rookie'?rand(-5.5,5.5):difficulty==='tactician'?rand(-1.8,1.8):rand(-.45,.45);
  let errP=difficulty==='rookie'?rand(-7,7):difficulty==='tactician'?rand(-2.6,2.6):rand(-.7,.7);
  me.angle=clamp(best.angle+errA,8,172); me.power=clamp(best.power+errP,20,100); updateUI();
  toast(`CPU calculating arc… ${weapons[me.weapon].name}`);
  setTimeout(()=>{state.locked=false; shootCurrent();},520);
}
function chooseAIWeapon(me,target){
  const dist=Math.abs(me.x-target.x), options=[];
  me.ammo.forEach((a,i)=>{if(a>0)options.push(i)});
  if(target.hp<48 && me.ammo[7]>0 && Math.random()<.6)return 7;
  if(dist<420 && me.ammo[3]>0 && Math.random()<.45)return 3;
  if(me.ammo[2]>0 && Math.random()<.32)return 2;
  if(me.ammo[4]>0 && Math.random()<.25)return 4;
  if(me.ammo[5]>0 && Math.random()<.16)return 5;
  return options[Math.floor(Math.random()*Math.min(3,options.length))] ?? 0;
}
function simulateShot(me,target,angle,power,w){
  const a=-angle*Math.PI/180,p=cannonTip({...me,angle}); let x=p.x,y=p.y,vx=Math.cos(a)*power*4.35,vy=Math.sin(a)*power*4.35;
  let bounced=0, min=9999;
  for(let k=0;k<600;k++){
    const dt=.025; vx+=state.wind*.09*dt; vy+=G*dt; x+=vx*dt;y+=vy*dt;
    min=Math.min(min,Math.hypot(x-target.x,y-target.y));
    if(x<0||x>=W||y>H+50)return min+160;
    if(y>=terrainY(x)){
      if(w.bounce&&bounced<1){ y=terrainY(x)-2;vy=-Math.abs(vy)*.62;vx*=.83;bounced++;continue; }
      return Math.hypot(x-target.x,y-target.y);
    }
  }
  return min+50;
}

function update(dt){
  state.time+=dt; state.shake=Math.max(0,state.shake-dt*25); state.flash=Math.max(0,state.flash-dt*1.8);
  state.clouds.forEach(c=>{c.x+=c.v*dt;if(c.x-c.w>W)c.x=-c.w});
  state.floaters.forEach(f=>{f.y-=28*dt;f.life-=dt}); state.floaters=state.floaters.filter(f=>f.life>0);
  state.particles.forEach(p=>{p.vy+=p.grav*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.992;p.life-=dt}); state.particles=state.particles.filter(p=>p.life>0);
  state.shockwaves.forEach(s=>{s.life-=dt;if(s.type==='ring')s.r=lerp(s.r,s.maxR,dt*7)}); state.shockwaves=state.shockwaves.filter(s=>s.life>0);

  const survivors=[];
  for(const p of state.projectiles){
    p.life+=dt; p.vx+=state.wind*.09*dt; p.vy+=G*dt; p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(Math.random()<.65)state.particles.push({x:p.x,y:p.y,vx:-p.vx*.04+rand(-8,8),vy:-p.vy*.04+rand(-8,8),life:.18,max:.18,size:1.4,color:weapons[p.weapon].color,grav:0});
    let hit=false;
    state.tanks.forEach((t,idx)=>{if(!hit&&idx!==p.owner&&Math.hypot(p.x-t.x,p.y-t.y)<22)hit=true});
    if(p.x<0||p.x>=W||p.y>H+80){setTimeout(endTurn,150);continue;}
    if(p.y>=terrainY(p.x)||hit){
      const w=weapons[p.weapon];
      if(w.bounce&&p.bounces<1&&!hit){p.y=terrainY(p.x)-3;p.vy=-Math.abs(p.vy)*.64;p.vx*=.84;p.bounces++;beep(180,.035,'square',.02);survivors.push(p);continue;}
      explode(p.x,Math.min(p.y,terrainY(p.x)),w,p.owner,p.scale); continue;
    }
    survivors.push(p);
  }
  state.projectiles=survivors;
}

function draw(){
  const sx=state.shake?rand(-state.shake,state.shake):0, sy=state.shake?rand(-state.shake*.5,state.shake*.5):0;
  ctx.save();ctx.translate(sx,sy);
  drawSky(); drawMountains(); drawTerrain(); drawAimGuide(); drawTanks(); drawEffects();
  ctx.restore();
  if(state.flash>0){ctx.fillStyle=`rgba(255,245,220,${state.flash})`;ctx.fillRect(0,0,W,H)}
}
function drawSky(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#081126');g.addColorStop(.55,'#1b3154');g.addColorStop(1,'#684555');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalCompositeOperation='screen';
  for(const s of state.stars){ctx.globalAlpha=s.a*(.75+.25*Math.sin(state.time*1.7+s.x));ctx.fillStyle='#dff6ff';ctx.fillRect(s.x,s.y,s.s,s.s)}ctx.restore();
  const moonG=ctx.createRadialGradient(980,125,5,980,125,75);moonG.addColorStop(0,'#fff7d8');moonG.addColorStop(.25,'#d7eaff');moonG.addColorStop(1,'#b9d8ff00');ctx.fillStyle=moonG;ctx.beginPath();ctx.arc(980,125,75,0,TAU);ctx.fill();ctx.fillStyle='#ecf4ff';ctx.beginPath();ctx.arc(980,125,25,0,TAU);ctx.fill();
  state.clouds.forEach(c=>{ctx.globalAlpha=c.a;ctx.fillStyle='#d6e3ff';ctx.beginPath();ctx.ellipse(c.x,c.y,c.w,.22*c.w,0,0,TAU);ctx.fill()});ctx.globalAlpha=1;
}
function drawMountains(){
  ctx.fillStyle='#17243c';ctx.beginPath();ctx.moveTo(0,420);for(let x=0;x<=W;x+=80)ctx.lineTo(x,330+Math.sin(x*.012)*45+Math.sin(x*.004)*55);ctx.lineTo(W,540);ctx.lineTo(0,540);ctx.fill();
  ctx.fillStyle='#22334c';ctx.beginPath();ctx.moveTo(0,470);for(let x=0;x<=W;x+=55)ctx.lineTo(x,395+Math.sin(x*.01+2)*35+Math.sin(x*.017)*20);ctx.lineTo(W,560);ctx.lineTo(0,560);ctx.fill();
}
function drawTerrain(){
  const g=ctx.createLinearGradient(0,410,0,H);g.addColorStop(0,'#344c50');g.addColorStop(.08,'#253c3e');g.addColorStop(1,'#101b25');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,state.terrain[0]);for(let x=1;x<W;x+=2)ctx.lineTo(x,state.terrain[x]);ctx.lineTo(W,H);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#6a8b75';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,state.terrain[0]-1);for(let x=2;x<W;x+=3)ctx.lineTo(x,state.terrain[x]-1);ctx.stroke();
  ctx.globalAlpha=.12;ctx.strokeStyle='#b6d5bf';ctx.lineWidth=1;for(let y=560;y<H;y+=26){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y+20);ctx.stroke()}ctx.globalAlpha=1;
}
function drawAimGuide(){
  if(!state.started||state.over||state.locked)return; if(state.mode==='ai'&&state.turn===1)return;
  const t=active(),w=weapons[t.weapon],p=cannonTip(t),a=-t.angle*Math.PI/180;
  if(w.laser){ctx.save();ctx.setLineDash([5,12]);ctx.strokeStyle='#8ef2ff88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(a)*150,p.y+Math.sin(a)*150);ctx.stroke();ctx.restore();return;}
  let x=p.x,y=p.y,vx=Math.cos(a)*t.power*4.35,vy=Math.sin(a)*t.power*4.35;
  ctx.fillStyle='#d7f8ff88';
  for(let i=0;i<11;i++){
    const dt=.08;for(let s=0;s<3;s++){vx+=state.wind*.09*dt;vy+=G*dt;x+=vx*dt;y+=vy*dt;}
    if(x<0||x>W||y>H||y>=terrainY(x))break;ctx.beginPath();ctx.arc(x,y,2.2,0,TAU);ctx.fill();
  }
}
function drawTanks(){state.tanks.forEach((t,i)=>drawTank(t,i===state.turn&&state.started&&!state.over));}
function drawTank(t,activeGlow){
  const slope=clamp(terrainSlope(t.x),-.35,.35);ctx.save();ctx.translate(t.x,t.y);ctx.rotate(slope);
  if(activeGlow){ctx.shadowColor=t.color;ctx.shadowBlur=22}else ctx.shadowBlur=0;
  ctx.fillStyle='#071019';roundRect(-28,4,56,18,8);ctx.fill();
  ctx.fillStyle=t.dark;roundRect(-22,-9,44,20,7);ctx.fill();ctx.fillStyle=t.color;roundRect(-13,-18,27,16,6);ctx.fill();
  for(const xx of [-18,0,18]){ctx.fillStyle='#17283a';ctx.beginPath();ctx.arc(xx,15,7,0,TAU);ctx.fill();ctx.strokeStyle='#6d7d8c';ctx.lineWidth=2;ctx.stroke()}
  const a=(-t.angle*Math.PI/180)-slope;ctx.rotate(-slope);ctx.strokeStyle=t.color;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(Math.cos(a)*37, -10+Math.sin(a)*37);ctx.stroke();ctx.restore();
  ctx.fillStyle='#06111ccc';ctx.strokeStyle=t.color+'88';ctx.lineWidth=1;roundRect(t.x-24,t.y-44,48,6,3);ctx.fill();ctx.stroke();ctx.fillStyle=t.color;roundRect(t.x-23,t.y-43,46*Math.max(0,t.hp/t.maxHp),4,2);ctx.fill();
}
function drawEffects(){
  for(const p of state.projectiles){ctx.shadowColor=weapons[p.weapon].color;ctx.shadowBlur=15;ctx.fillStyle=weapons[p.weapon].color;ctx.beginPath();ctx.arc(p.x,p.y,5,0,TAU);ctx.fill();ctx.shadowBlur=0}
  for(const p of state.particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,TAU);ctx.fill()}ctx.globalAlpha=1;
  for(const s of state.shockwaves){const a=clamp(s.life/s.max,0,1);ctx.globalAlpha=a;if(s.type==='ring'){ctx.strokeStyle=s.color;ctx.lineWidth=4*a+1;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,TAU);ctx.stroke()}else{ctx.strokeStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=24;ctx.lineWidth=8*a+2;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();ctx.shadowBlur=0}}ctx.globalAlpha=1;
  for(const f of state.floaters){ctx.globalAlpha=clamp(f.life,0,1);ctx.fillStyle=f.color;ctx.font='bold 22px system-ui';ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y)}ctx.globalAlpha=1;ctx.textAlign='start';
}

function floatText(x,y,text,color){state.floaters.push({x,y,text,color,life:1});}
function toast(msg){ui.toast.textContent=msg;ui.toast.classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),1800);}
function beep(freq,dur,type='sine',gain=.03){
  if(!audioEnabled)return; try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)(); const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);}catch{}
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))} function lerp(a,b,t){return a+(b-a)*t} function rand(a,b){return a+Math.random()*(b-a)}

function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(state.started&&!state.over)update(dt);draw();requestAnimationFrame(loop)}

// menu
[...document.querySelectorAll('.mode-card')].forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.mode-card').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.mode=b.dataset.mode;ui.difficulty.style.opacity=state.mode==='ai'?1:.35;}));
[...document.querySelectorAll('[data-diff]')].forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-diff]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.diff=b.dataset.diff;}));
ui.start.addEventListener('click',beginGame);ui.restart.addEventListener('click',restart);
ui.sound.addEventListener('click',()=>{audioEnabled=!audioEnabled;ui.sound.textContent=audioEnabled?'🔊':'🔇'});
ui.fire.addEventListener('click',fire);ui.mobileFire.addEventListener('click',fire);ui.prev.addEventListener('click',()=>cycleWeapon(-1));ui.next.addEventListener('click',()=>cycleWeapon(1));ui.mobileWeapon.addEventListener('click',()=>cycleWeapon(1));
ui.slider.addEventListener('input',e=>{if(canHumanControl()){active().power=+e.target.value;updateUI()}});
document.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.act;if(a==='angleDown')adjustAngle(-2);if(a==='angleUp')adjustAngle(2);}));
let holdTimer=null;document.querySelectorAll('[data-hold]').forEach(b=>{const act=()=>{const a=b.dataset.hold;if(a==='angleDown')adjustAngle(-1);if(a==='angleUp')adjustAngle(1);if(a==='powerDown')adjustPower(-1);if(a==='powerUp')adjustPower(1)};b.addEventListener('pointerdown',()=>{act();holdTimer=setInterval(act,55)});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{clearInterval(holdTimer);holdTimer=null;}));});
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();if(e.code==='ArrowLeft')adjustAngle(-1);if(e.code==='ArrowRight')adjustAngle(1);if(e.code==='ArrowUp')adjustPower(1);if(e.code==='ArrowDown')adjustPower(-1);if(e.code==='KeyA')cycleWeapon(-1);if(e.code==='KeyD')cycleWeapon(1);if(e.code==='Space')fire();});

if('serviceWorker' in navigator && location.protocol!=='file:') navigator.serviceWorker.register('./sw.js').catch(()=>{});
resetState();requestAnimationFrame(loop);
})();
