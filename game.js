// ---- DATA: edit this to add characters. Replace emoji with image paths later. ----
let CHARS=[];
const RATES={5:0.03,4:0.17,3:0.80}, PITY_MAX=30, COST=10, PER_SEC=1, OFFLINE_CAP=8*3600;
const COLOR={3:"var(--r3)",4:"var(--r4)",5:"var(--r5)"};

// ---- SAVE / LOAD ----
const KEY="lantern-save-v1";
let S={gems:50,pity:0,owned:{},last:Date.now()};
try{const raw=localStorage.getItem(KEY);if(raw)S=Object.assign(S,JSON.parse(raw))}catch(e){}
function save(){S.last=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

// ---- IDLE INCOME ----
function tickIdle(){
  const now=Date.now(), secs=Math.min((now-S.last)/1000,OFFLINE_CAP);
  S.gems+=secs*PER_SEC; S.last=now;
}

// ---- PULL LOGIC ----
function rollRarity(){
  if(S.pity>=PITY_MAX-1) return 5;
  const x=Math.random();
  if(x<RATES[5]) return 5;
  if(x<RATES[5]+RATES[4]) return 4;
  return 3;
}
function pullOnce(){
  const r=rollRarity();
  S.pity = r===5 ? 0 : S.pity+1;
  const pool=CHARS.filter(c=>c.r===r);
  const c=pool[Math.floor(Math.random()*pool.length)];
  S.owned[c.id]=(S.owned[c.id]||0)+1;
  return c;
}
function doPull(n){
  const cost=COST*n;
  if(S.gems<cost) return;
  S.gems-=cost;
  const got=[];for(let i=0;i<n;i++)got.push(pullOnce());
  const best=got.reduce((a,b)=>b.r>a.r?b:a);
  const el=document.getElementById("result");
  el.innerHTML=`<div class="pop">${n===1?best.icon:got.map(g=>g.icon).join("")}<span class="n" style="color:${COLOR[best.r]}">${n===1?best.name+" "+"★".repeat(best.r):"Best: "+best.name+" "+"★".repeat(best.r)}</span></div>`;
  el.style.fontSize=n===1?"56px":"28px";
  save();render();
}

// ---- RENDER ----
function render(){
  document.getElementById("gems").textContent=Math.floor(S.gems);
  document.getElementById("pity").textContent=S.pity;
  document.getElementById("pull").disabled=S.gems<COST;
  document.getElementById("pull10").disabled=S.gems<COST*10;
  const owned=CHARS.filter(c=>S.owned[c.id]).length;
  document.getElementById("count").textContent=`${owned}/${CHARS.length}`;
  document.getElementById("grid").innerHTML=CHARS.slice().sort((a,b)=>b.r-a.r).map(c=>{
    const n=S.owned[c.id]||0;
    return `<div class="card ${n?"":"off"}" style="--c:${COLOR[c.r]}">${n?c.icon:"?"}<small>${n?c.name+(n>1?" ×"+n:""):"???"}</small></div>`}).join("");
}

document.getElementById("pull").onclick=()=>doPull(1);
document.getElementById("pull10").onclick=()=>doPull(10);
document.getElementById("reset").onclick=()=>{if(confirm("Delete your save?")){try{localStorage.removeItem(KEY)}catch(e){}location.reload()}};
document.addEventListener("visibilitychange",()=>{if(!document.hidden){tickIdle();render()}else save()});
tickIdle();render();
// setInterval(()=>{tickIdle();save();render()},1000);
fetch("assets/characters.json")
  .then(r => r.json())
  .then(data => {
    CHARS = data;
    tickIdle(); render();
    setInterval(() => { tickIdle(); save(); render(); }, 1000);
  });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");