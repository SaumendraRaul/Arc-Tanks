(() => {
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height, TAU = Math.PI * 2;
const G = 120;
const PICK_COUNT = 7;

const ui = {
  menu: document.getElementById('menu'), draft: document.getElementById('draftOverlay'), draftPool: document.getElementById('draftPool'),
  start: document.getElementById('startBtn'), difficulty: document.getElementById('difficultyRow'), mapSelect: document.getElementById('mapSelect'), mapBadge: document.getElementById('mapBadge'),
  draftTurn: document.getElementById('draftTurnLabel'), draftP1Name: document.getElementById('draftP1Name'), draftP2Name: document.getElementById('draftP2Name'),
  draftP1Count: document.getElementById('draftP1Count'), draftP2Count: document.getElementById('draftP2Count'), draftP1Loadout: document.getElementById('draftP1Loadout'), draftP2Loadout: document.getElementById('draftP2Loadout'), rerollDraft: document.getElementById('rerollDraftBtn'),
  angle: document.getElementById('angleReadout'), power: document.getElementById('powerReadout'), slider: document.getElementById('powerSlider'),
  weaponButton: document.getElementById('weaponButton'), weaponName: document.getElementById('weaponName'), weaponDesc: document.getElementById('weaponDesc'), weaponIcon: document.getElementById('weaponIcon'), ammo: document.getElementById('ammoLabel'),
  drawer: document.getElementById('weaponDrawer'), weaponGrid: document.getElementById('weaponGrid'), closeDrawer: document.getElementById('closeDrawerBtn'),
  fire: document.getElementById('fireBtn'), mobileWeapon: document.getElementById('mobileWeapon'), mobileFire: document.getElementById('mobileFire'),
  p1Hp: document.getElementById('p1Hp'), p2Hp: document.getElementById('p2Hp'), p1HpText: document.getElementById('p1HpText'), p2HpText: document.getElementById('p2HpText'),
  p1Name: document.getElementById('p1Name'), p2Name: document.getElementById('p2Name'), turn: document.getElementById('turnLabel'), wind: document.getElementById('windLabel'), windArrow: document.getElementById('windArrow'),
  toast: document.getElementById('toast'), banner: document.getElementById('banner'), restart: document.getElementById('restartBtn'), sound: document.getElementById('soundBtn'), brand: document.getElementById('brandBtn')
};

const weapons = [
  {id:'pulse',name:'Pulse Shell',category:'standard',desc:'Clean, dependable explosive shell.',ammo:3,damage:32,radius:42,crater:34,color:'#80ecff',trail:'smoke',sprite:0,behavior:'shell'},
  {id:'titan',name:'Titan Core',category:'explosive',desc:'Slow heavy round with a brutal blast.',ammo:2,damage:48,radius:62,crater:55,color:'#ff9c73',trail:'fire',sprite:1,behavior:'heavy',speed:.9},
  {id:'cluster',name:'Cluster Bloom',category:'explosive',desc:'Bursts into five secondary detonations.',ammo:2,damage:16,radius:29,crater:20,color:'#f0b6ff',trail:'spark',sprite:2,behavior:'cluster'},
  {id:'fault',name:'Fault Line',category:'terrain',desc:'Cracks a wide section of the battlefield.',ammo:2,damage:24,radius:66,crater:80,color:'#ffd768',trail:'dust',sprite:3,behavior:'quake'},
  {id:'ricochet',name:'Ricochet',category:'chaos',desc:'Bounces twice before exploding.',ammo:2,damage:39,radius:47,crater:34,color:'#7df1a8',trail:'spark',sprite:4,behavior:'bounce',bounces:2},
  {id:'prism',name:'Prism Lance',category:'energy',desc:'Instant line-of-sight energy beam.',ammo:2,damage:37,radius:23,crater:12,color:'#67ebff',trail:'beam',sprite:5,behavior:'laser'},
  {id:'ember',name:'Ember Rain',category:'chaos',desc:'Calls a burning vertical barrage.',ammo:2,damage:13,radius:27,crater:13,color:'#ff7e63',trail:'fire',sprite:6,behavior:'rain'},
  {id:'nova',name:'Nova Seed',category:'explosive',desc:'A tiny sun with terrible social skills.',ammo:1,damage:64,radius:96,crater:78,color:'#fff09b',trail:'plasma',sprite:7,behavior:'nuke',speed:.84},
  {id:'splitter',name:'Splitter',category:'standard',desc:'Separates into three shells at the apex.',ammo:2,damage:20,radius:31,crater:22,color:'#b9f6ff',trail:'smoke',sprite:8,behavior:'split'},
  {id:'dirt',name:'Dirt Bomb',category:'terrain',desc:'Builds a mound instead of digging one.',ammo:3,damage:8,radius:44,crater:0,color:'#8ee096',trail:'dust',sprite:9,behavior:'dirt'},
  {id:'drill',name:'Drill Shot',category:'terrain',desc:'Bores into terrain before detonating.',ammo:2,damage:39,radius:46,crater:52,color:'#b9dfe6',trail:'spark',sprite:10,behavior:'drill'},
  {id:'plasma',name:'Plasma Orb',category:'energy',desc:'Low-gravity orb with a fat energy blast.',ammo:2,damage:42,radius:58,crater:32,color:'#a69cff',trail:'plasma',sprite:11,behavior:'plasma',gravity:.58,speed:.88},
  {id:'roller',name:'Roller',category:'chaos',desc:'Hits ground, then races along the surface.',ammo:2,damage:34,radius:43,crater:30,color:'#ffbd68',trail:'spark',sprite:12,behavior:'roller'},
  {id:'sky',name:'Sky Spear',category:'explosive',desc:'Marks impact, then drops a sky barrage.',ammo:2,damage:18,radius:31,crater:20,color:'#ffaf79',trail:'smoke',sprite:13,behavior:'airstrike'},
  {id:'boomerang',name:'Boomerang',category:'chaos',desc:'Turns back mid-flight. Extremely rude.',ammo:2,damage:38,radius:45,crater:31,color:'#c79bff',trail:'spark',sprite:14,behavior:'boomerang'},
  {id:'gravity',name:'Gravity Well',category:'energy',desc:'Pulls both tanks toward the singularity.',ammo:1,damage:29,radius:70,crater:46,color:'#a778ff',trail:'plasma',sprite:15,behavior:'gravity'},
  {id:'napalm',name:'Napalm Drop',category:'explosive',desc:'Leaves a burning hazard after impact.',ammo:2,damage:22,radius:42,crater:24,color:'#ff7d50',trail:'fire',sprite:16,behavior:'napalm'},
  {id:'frost',name:'Frost Orb',category:'energy',desc:'Freezes the wind and bursts in cold plasma.',ammo:2,damage:31,radius:50,crater:25,color:'#7ee5ff',trail:'frost',sprite:17,behavior:'frost',gravity:.72},
  {id:'seeker',name:'Seeker Mine',category:'chaos',desc:'Lands, then crawls toward the enemy.',ammo:2,damage:36,radius:43,crater:28,color:'#9db2c9',trail:'smoke',sprite:18,behavior:'seeker'},
  {id:'wall',name:'Wall Maker',category:'terrain',desc:'Raises a steep defensive ridge.',ammo:2,damage:5,radius:56,crater:0,color:'#8ce3a4',trail:'dust',sprite:19,behavior:'wall'},
  {id:'shrapnel',name:'Shrapnel Fan',category:'standard',desc:'Impact sprays five micro-charges outward.',ammo:2,damage:14,radius:24,crater:14,color:'#f3d36d',trail:'spark',sprite:20,behavior:'shrapnel'},
  {id:'meteor',name:'Meteor Call',category:'explosive',desc:'Calls a meteor down onto the impact zone.',ammo:1,damage:55,radius:79,crater:63,color:'#ef8c70',trail:'fire',sprite:21,behavior:'meteor'},
  {id:'arc',name:'Arc Bolt',category:'energy',desc:'Impact attracts a lightning strike.',ammo:2,damage:35,radius:40,crater:18,color:'#8fbcff',trail:'electric',sprite:22,behavior:'lightning'},
  {id:'solar',name:'Solar Flare',category:'chaos',desc:'A colossal beam-burst hybrid. One shot.',ammo:1,damage:58,radius:84,crater:50,color:'#fff2a6',trail:'plasma',sprite:23,behavior:'solar'}
];

const mapNames = {rolling:'ROLLING HILLS',twin:'TWIN PEAKS',canyon:'CANYON',bowl:'BOWL',jagged:'JAGGED BADLANDS',flat:'FLATLANDS',asym:'ASYMMETRIC',islands:'BROKEN ISLANDS'};
const mapTypes = Object.keys(mapNames);
const themes = [
  {top:'#071127',mid:'#17375d',bottom:'#b66258',terrain:'#2d4443',rim:'#718f70',far:'#172744',near:'#243852',orb:'#d9efff'},
  {top:'#160a27',mid:'#47295f',bottom:'#d16e59',terrain:'#44343a',rim:'#a36b64',far:'#2b2144',near:'#4a3155',orb:'#ffd9a4'},
  {top:'#041b24',mid:'#0e4756',bottom:'#8cc1ae',terrain:'#334a42',rim:'#83aa83',far:'#123640',near:'#1e4a4c',orb:'#e2fff4'},
  {top:'#101727',mid:'#354158',bottom:'#d4a06d',terrain:'#493d35',rim:'#b49a6f',far:'#273344',near:'#3b4755',orb:'#fff0c6'}
];

let state = makeState();
let last = performance.now();
let audioEnabled = true;
let audioCtx = null;

function makeState(){
  return {
    mode:'ai', diff:'tactician', draftStyle:'classic', mapChoice:'random', mapType:'rolling', theme:themes[0],
    started:false, over:false, locked:false, turn:0, wind:0, time:0, shake:0, flash:0,
    terrain:new Float32Array(W), stars:[], clouds:[], particles:[], shockwaves:[], floaters:[], projectiles:[], hazards:[],
    draftPicks:[[],[]], draftPool:[], draftTurn:0, resolveTimer:null, toastTimer:null,
    muzzle:[0,0], recoil:[0,0],
    tanks:[makeTank(0),makeTank(1)]
  };
}
function makeTank(i){
  return {x:i===0?145:1135,y:0,angle:i===0?45:135,power:68,hp:180,maxHp:180,weapon:0,color:i===0?'#65e8ff':'#ff6f78',dark:i===0?'#177d99':'#9b3144',name:i===0?'PLAYER 1':'CPU',ammo:Array(weapons.length).fill(0),loadout:[]};
}

function preserveConfigReset(){
  const cfg={mode:state.mode,diff:state.diff,draftStyle:state.draftStyle,mapChoice:state.mapChoice,draftPicks:state.draftPicks.map(a=>[...a])};
  state=makeState(); Object.assign(state,cfg); state.draftPicks=cfg.draftPicks;
}
function buildWorld(){
  state.mapType=state.mapChoice==='random'?mapTypes[Math.floor(Math.random()*mapTypes.length)]:state.mapChoice;
  state.theme=themes[Math.floor(Math.random()*themes.length)];
  state.stars=[];state.clouds=[];
  for(let i=0;i<120;i++)state.stars.push({x:Math.random()*W,y:Math.random()*H*.48,s:Math.random()*1.8+.25,a:Math.random()*.7+.12});
  for(let i=0;i<7;i++)state.clouds.push({x:Math.random()*W,y:65+Math.random()*180,w:130+Math.random()*180,v:2+Math.random()*7,a:.035+Math.random()*.05});
  generateTerrain(state.mapType); settleTanks(); randomWind(); ui.mapBadge.textContent=mapNames[state.mapType];
}

function spritePos(index){
  const col=index%6,row=Math.floor(index/6); return `${(col/5)*100}% ${(row/3)*100}%`;
}
function setSprite(el,index){ el.classList.add('projectile-sprite');el.style.backgroundPosition=spritePos(index); }
function categoryLabel(c){return c.toUpperCase();}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}

function openDraft(){
  state.draftPicks=[[],[]]; state.draftTurn=0;
  state.draftPool=shuffle(weapons.map((_,i)=>i)).slice(0,18);
  ui.menu.classList.add('hidden'); ui.draft.classList.remove('hidden'); ui.banner.classList.add('hidden');
  ui.draftP2Name.textContent=state.mode==='ai'?'CPU':'PLAYER 2'; renderDraft();
}
function quickPack(){
  const ids=shuffle(weapons.map((_,i)=>i)); state.draftPicks=[ids.slice(0,PICK_COUNT),ids.slice(PICK_COUNT,PICK_COUNT*2)];
  beginMatch();
}
function renderDraft(){
  ui.draftTurn.textContent=state.draftTurn===0?'PLAYER 1':state.mode==='ai'?'CPU':'PLAYER 2';
  ui.draftP1Count.textContent=`${state.draftPicks[0].length} / ${PICK_COUNT}`; ui.draftP2Count.textContent=`${state.draftPicks[1].length} / ${PICK_COUNT}`;
  ui.draftPool.innerHTML='';
  const aiThinking=state.mode==='ai'&&state.draftTurn===1;
  for(const idx of state.draftPool){
    const w=weapons[idx],b=document.createElement('button'); b.className=`weapon-draft-card cat-${w.category}`; b.disabled=aiThinking;
    b.innerHTML=`<div class="projectile-sprite" style="background-position:${spritePos(idx)}"></div><em>${categoryLabel(w.category)}</em><b>${w.name}</b><small>${w.desc}</small><span class="ammo-chip">×${w.ammo}</span>`;
    b.addEventListener('click',()=>draftPick(idx)); ui.draftPool.appendChild(b);
  }
  renderMiniLoadout(ui.draftP1Loadout,state.draftPicks[0]); renderMiniLoadout(ui.draftP2Loadout,state.draftPicks[1]);
}
function renderMiniLoadout(el,picks){
  el.innerHTML=''; picks.forEach(i=>{const s=document.createElement('span');s.className='mini-pick projectile-sprite';s.title=weapons[i].name;s.style.backgroundPosition=spritePos(i);el.appendChild(s);});
}
function draftPick(idx){
  if(!state.draftPool.includes(idx))return;
  if(state.mode==='ai'&&state.draftTurn===1)return;
  commitDraftPick(idx);
}
function commitDraftPick(idx){
  state.draftPicks[state.draftTurn].push(idx); state.draftPool=state.draftPool.filter(i=>i!==idx);
  if(state.draftPicks[0].length>=PICK_COUNT&&state.draftPicks[1].length>=PICK_COUNT){renderDraft();setTimeout(beginMatch,500);return;}
  state.draftTurn=1-state.draftTurn;
  if(state.draftPicks[state.draftTurn].length>=PICK_COUNT)state.draftTurn=1-state.draftTurn;
  renderDraft();
  if(state.mode==='ai'&&state.draftTurn===1)setTimeout(aiDraftPick,420);
}
function aiDraftPick(){
  if(ui.draft.classList.contains('hidden')||state.draftTurn!==1)return;
  const current=state.draftPicks[1].map(i=>weapons[i]);
  let best=state.draftPool[0],score=-Infinity;
  for(const idx of state.draftPool){
    const w=weapons[idx]; let s=(w.damage*.45+w.radius*.25)+(w.ammo*6)+Math.random()*16;
    if(!current.some(x=>x.category===w.category))s+=16;
    if(['laser','roller','gravity','airstrike','nuke'].includes(w.behavior))s+=9;
    if(s>score){score=s;best=idx;}
  }
  commitDraftPick(best);
}

function beginMatch(){
  preserveConfigReset(); buildWorld();
  state.tanks[1].name=state.mode==='ai'?'CPU':'PLAYER 2'; ui.p2Name.textContent=state.tanks[1].name;
  applyLoadouts(); state.started=true;state.turn=Math.random()<.5?0:1;state.locked=false;
  ui.menu.classList.add('hidden');ui.draft.classList.add('hidden');ui.drawer.classList.add('hidden');ui.banner.classList.add('hidden');
  toast(`${active().name} has first shot`);updateUI();
  if(state.mode==='ai'&&state.turn===1){state.locked=true;updateUI();setTimeout(aiTurn,700);}
}
function applyLoadouts(){
  state.tanks.forEach((t,ti)=>{
    t.loadout=[...state.draftPicks[ti]];t.ammo=Array(weapons.length).fill(0);
    t.loadout.forEach(idx=>t.ammo[idx]+=weapons[idx].ammo);
    t.weapon=t.loadout[0]??0;
  });
}
function restart(){
  if(!state.started){showMenu();return;}
  beginMatch();
}
function showMenu(){
  clearTimeout(state.resolveTimer);state.started=false;state.over=false;state.locked=false;ui.banner.classList.add('hidden');ui.draft.classList.add('hidden');ui.drawer.classList.add('hidden');ui.menu.classList.remove('hidden');
  buildWorld();updateUI();
}

function generateTerrain(type){
  const s1=Math.random()*8,s2=Math.random()*8,s3=Math.random()*8;
  for(let x=0;x<W;x++){
    const u=x/W,noise=Math.sin(x*.007+s1)*17+Math.sin(x*.018+s2)*8;
    let y=500;
    if(type==='rolling')y=500+Math.sin(x*.0047+s1)*44+Math.sin(x*.011+s2)*24+noise*.35;
    if(type==='twin'){const p1=Math.exp(-Math.pow((u-.27)/.11,2)),p2=Math.exp(-Math.pow((u-.73)/.11,2));y=545-125*(p1+p2)+noise;}
    if(type==='canyon'){const center=Math.exp(-Math.pow((u-.5)/.19,4));y=450+142*center+noise*.6;}
    if(type==='bowl')y=445+125*Math.pow(Math.sin(Math.PI*u),2)+noise*.45;
    if(type==='jagged')y=505-55*Math.abs(Math.sin(x*.014+s1))-30*Math.abs(Math.sin(x*.031+s3))+noise*.55;
    if(type==='flat')y=520+Math.sin(x*.006+s1)*8+Math.sin(x*.018+s2)*4;
    if(type==='asym')y=u<.48?470+Math.sin(x*.006+s1)*18:535+Math.sin(x*.012+s2)*42+Math.sin(x*.027+s3)*12;
    if(type==='islands'){const trenches=80*Math.pow(Math.sin(u*Math.PI*3),8);y=465+trenches+Math.sin(x*.009+s1)*18;}
    state.terrain[x]=clamp(y,345,625);
  }
  flattenAt(145,90);flattenAt(1135,90);
}
function flattenAt(cx,width){const base=state.terrain[Math.round(cx)];for(let x=Math.max(0,cx-width);x<Math.min(W,cx+width);x++){const d=Math.abs(x-cx)/width,k=Math.pow(1-d,2);state.terrain[x]=lerp(state.terrain[x],base,k*.92);}}
function terrainY(x){return state.terrain[clamp(Math.round(x),0,W-1)];}
function terrainSlope(x){return Math.atan2(terrainY(x+8)-terrainY(x-8),16);}
function settleTanks(){state.tanks.forEach(t=>{t.x=clamp(t.x,38,W-38);t.y=terrainY(t.x)-18;});}
function randomWind(){state.wind=(Math.random()*2-1)*34;updateUI();}

function active(){return state.tanks[state.turn];}
function opponent(){return state.tanks[1-state.turn];}
function hasAmmo(t){return t.ammo.some(a=>a>0);}
function ensureAmmo(t){if(hasAmmo(t))return;const fallback=0;t.ammo[fallback]=2;if(!t.loadout.includes(fallback))t.loadout.push(fallback);t.weapon=fallback;toast(`${t.name} received emergency Pulse Shells`);}
function canHumanControl(){return state.started&&!state.over&&!state.locked&&!(state.mode==='ai'&&state.turn===1);}

function updateUI(){
  const t=active(),w=weapons[t.weapon]||weapons[0],ammo=t.ammo[t.weapon]||0;
  ui.angle.textContent=`${Math.round(t.angle)}°`;ui.power.textContent=Math.round(t.power);ui.slider.value=t.power;
  ui.weaponName.textContent=w.name;ui.weaponDesc.textContent=w.desc;ui.ammo.textContent=`×${ammo}`;setSprite(ui.weaponIcon,t.weapon);
  ui.p1Hp.style.width=`${Math.max(0,state.tanks[0].hp/state.tanks[0].maxHp*100)}%`;ui.p2Hp.style.width=`${Math.max(0,state.tanks[1].hp/state.tanks[1].maxHp*100)}%`;
  ui.p1HpText.textContent=Math.max(0,Math.ceil(state.tanks[0].hp));ui.p2HpText.textContent=Math.max(0,Math.ceil(state.tanks[1].hp));
  ui.turn.textContent=state.over?'MATCH COMPLETE':state.started?`${t.name} TURN`:'PREPARE FOR BATTLE';
  ui.windArrow.textContent=state.wind>2?'→':state.wind<-2?'←':'·';ui.wind.textContent=Math.abs(state.wind/10).toFixed(1);
  ui.fire.disabled=!canHumanControl();renderWeaponGrid();
}
function renderWeaponGrid(){
  if(!state.started)return;const t=active();ui.weaponGrid.innerHTML='';
  t.loadout.forEach(idx=>{const w=weapons[idx],a=t.ammo[idx],b=document.createElement('button');b.className=`weapon-choice ${idx===t.weapon?'active':''}`;b.disabled=a<=0||!canHumanControl();b.innerHTML=`<div class="projectile-sprite" style="background-position:${spritePos(idx)}"></div><b>${w.name}</b><span>×${a}</span>`;b.addEventListener('click',()=>{t.weapon=idx;ui.drawer.classList.add('hidden');updateUI();});ui.weaponGrid.appendChild(b);});
}
function adjustAngle(d){if(!canHumanControl())return;const t=active();t.angle=clamp(t.angle+d,8,172);updateUI();}
function adjustPower(d){if(!canHumanControl())return;const t=active();t.power=clamp(t.power+d,20,100);updateUI();}
function cycleWeapon(dir=1){if(!canHumanControl())return;const t=active();const available=t.loadout.filter(i=>t.ammo[i]>0);if(!available.length){ensureAmmo(t);updateUI();return;}let pos=available.indexOf(t.weapon);pos=(pos+dir+available.length)%available.length;t.weapon=available[pos];updateUI();}

function cannonTip(t){const a=-t.angle*Math.PI/180;return{x:t.x+Math.cos(a)*38,y:t.y-8+Math.sin(a)*38};}
function fire(){if(!canHumanControl())return;shootCurrent();}
function shootCurrent(){
  const t=active();ensureAmmo(t);const w=weapons[t.weapon];if(t.ammo[t.weapon]<=0){cycleWeapon(1);return;}
  t.ammo[t.weapon]--;state.locked=true;state.recoil[state.turn]=1;state.muzzle[state.turn]=1;updateUI();beep(115,.055,'square',.025);
  clearTimeout(state.resolveTimer);
  if(w.behavior==='laser')fireLaser(t,w,false);
  else if(w.behavior==='solar')fireLaser(t,w,true);
  else spawnProjectileFromTank(t,w);
}
function spawnProjectileFromTank(t,w,opts={}){
  const p=cannonTip(t),a=(-t.angle+(opts.angleOffset||0))*Math.PI/180,speed=t.power*4.35*(w.speed||1)*(opts.speedMul||1);
  state.projectiles.push({x:p.x,y:p.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,weapon:t.weapon,owner:state.turn,life:0,bounces:0,scale:opts.scale||1,child:!!opts.child,mode:'flight',spin:Math.random()*TAU,reversed:false,trailTick:0});
}
function fireLaser(t,w,solar){
  const p=cannonTip(t),a=-t.angle*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a);let x=p.x,y=p.y,hit=null;
  for(let i=0;i<1600;i+=3){x=p.x+dx*i;y=p.y+dy*i;if(x<0||x>=W||y<0||y>=H)break;const enemy=opponent();if(Math.hypot(x-enemy.x,y-enemy.y)<26){hit={x,y};break;}if(y>=terrainY(x)){hit={x,y:terrainY(x)};break;}}
  state.flash=solar?.38:.16;state.shockwaves.push({type:'beam',x1:p.x,y1:p.y,x2:x,y2:y,color:w.color,life:solar?.5:.28,max:solar?.5:.28,width:solar?18:7});
  if(hit){if(solar){explodeCore(hit.x,hit.y,w,state.turn,1);setTimeout(()=>explodeCore(hit.x,hit.y,{...w,damage:w.damage*.45,radius:w.radius*.7,crater:w.crater*.45},state.turn,.9),150);}else explodeCore(hit.x,hit.y,w,state.turn,.95);}scheduleResolve(solar?950:500);
}

function scheduleResolve(ms=650){clearTimeout(state.resolveTimer);state.resolveTimer=setTimeout(resolveShot,ms);}
function resolveShot(){
  if(state.projectiles.length){scheduleResolve(220);return;}
  if(state.tanks.some(t=>t.hp<=0)){finishMatch();return;}endTurn();
}
function endTurn(){if(state.over)return;state.turn=1-state.turn;ensureAmmo(active());state.locked=false;randomWind();updateUI();if(state.mode==='local')toast(`${active().name}: choose your projectile`);if(state.mode==='ai'&&state.turn===1){state.locked=true;updateUI();setTimeout(aiTurn,650);}}
function finishMatch(){
  state.over=true;state.locked=true;const winner=state.tanks[0].hp>0?state.tanks[0]:state.tanks[1];ui.drawer.classList.add('hidden');
  ui.banner.classList.remove('hidden');ui.banner.innerHTML=`<div><small style="display:block;font-size:10px;color:#92a4be;letter-spacing:.26em">BATTLE COMPLETE</small>${winner.name}<br><button id="againBtn" class="primary-btn" style="width:210px;margin:20px auto 0">REMATCH</button></div>`;
  setTimeout(()=>document.getElementById('againBtn')?.addEventListener('click',()=>{ui.banner.classList.add('hidden');beginMatch();}),20);updateUI();
}

function handleImpact(p,w,x,y){
  if(w.behavior==='dirt'){impactFlash(x,y,w);terrainRise(x,52,58);damageRadius(x,y,w,1);settleTanks();scheduleResolve(650);return;}
  if(w.behavior==='wall'){impactFlash(x,y,w);terrainRise(x,38,95);damageRadius(x,y,w,1);settleTanks();scheduleResolve(700);return;}
  if(w.behavior==='quake'){explodeCore(x,y,w,p.owner,.55);for(let i=-3;i<=3;i++)setTimeout(()=>{const tx=clamp(x+i*55,8,W-8);explodeCore(tx,terrainY(tx),{...w,damage:7,radius:28,crater:25},p.owner,.75);},(i+3)*55);scheduleResolve(1000);return;}
  if(w.behavior==='cluster'){explodeCore(x,y,w,p.owner,.65);for(let i=0;i<5;i++)setTimeout(()=>{const tx=clamp(x+(i-2)*34+rand(-16,16),8,W-8);explodeCore(tx,terrainY(tx),{...w,damage:15,radius:27,crater:18},p.owner,.9);},i*85);scheduleResolve(1050);return;}
  if(w.behavior==='rain'){explodeCore(x,y,w,p.owner,.55);for(let i=0;i<7;i++)setTimeout(()=>{const tx=clamp(x+(i-3)*38+rand(-15,15),8,W-8);state.shockwaves.push({type:'beam',x1:tx-18,y1:0,x2:tx,y2:terrainY(tx),color:w.color,life:.15,max:.15,width:5});explodeCore(tx,terrainY(tx),{...w,damage:11,radius:24,crater:9},p.owner,.9);},i*70);scheduleResolve(1100);return;}
  if(w.behavior==='airstrike'){impactFlash(x,y,w);for(let i=0;i<5;i++)setTimeout(()=>{const tx=clamp(x+(i-2)*48+rand(-12,12),8,W-8);state.shockwaves.push({type:'beam',x1:tx,y1:0,x2:tx,y2:terrainY(tx),color:'#ffd3ac',life:.18,max:.18,width:4});explodeCore(tx,terrainY(tx),{...w,damage:19,radius:31,crater:20},p.owner,.9);},250+i*100);scheduleResolve(1200);return;}
  if(w.behavior==='gravity'){explodeCore(x,y,w,p.owner,.65);state.tanks.forEach(t=>{const d=Math.max(40,Math.abs(t.x-x)),dir=x>t.x?1:-1;t.x=clamp(t.x+dir*Math.min(90,3200/d),38,W-38);});settleTanks();state.shockwaves.push({type:'well',x,y,r:8,maxR:95,life:.8,max:.8,color:w.color});scheduleResolve(950);return;}
  if(w.behavior==='napalm'){explodeCore(x,y,w,p.owner,.75);for(let i=-2;i<=2;i++){const hx=clamp(x+i*30,10,W-10);state.hazards.push({x:hx,y:terrainY(hx)-3,life:4,max:4,owner:p.owner,tick:0,color:w.color});}scheduleResolve(700);return;}
  if(w.behavior==='frost'){explodeCore(x,y,w,p.owner,1);state.wind=0;state.shockwaves.push({type:'ring',x,y,r:8,maxR:100,life:.9,max:.9,color:'#baf6ff'});updateUI();scheduleResolve(700);return;}
  if(w.behavior==='shrapnel'){explodeCore(x,y,w,p.owner,.65);for(let i=0;i<5;i++){const a=(-Math.PI*.85)+(i/4)*Math.PI*.7,tx=clamp(x+Math.cos(a)*rand(45,105),8,W-8);setTimeout(()=>explodeCore(tx,terrainY(tx),{...w,damage:10,radius:21,crater:10},p.owner,.8),i*65);}scheduleResolve(850);return;}
  if(w.behavior==='meteor'){impactFlash(x,y,w);state.shockwaves.push({type:'beam',x1:x+160,y1:-40,x2:x,y2:y,color:w.color,life:.55,max:.55,width:14});setTimeout(()=>explodeCore(x,y,w,p.owner,1.12),420);scheduleResolve(1200);return;}
  if(w.behavior==='lightning'){explodeCore(x,y,w,p.owner,.75);state.shockwaves.push({type:'lightning',x1:x+rand(-30,30),y1:0,x2:x,y2:y,color:w.color,life:.32,max:.32,width:7});const enemy=state.tanks[1-p.owner];if(Math.abs(enemy.x-x)<150){enemy.hp-=14;floatText(enemy.x,enemy.y-45,'-14',enemy.color);}scheduleResolve(800);return;}
  explodeCore(x,y,w,p.owner,1);scheduleResolve(w.behavior==='nuke'?900:650);
}
function explodeCore(x,y,w,owner,scale=1){
  state.shake=Math.min(22,state.shake+w.radius*.12);state.flash=Math.min(.5,state.flash+w.radius*.0027);beep(w.radius>70?42:58,.17,'sawtooth',.07);
  if(w.crater>0)deformTerrain(x,y,w.crater*scale);damageRadius(x,y,w,scale);settleTanks();impactFlash(x,y,w,scale);
}
function impactFlash(x,y,w,scale=1){
  state.shockwaves.push({type:'ring',x,y,r:0,maxR:w.radius*1.35*scale,life:.58,max:.58,color:w.color});
  const count=Math.round(18+w.radius*.32);for(let i=0;i<count;i++){const a=Math.random()*TAU,s=(45+Math.random()*250)*(w.radius/50);state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-70,life:.3+Math.random()*.75,max:1.05,size:1+Math.random()*4,color:Math.random()<.48?w.color:'#ffffff',grav:220,kind:'debris'});}
}
function damageRadius(x,y,w,scale=1){
  state.tanks.forEach((t,idx)=>{const d=Math.hypot(t.x-x,t.y-y);if(d<w.radius){const factor=1-d/w.radius,dmg=Math.max(1,w.damage*(.24+.76*factor))*scale;t.hp-=dmg;floatText(t.x,t.y-38,`-${Math.round(dmg)}`,idx===0?'#8df2ff':'#ff9299');const push=(t.x-x>=0?1:-1)*factor*w.radius*.11;t.x=clamp(t.x+push,38,W-38);}});
}
function deformTerrain(cx,cy,r){const min=Math.max(0,Math.floor(cx-r)),max=Math.min(W-1,Math.ceil(cx+r));for(let x=min;x<=max;x++){const dx=x-cx,lower=cy+Math.sqrt(Math.max(0,r*r-dx*dx))*.68;if(lower>state.terrain[x])state.terrain[x]=Math.min(H-7,lower);}}
function terrainRise(cx,width,height){for(let x=Math.max(0,Math.floor(cx-width));x<=Math.min(W-1,Math.ceil(cx+width));x++){const d=Math.abs(x-cx)/width;if(d>1)continue;const rise=height*Math.pow(1-d*d,1.5);state.terrain[x]=Math.max(280,state.terrain[x]-rise);}}

function updateProjectile(p,dt,additions){
  const w=weapons[p.weapon];p.life+=dt;p.spin+=dt*(w.behavior==='drill'?15:5);
  if(p.mode==='roller'||p.mode==='seeker'){
    const target=state.tanks[1-p.owner];let dir=p.mode==='seeker'?(target.x>p.x?1:-1):(p.vx>=0?1:-1);p.x+=dir*(p.mode==='seeker'?95:125)*dt;p.y=terrainY(p.x)-7;
    spawnTrail(p,w);
    if(p.x<10||p.x>W-10||p.life>3.2||Math.hypot(p.x-target.x,p.y-target.y)<28){handleImpact(p,w,p.x,p.y);return false;}return true;
  }
  if(p.mode==='drill'){
    p.x+=p.vx*.52*dt;p.y+=p.vy*.52*dt;p.vy+=G*.2*dt;spawnTrail(p,w);if(p.life-p.drillStart>.52||p.x<0||p.x>W){handleImpact(p,w,clamp(p.x,4,W-4),clamp(p.y,4,H-4));return false;}return true;
  }
  if(w.behavior==='boomerang'&&!p.reversed&&p.life>.72){p.reversed=true;p.vx*=-.72;p.vy-=35;state.shockwaves.push({type:'ring',x:p.x,y:p.y,r:3,maxR:32,life:.25,max:.25,color:w.color});}
  const gravity=w.gravity??1;p.vx+=state.wind*.09*dt;p.vy+=G*gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;spawnTrail(p,w);
  if(w.behavior==='split'&&!p.child&&!p.split&&p.life>.38&&p.vy>8){p.split=true;for(const off of[-13,0,13]){const a=Math.atan2(p.vy,p.vx)+off*Math.PI/180,s=Math.hypot(p.vx,p.vy)*.88;additions.push({...p,x:p.x,y:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,child:true,split:true,life:.45,scale:.82,spin:Math.random()*TAU});}state.shockwaves.push({type:'ring',x:p.x,y:p.y,r:2,maxR:26,life:.22,max:.22,color:w.color});return false;}
  let hit=false;state.tanks.forEach((t,idx)=>{if(!hit&&idx!==p.owner&&Math.hypot(p.x-t.x,p.y-t.y)<23)hit=true;});
  if(p.x<0||p.x>=W||p.y>H+80){scheduleResolve(350);return false;}
  if(p.y>=terrainY(p.x)||hit){
    if(w.behavior==='bounce'&&p.bounces<(w.bounces||1)&&!hit){p.y=terrainY(p.x)-4;p.vy=-Math.abs(p.vy)*.63;p.vx*=.86;p.bounces++;beep(180,.035,'square',.02);return true;}
    if((w.behavior==='roller'||w.behavior==='seeker')&&!hit){p.mode=w.behavior;p.y=terrainY(p.x)-7;p.life=0;return true;}
    if(w.behavior==='drill'&&!hit){p.mode='drill';p.drillStart=p.life;p.y+=5;return true;}
    handleImpact(p,w,p.x,Math.min(p.y,terrainY(p.x)));return false;
  }
  return true;
}
function spawnTrail(p,w){
  p.trailTick=(p.trailTick||0)+1;if(p.trailTick%2)return;let color=w.color,size=1.5,grav=0,life=.22;
  if(w.trail==='smoke'){color='#cbd4de';size=2.6;life=.35;}
  if(w.trail==='fire'){color=Math.random()<.5?'#ff8a5f':'#ffd36e';size=2.4;life=.28;}
  if(w.trail==='dust'){color='#c7b88f';size=2.2;life=.3;grav=25;}
  if(w.trail==='frost'){color='#d8fbff';size=2;life=.3;}
  if(w.trail==='electric'){color='#a9c8ff';size=1.8;life=.16;}
  state.particles.push({x:p.x,y:p.y,vx:-p.vx*.035+rand(-6,6),vy:-p.vy*.035+rand(-6,6),life,max:life,size,color,grav,kind:'trail'});
}

function update(dt){
  state.time+=dt;state.shake=Math.max(0,state.shake-dt*27);state.flash=Math.max(0,state.flash-dt*1.9);state.muzzle=state.muzzle.map(v=>Math.max(0,v-dt*7));state.recoil=state.recoil.map(v=>Math.max(0,v-dt*5));
  state.clouds.forEach(c=>{c.x+=c.v*dt;if(c.x-c.w>W)c.x=-c.w;});
  state.floaters.forEach(f=>{f.y-=29*dt;f.life-=dt;});state.floaters=state.floaters.filter(f=>f.life>0);
  state.particles.forEach(p=>{p.vy+=p.grav*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.992;p.life-=dt;});state.particles=state.particles.filter(p=>p.life>0);
  state.shockwaves.forEach(s=>{s.life-=dt;if(s.type==='ring'||s.type==='well')s.r=lerp(s.r,s.maxR,dt*7);});state.shockwaves=state.shockwaves.filter(s=>s.life>0);
  state.hazards.forEach(h=>{h.life-=dt;h.tick-=dt;h.y=terrainY(h.x)-3;if(h.tick<=0){h.tick=.65;state.tanks.forEach((t,idx)=>{if(idx!==h.owner&&Math.abs(t.x-h.x)<34){t.hp-=4;floatText(t.x,t.y-36,'-4',t.color);}});}});state.hazards=state.hazards.filter(h=>h.life>0);
  const next=[],additions=[];for(const p of state.projectiles)if(updateProjectile(p,dt,additions))next.push(p);state.projectiles=next.concat(additions);
}

function aiTurn(){
  if(state.over||state.mode!=='ai'||state.turn!==1)return;const me=active(),target=opponent();ensureAmmo(me);const available=me.loadout.filter(i=>me.ammo[i]>0);me.weapon=chooseAIWeapon(me,target,available);const w=weapons[me.weapon];
  if(w.behavior==='laser'||w.behavior==='solar'){const angle=Math.atan2(me.y-target.y,target.x-me.x)*-180/Math.PI;me.angle=clamp(angle+(state.diff==='rookie'?rand(-5,5):state.diff==='oracle'?rand(-.5,.5):rand(-1.7,1.7)),95,172);me.power=70;updateUI();setTimeout(()=>{state.locked=false;shootCurrent();},480);return;}
  const samples=state.diff==='rookie'?650:state.diff==='oracle'?2400:1350;let best={score:Infinity,angle:135,power:65};for(let i=0;i<samples;i++){const angle=rand(98,166),power=rand(28,100),score=simulateShot(me,target,angle,power,w);if(score<best.score)best={score,angle,power};}
  const ea=state.diff==='rookie'?rand(-6,6):state.diff==='oracle'?rand(-.5,.5):rand(-2,2),ep=state.diff==='rookie'?rand(-8,8):state.diff==='oracle'?rand(-.8,.8):rand(-3,3);me.angle=clamp(best.angle+ea,95,172);me.power=clamp(best.power+ep,20,100);updateUI();toast(`CPU selected ${w.name}`);setTimeout(()=>{state.locked=false;shootCurrent();},520);
}
function chooseAIWeapon(me,target,available){
  let best=available[0]??0,score=-Infinity;for(const idx of available){const w=weapons[idx];let s=w.damage*.55+w.radius*.18+w.ammo*2+Math.random()*18;if(target.hp<55&&['nuke','meteor','solar'].includes(w.behavior))s+=35;if(Math.abs(me.x-target.x)<420&&['roller','seeker','quake'].includes(w.behavior))s+=18;if(w.behavior==='dirt'||w.behavior==='wall')s-=12;if(s>score){score=s;best=idx;}}return best;
}
function simulateShot(me,target,angle,power,w){
  const a=-angle*Math.PI/180,p=cannonTip({...me,angle});let x=p.x,y=p.y,vx=Math.cos(a)*power*4.35*(w.speed||1),vy=Math.sin(a)*power*4.35*(w.speed||1),b=0,min=9999;
  for(let k=0;k<620;k++){const dt=.025;vx+=state.wind*.09*dt;vy+=G*(w.gravity??1)*dt;x+=vx*dt;y+=vy*dt;min=Math.min(min,Math.hypot(x-target.x,y-target.y));if(w.behavior==='boomerang'&&k===30)vx*=-.72;if(x<0||x>=W||y>H+50)return min+150;if(y>=terrainY(x)){if(w.behavior==='bounce'&&b<(w.bounces||1)){y=terrainY(x)-2;vy=-Math.abs(vy)*.63;vx*=.86;b++;continue;}if(w.behavior==='roller'||w.behavior==='seeker')return Math.abs(x-target.x)*.55;return Math.hypot(x-target.x,y-target.y);}}return min+40;
}

function draw(){
  const sx=state.shake?rand(-state.shake,state.shake):0,sy=state.shake?rand(-state.shake*.5,state.shake*.5):0;ctx.save();ctx.translate(sx,sy);drawSky();drawMountains();drawTerrain();drawHazards();drawAimGuide();drawTanks();drawProjectiles();drawEffects();ctx.restore();if(state.flash>0){ctx.fillStyle=`rgba(255,244,218,${state.flash})`;ctx.fillRect(0,0,W,H);}
}
function drawSky(){
  const th=state.theme,g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,th.top);g.addColorStop(.58,th.mid);g.addColorStop(1,th.bottom);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalCompositeOperation='screen';for(const s of state.stars){ctx.globalAlpha=s.a*(.72+.28*Math.sin(state.time*1.5+s.x));ctx.fillStyle='#e5f5ff';ctx.fillRect(s.x,s.y,s.s,s.s);}ctx.restore();
  const ox=995,oy=120,og=ctx.createRadialGradient(ox,oy,4,ox,oy,75);og.addColorStop(0,th.orb);og.addColorStop(.25,th.orb+'cc');og.addColorStop(1,th.orb+'00');ctx.fillStyle=og;ctx.beginPath();ctx.arc(ox,oy,75,0,TAU);ctx.fill();ctx.fillStyle=th.orb;ctx.globalAlpha=.82;ctx.beginPath();ctx.arc(ox,oy,25,0,TAU);ctx.fill();ctx.globalAlpha=1;
  state.clouds.forEach(c=>{ctx.globalAlpha=c.a;ctx.fillStyle='#e9f1ff';ctx.beginPath();ctx.ellipse(c.x,c.y,c.w,.2*c.w,0,0,TAU);ctx.fill();});ctx.globalAlpha=1;
}
function drawMountains(){const th=state.theme;ctx.fillStyle=th.far;ctx.beginPath();ctx.moveTo(0,430);for(let x=0;x<=W;x+=80)ctx.lineTo(x,335+Math.sin(x*.012)*44+Math.sin(x*.004)*50);ctx.lineTo(W,550);ctx.lineTo(0,550);ctx.fill();ctx.fillStyle=th.near;ctx.beginPath();ctx.moveTo(0,485);for(let x=0;x<=W;x+=55)ctx.lineTo(x,405+Math.sin(x*.01+2)*35+Math.sin(x*.017)*20);ctx.lineTo(W,575);ctx.lineTo(0,575);ctx.fill();}
function drawTerrain(){const th=state.theme,g=ctx.createLinearGradient(0,400,0,H);g.addColorStop(0,th.terrain);g.addColorStop(1,'#101723');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,state.terrain[0]);for(let x=1;x<W;x+=2)ctx.lineTo(x,state.terrain[x]);ctx.lineTo(W,H);ctx.closePath();ctx.fill();ctx.strokeStyle=th.rim;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,state.terrain[0]-1);for(let x=2;x<W;x+=3)ctx.lineTo(x,state.terrain[x]-1);ctx.stroke();ctx.globalAlpha=.11;ctx.strokeStyle='#ffffff';ctx.lineWidth=1;for(let y=565;y<H;y+=26){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y+18);ctx.stroke();}ctx.globalAlpha=1;}
function drawHazards(){for(const h of state.hazards){const a=clamp(h.life/h.max,0,1),f=10+Math.sin(state.time*10+h.x)*5;ctx.globalAlpha=a;ctx.fillStyle='#ff8a52';ctx.shadowColor='#ff6a3d';ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(h.x-10,h.y+4);ctx.quadraticCurveTo(h.x-5,h.y-f,h.x,h.y-4);ctx.quadraticCurveTo(h.x+7,h.y-f*1.2,h.x+10,h.y+4);ctx.fill();ctx.shadowBlur=0;}ctx.globalAlpha=1;}
function drawAimGuide(){if(!canHumanControl())return;const t=active(),w=weapons[t.weapon],p=cannonTip(t),a=-t.angle*Math.PI/180;if(w.behavior==='laser'||w.behavior==='solar'){ctx.save();ctx.setLineDash([5,12]);ctx.strokeStyle=w.color+'88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(a)*175,p.y+Math.sin(a)*175);ctx.stroke();ctx.restore();return;}let x=p.x,y=p.y,vx=Math.cos(a)*t.power*4.35*(w.speed||1),vy=Math.sin(a)*t.power*4.35*(w.speed||1);ctx.fillStyle='#e5fbff99';for(let i=0;i<10;i++){const dt=.075;for(let s=0;s<3;s++){vx+=state.wind*.09*dt;vy+=G*(w.gravity??1)*dt;x+=vx*dt;y+=vy*dt;}if(x<0||x>W||y>H||y>=terrainY(x))break;ctx.beginPath();ctx.arc(x,y,2.2,0,TAU);ctx.fill();}}
function drawTanks(){state.tanks.forEach((t,i)=>drawTank(t,i,i===state.turn&&state.started&&!state.over));}
function drawTank(t,index,activeGlow){
  const slope=clamp(terrainSlope(t.x),-.38,.38),recoil=state.recoil[index]*6,muzzle=state.muzzle[index];ctx.save();ctx.translate(t.x,t.y);ctx.rotate(slope);if(activeGlow){ctx.shadowColor=t.color;ctx.shadowBlur=20;}
  ctx.fillStyle='#071019';roundRect(-31,4,62,18,8);ctx.fill();ctx.fillStyle='#263346';roundRect(-27,7,54,12,6);ctx.fill();for(const xx of[-20,-7,7,20]){ctx.fillStyle='#101b28';ctx.beginPath();ctx.arc(xx,15,6,0,TAU);ctx.fill();ctx.strokeStyle='#667a8f';ctx.lineWidth=1.5;ctx.stroke();}
  ctx.fillStyle=t.dark;roundRect(-23,-10,46,20,7);ctx.fill();ctx.fillStyle=t.color;roundRect(-14,-19,28,16,6);ctx.fill();ctx.fillStyle='#dffaff';ctx.globalAlpha=.75;roundRect(-7,-16,11,5,2);ctx.fill();ctx.globalAlpha=1;
  ctx.rotate(-slope);const a=-t.angle*Math.PI/180,baseX=-Math.cos(a)*recoil,baseY=-Math.sin(a)*recoil;ctx.strokeStyle=t.color;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(baseX,-10+baseY);ctx.lineTo(baseX+Math.cos(a)*39,-10+baseY+Math.sin(a)*39);ctx.stroke();
  if(muzzle>0){const tipX=baseX+Math.cos(a)*42,tipY=-10+baseY+Math.sin(a)*42;ctx.fillStyle=`rgba(255,230,140,${muzzle})`;ctx.shadowColor='#ffb15f';ctx.shadowBlur=20;ctx.beginPath();for(let j=0;j<8;j++){const aa=a+j*TAU/8,r=j%2?7:16;const px=tipX+Math.cos(aa)*r,py=tipY+Math.sin(aa)*r;j?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.shadowBlur=0;}
  ctx.restore();ctx.fillStyle='#06111ccc';ctx.strokeStyle=t.color+'88';ctx.lineWidth=1;roundRect(t.x-25,t.y-48,50,6,3);ctx.fill();ctx.stroke();ctx.fillStyle=t.color;roundRect(t.x-24,t.y-47,48*Math.max(0,t.hp/t.maxHp),4,2);ctx.fill();
}
function drawProjectiles(){for(const p of state.projectiles)drawProjectile(p,weapons[p.weapon]);}
function drawProjectile(p,w){
  const a=Math.atan2(p.vy,p.vx),pulse=1+Math.sin(state.time*12+p.spin)*.12;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a+(w.behavior==='boomerang'?p.spin*.6:0));ctx.scale(p.scale||1,p.scale||1);ctx.shadowColor=w.color;ctx.shadowBlur=w.category==='energy'?22:12;
  if(['plasma','gravity','frost','lightning','nuke'].includes(w.behavior)){ctx.fillStyle=w.color;ctx.beginPath();ctx.arc(0,0,(w.behavior==='nuke'?9:7)*pulse,0,TAU);ctx.fill();ctx.strokeStyle='#ffffffcc';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,11*pulse,0,TAU);ctx.stroke();}
  else if(w.behavior==='drill'){ctx.fillStyle=w.color;ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-8,-8);ctx.lineTo(-5,0);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();ctx.rotate(p.spin);ctx.strokeStyle='#eaffff';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.rotate(TAU/3);ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(-13,0);ctx.stroke();}}
  else if(w.behavior==='bounce'){ctx.strokeStyle=w.color;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,8,0,TAU);ctx.stroke();ctx.fillStyle='#eafff0';ctx.beginPath();ctx.arc(0,0,3,0,TAU);ctx.fill();}
  else if(w.behavior==='boomerang'){ctx.strokeStyle=w.color;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,11,-2.2,1.1);ctx.stroke();ctx.beginPath();ctx.arc(0,0,11,.95,4.2);ctx.stroke();}
  else if(w.behavior==='roller'||w.behavior==='seeker'){ctx.fillStyle=w.color;ctx.beginPath();ctx.arc(0,0,8,0,TAU);ctx.fill();ctx.strokeStyle='#0a1018';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.moveTo(0,-8);ctx.lineTo(0,8);ctx.stroke();}
  else{ctx.fillStyle=w.color;roundRect(-10,-5,19,10,5);ctx.fill();ctx.fillStyle='#f6fbff';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(2,-6);ctx.lineTo(2,6);ctx.closePath();ctx.fill();ctx.fillStyle=w.color;ctx.beginPath();ctx.moveTo(-8,-4);ctx.lineTo(-14,-9);ctx.lineTo(-12,0);ctx.lineTo(-14,9);ctx.lineTo(-8,4);ctx.closePath();ctx.fill();}
  ctx.restore();
}
function drawEffects(){
  for(const p of state.particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,TAU);ctx.fill();}ctx.globalAlpha=1;
  for(const s of state.shockwaves){const a=clamp(s.life/s.max,0,1);ctx.globalAlpha=a;if(s.type==='ring'||s.type==='well'){ctx.strokeStyle=s.color;ctx.lineWidth=(s.type==='well'?7:4)*a+1;if(s.type==='well')ctx.setLineDash([8,8]);ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,TAU);ctx.stroke();ctx.setLineDash([]);}else if(s.type==='lightning'){ctx.strokeStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=22;ctx.lineWidth=s.width*a+1;ctx.beginPath();ctx.moveTo(s.x1,s.y1);const seg=9;for(let i=1;i<seg;i++){const t=i/seg;ctx.lineTo(lerp(s.x1,s.x2,t)+rand(-16,16),lerp(s.y1,s.y2,t));}ctx.lineTo(s.x2,s.y2);ctx.stroke();ctx.shadowBlur=0;}else{ctx.strokeStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=24;ctx.lineWidth=(s.width||8)*a+2;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();ctx.shadowBlur=0;}}ctx.globalAlpha=1;
  for(const f of state.floaters){ctx.globalAlpha=clamp(f.life,0,1);ctx.fillStyle=f.color;ctx.font='900 22px system-ui';ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;ctx.textAlign='start';
}

function floatText(x,y,text,color){state.floaters.push({x,y,text,color,life:1});}
function toast(msg){ui.toast.textContent=msg;ui.toast.classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),1800);}
function beep(freq,dur,type='sine',gain=.03){if(!audioEnabled)return;try{audioCtx||=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);}catch{}}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}function lerp(a,b,t){return a+(b-a)*t;}function rand(a,b){return a+Math.random()*(b-a);}
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(state.started&&!state.over)update(dt);draw();requestAnimationFrame(loop);}

// UI wiring
[...document.querySelectorAll('.mode-card')].forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.mode-card').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.mode=b.dataset.mode;ui.difficulty.style.opacity=state.mode==='ai'?1:.32;}));
[...document.querySelectorAll('[data-diff]')].forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-diff]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.diff=b.dataset.diff;}));
[...document.querySelectorAll('[data-draft]')].forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-draft]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.draftStyle=b.dataset.draft;}));
ui.mapSelect.addEventListener('change',e=>state.mapChoice=e.target.value);
ui.start.addEventListener('click',()=>state.draftStyle==='quick'?quickPack():openDraft());
ui.rerollDraft.addEventListener('click',()=>openDraft());ui.restart.addEventListener('click',restart);ui.brand.addEventListener('click',showMenu);
ui.sound.addEventListener('click',()=>{audioEnabled=!audioEnabled;ui.sound.textContent=audioEnabled?'🔊':'🔇';});
ui.fire.addEventListener('click',fire);ui.mobileFire.addEventListener('click',fire);
ui.weaponButton.addEventListener('click',()=>{if(!canHumanControl())return;renderWeaponGrid();ui.drawer.classList.toggle('hidden');});ui.mobileWeapon.addEventListener('click',()=>{if(!canHumanControl())return;renderWeaponGrid();ui.drawer.classList.toggle('hidden');});ui.closeDrawer.addEventListener('click',()=>ui.drawer.classList.add('hidden'));
ui.slider.addEventListener('input',e=>{if(canHumanControl()){active().power=+e.target.value;updateUI();}});
document.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.act==='angleDown')adjustAngle(-2);if(b.dataset.act==='angleUp')adjustAngle(2);}));
let holdTimer=null;document.querySelectorAll('[data-hold]').forEach(b=>{const act=()=>{const a=b.dataset.hold;if(a==='angleDown')adjustAngle(-1);if(a==='angleUp')adjustAngle(1);if(a==='powerDown')adjustPower(-1);if(a==='powerUp')adjustPower(1);};b.addEventListener('pointerdown',()=>{act();holdTimer=setInterval(act,55);});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{clearInterval(holdTimer);holdTimer=null;}));});
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();if(e.code==='ArrowLeft')adjustAngle(-1);if(e.code==='ArrowRight')adjustAngle(1);if(e.code==='ArrowUp')adjustPower(1);if(e.code==='ArrowDown')adjustPower(-1);if(e.code==='KeyA')cycleWeapon(-1);if(e.code==='KeyD')cycleWeapon(1);if(e.code==='KeyW'&&canHumanControl())ui.drawer.classList.toggle('hidden');if(e.code==='Space')fire();});

if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
buildWorld();updateUI();requestAnimationFrame(loop);
})();
