(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
let W=0,H=0,dpr=1,rocks=[],particles=[],running=false,over=false,frame=0,cameraY=0,worldHeight=0,best=Number(localStorage.getItem('cliffBest')||0),lastTime=0;
const player={x:0,y:0,vx:0,vy:0,left:null,right:null,phase:0};
let gyroEnabled=false,gyroNeutral=null,gyroValue=0,gyroRaw=0;
$('best').textContent=best+' م';
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(!running&&!over)resetWorld();}
function resetWorld(){cameraY=0;worldHeight=0;frame=0;rocks=[];particles=[];player.x=W/2;player.y=H*.69;player.vx=0;player.vy=0;player.left=null;player.right=null;generateRocks();}
function generateRocks(){let y=H*.82;while(y>-H*4){const x=W*.12+Math.random()*W*.76;rocks.push({x,y,w:40+Math.random()*47,h:20+Math.random()*20,used:false});y-=95+Math.random()*75;} }
function worldToScreen(y){return y-cameraY;}
function nearestRock(handX,handY){let bestRock=null,dist=Infinity;for(const r of rocks){const dx=r.x-handX,dy=r.y-handY,d=Math.hypot(dx,dy);if(d<105&&d<dist){dist=d;bestRock=r;}}return bestRock;}
function grab(side){if(!running)return;const hx=player.x+(side==='left'?-43:43),hy=player.y-22;const r=nearestRock(hx,hy);if(r){player[side]={x:r.x,y:r.y-5,rock:r};r.used=true;burst(r.x,r.y,'#ffd09a');}else{const r2=rocks.reduce((a,b)=>Math.abs(b.y-hy)<Math.abs(a.y-hy)?b:a,rocks[0]);if(r2&&Math.hypot(r2.x-hx,r2.y-hy)<145)player[side]={x:r2.x,y:r2.y-5,rock:r2};}}
function release(side){player[side]=null;}
function burst(x,y,color){for(let i=0;i<7;i++)particles.push({x,y,vx:(Math.random()-.5)*4,vy:(Math.random()-.8)*4,life:25,color});}
function bindHold(id,down,up){const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);down();el.classList.add('active');});const end=e=>{e.preventDefault();up();el.classList.remove('active');};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',()=>{up();el.classList.remove('active');});}
bindHold('leftBtn',()=>grab('left'),()=>release('left'));bindHold('rightBtn',()=>grab('right'),()=>release('right'));
window.addEventListener('keydown',e=>{if(e.code==='KeyA')grab('left');if(e.code==='KeyD')grab('right');});window.addEventListener('keyup',e=>{if(e.code==='KeyA')release('left');if(e.code==='KeyD')release('right');});
function start(){resetWorld();running=true;over=false;$('overlay').classList.add('hidden');$('gameOver').classList.add('hidden');$('hint').style.display='block';lastTime=performance.now();requestAnimationFrame(loop);}
$('startBtn').onclick=start;$('retryBtn').onclick=start;
async function toggleGyro(){
  if(gyroEnabled){gyroEnabled=false;gyroValue=0;gyroRaw=0;window.removeEventListener('deviceorientation',onOrientation);$('gyroBtn').classList.remove('enabled');$('gyroBtn').innerHTML='📱<small>ميل الهاتف</small>';$('hint').textContent='تم إيقاف الجيروسكوب. يمكنك استخدام أزرار الشاشة.';return;}
  if(!('DeviceOrientationEvent' in window)){ $('hint').textContent='هذا المتصفح لا يدعم مستشعر ميل الهاتف. استخدم أزرار الشاشة.';return;}
  try{if(typeof DeviceOrientationEvent.requestPermission==='function'){const permission=await DeviceOrientationEvent.requestPermission();if(permission!=='granted'){ $('hint').textContent='لم يتم السماح باستخدام مستشعر الحركة. يمكنك تفعيله من إعدادات المتصفح.';return;}}
    gyroNeutral=null;gyroValue=0;gyroRaw=0;window.addEventListener('deviceorientation',onOrientation);gyroEnabled=true;$('gyroBtn').classList.add('enabled');$('gyroBtn').innerHTML='✓<small>الميل مفعّل</small>';$('hint').textContent='حرّك الهاتف يمينًا ويسارًا. أمسكه مستقيمًا للحظة لإعادة ضبط المنتصف.';
  }catch(e){$('hint').textContent='تعذر تفعيل مستشعر الحركة. تأكد من أذونات المتصفح.';}
}
function onOrientation(e){if(e.gamma===null||e.gamma===undefined)return;if(gyroNeutral===null)gyroNeutral=e.gamma;const delta=e.gamma-gyroNeutral;const dead=3;gyroRaw=Math.abs(delta)<dead?0:Math.max(-1,Math.min(1,(delta-Math.sign(delta)*dead)/22));}
$('gyroBtn').addEventListener('click',toggleGyro);
$('fullscreen').onclick=async()=>{try{if(!document.fullscreenElement){await document.documentElement.requestFullscreen();}else await document.exitFullscreen();}catch(e){$('hint').textContent='ملء الشاشة غير مدعوم في هذا المتصفح — جرّب فتح اللعبة من قائمة المتصفح.';}};
function endGame(){running=false;over=true;const h=Math.max(0,Math.floor(worldHeight/10));$('finalHeight').textContent=h;$('gameOver').classList.remove('hidden');if(h>best){best=h;localStorage.setItem('cliffBest',best);$('best').textContent=best+' م';}}
function update(dt){frame++;const held=Number(!!player.left)+Number(!!player.right);let pull=0;if(player.left)pull+=player.left.y-player.y;if(player.right)pull+=player.right.y-player.y;
if(held){player.vy+=(pull/held-player.vy)*.095;player.vx+=(((player.left&&player.right)?(player.left.x+player.right.x)/2:player.left?player.left.x:player.right.x)-player.x)*.006;}else{player.vy+=.19;}
if(held){const autoClimb=player.left&&player.right?1.05:.72;player.vy=Math.min(player.vy,-autoClimb);}if(gyroEnabled){gyroValue+=(gyroRaw-gyroValue)*Math.min(1,.18*dt);player.vx+=gyroValue*.34*dt;}player.vx*=.94;player.vy*=.985;player.x+=player.vx*dt;player.y+=player.vy*dt;
player.x=Math.max(35,Math.min(W-35,player.x));
if(player.y<cameraY+H*.37){cameraY=player.y-H*.37;worldHeight=Math.max(worldHeight,-cameraY);}
if(player.y-cameraY>H+90){endGame();}
if(rocks.length&&Math.min(...rocks.map(r=>r.y))>cameraY-H*2)generateRocks();
particles=particles.filter(p=>p.life-->0);for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=.08;}
$('height').textContent=Math.floor(worldHeight/10)+' م';}
function drawRock(r){const y=worldToScreen(r.y);if(y<-60||y>H+60)return;ctx.save();ctx.translate(r.x,y);ctx.beginPath();ctx.moveTo(-r.w/2,r.h*.15);ctx.lineTo(-r.w*.35,-r.h*.45);ctx.lineTo(r.w*.05,-r.h*.62);ctx.lineTo(r.w*.48,-r.h*.22);ctx.lineTo(r.w/2,r.h*.35);ctx.lineTo(-r.w*.28,r.h*.45);ctx.closePath();const g=ctx.createLinearGradient(0,-r.h,0,r.h);g.addColorStop(0,'#d7b49a');g.addColorStop(.45,'#947b70');g.addColorStop(1,'#514c50');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#f1d4b3aa';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#ffffff20';ctx.fillRect(-r.w*.25,-r.h*.3,r.w*.25,3);ctx.restore();}
function drawLimb(x1,y1,x2,y2,width,color){ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo((x1+x2)/2+(x2-x1)*.12,(y1+y2)/2-10,x2,y2);ctx.strokeStyle='#2b2020';ctx.lineWidth=width+5;ctx.lineCap='round';ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function drawPlayer(){const x=player.x,y=worldToScreen(player.y),lx=player.left,rx=player.right;const leftX=lx?lx.x:x-48,leftY=lx?worldToScreen(lx.y):y-75;const rightX=rx?rx.x:x+48,rightY=rx?worldToScreen(rx.y):y-75;
// extra-long elastic arms
 drawLimb(x-10,y-24,leftX,leftY,13,'#c9855f');drawLimb(x+10,y-24,rightX,rightY,13,'#c9855f');
// hands
 for(const [hx,hy,active] of [[leftX,leftY,!!lx],[rightX,rightY,!!rx]]){ctx.fillStyle=active?'#ffd09a':'#d99570';ctx.beginPath();ctx.arc(hx,hy,10,0,Math.PI*2);ctx.fill();for(let i=0;i<4;i++){ctx.beginPath();ctx.roundRect(hx-7+i*4,hy-16,3,11,2);ctx.fill();}}
 // torso and legs
 ctx.strokeStyle='#17283a';ctx.lineWidth=19;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y-22);ctx.lineTo(x,y+22);ctx.stroke();ctx.strokeStyle='#e4a16f';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(x-5,y+15);ctx.lineTo(x-21,y+43);ctx.moveTo(x+5,y+15);ctx.lineTo(x+21,y+43);ctx.stroke();ctx.fillStyle='#d99570';ctx.beginPath();ctx.arc(x,y-39,15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#302a2a';ctx.beginPath();ctx.arc(x,y-44,15,Math.PI,Math.PI*2);ctx.fill();}
function draw(){ctx.clearRect(0,0,W,H);const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#172b43');sky.addColorStop(.55,'#8a6470');sky.addColorStop(1,'#e4a16f');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
// distant mountain silhouettes
for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W+30;x+=30){const yy=H*.38+j*65+Math.sin(x*.012+j*2)*42+Math.sin(x*.027+j)*17;ctx.lineTo(x,yy);}ctx.lineTo(W,H);ctx.closePath();ctx.fillStyle=['#33495c','#40505a','#66535a'][j];ctx.fill();}
// cliff face
ctx.beginPath();ctx.moveTo(W*.22,0);ctx.lineTo(W*.88,0);ctx.lineTo(W*.76,H);ctx.lineTo(W*.12,H);ctx.closePath();const cliff=ctx.createLinearGradient(0,0,W,H);cliff.addColorStop(0,'#75645d');cliff.addColorStop(.5,'#aa8975');cliff.addColorStop(1,'#51484a');ctx.fillStyle=cliff;ctx.fill();
// rock strata
ctx.strokeStyle='#e4c0a033';ctx.lineWidth=3;for(let i=0;i<16;i++){const yy=((i*115+cameraY*.3)% (H+100))-40;ctx.beginPath();ctx.moveTo(W*.17,yy);ctx.quadraticCurveTo(W*.5,yy+20,W*.84,yy-8);ctx.stroke();}
rocks.forEach(drawRock);drawPlayer();for(const p of particles){ctx.globalAlpha=p.life/25;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,worldToScreen(p.y),3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
}
function loop(t){if(!running)return;const dt=Math.min(2,(t-lastTime)/16.67||1);lastTime=t;update(dt);draw();if(running)requestAnimationFrame(loop);}
window.addEventListener('resize',resize);window.addEventListener('orientationchange',()=>setTimeout(resize,150));resize();draw();
})();
