"use strict";
(function(){
const KEY="shakestation-shifts-v1";
const goods=[
{id:"mint",name:"Mint Makeover",cost:30,icon:"🎨",detail:"Mint and cream restaurant colors.",kind:"theme"},
{id:"night",name:"Midnight Diner",cost:45,icon:"🌙",detail:"Cozy blue diner colors.",kind:"theme"},
{id:"neon",name:"Neon Sign",cost:25,icon:"💡",detail:"A glowing sign by the window.",kind:"decor"},
{id:"plants",name:"Fresh Plants",cost:20,icon:"🌿",detail:"Brighten the restaurant lobby.",kind:"decor"},
{id:"jukebox",name:"Retro Jukebox",cost:55,icon:"🎵",detail:"Improve tips by 10%.",kind:"upgrade"},
{id:"rack",name:"Bigger Patty Rack",cost:40,icon:"🍔",detail:"Store 10 cooked patties instead of 6.",kind:"upgrade"},
{id:"vip",name:"VIP Corner",cost:70,icon:"⭐",detail:"Earn 25% larger reviewer bonuses.",kind:"upgrade"}
];
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){}
const owned=new Set(Array.isArray(saved.owned)?saved.owned:[]);
let theme=["mint","night"].includes(saved.theme)?saved.theme:"pink";
let day=Math.max(1,Number(saved.day)||1),rep=Number.isFinite(Number(saved.rep))?Math.max(0,Math.min(100,Number(saved.rep))):50;
cash=Math.max(0,Number(saved.cash)||0);served=Math.max(0,Number(saved.served)||0);
let taken=0,servedToday=0,dayRevenue=0,reviews=[],shiftOpen=true,modal=null,topSelected=null,skipTopClick=false;
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const quota=()=>6+clamp(Math.floor((rep-50)/18),0,3);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({day,rep,cash,served,theme,owned:[...owned]}))}catch(e){}};
const overlay=document.createElement("div");overlay.id="stationOverlay";overlay.className="station-overlay";overlay.hidden=true;document.body.append(overlay);
const shopButton=document.createElement("button");shopButton.id="shopToggle";shopButton.className="shop-button";shopButton.textContent="🛍 SHOP";
$("#shiftLabel").after(shopButton);shopButton.addEventListener("click",()=>showShop());
const stat=document.createElement("div");stat.className="rep-stat";stat.innerHTML="<small>REPUTATION</small><b id='reputationScore'>50 ★</b>";$("#cash").parentElement.before(stat);
const notice=document.createElement("div");notice.id="specialNotice";notice.className="special-notice";notice.hidden=true;$(".restaurant-scene").append(notice);
function applyDecor(){
document.body.classList.remove("theme-mint","theme-night");
if(theme!=="pink")document.body.classList.add("theme-"+theme);
const scene=$(".restaurant-scene");
for(const id of ["neon","plants","jukebox","vip"])scene.classList.toggle("has-"+id,owned.has(id));
renderCookedRack();
}
function status(){
$("#cash").textContent="$"+cash.toFixed(2);$("#served").textContent=served;
$("#reputationScore").textContent=Math.round(rep)+" ★";
$("#shiftLabel").textContent="DAY "+day+" · "+(shiftOpen?"ORDERS "+taken+"/"+quota():"SHIFT COMPLETE ✓");
$("#goalBar").style.width=Math.min(100,dayRevenue/75*100)+"%";
$("#goalBar").classList.toggle("complete",dayRevenue>=75);
$("#goalMessage").textContent=dayRevenue>=75?"Daily earnings goal reached!":"Shift earnings: $"+dayRevenue.toFixed(2)+" / $75.00";
}
function show(markup,type){
modal=type;overlay.hidden=false;
overlay.innerHTML='<div class="modal-backdrop"><section class="station-modal" role="dialog" aria-modal="true">'+markup+"</section></div>";
}
function close(){overlay.hidden=true;overlay.innerHTML="";modal=null}
function back(){shiftOpen?close():report()}
function showShop(){
show('<header class="modal-heading"><div><small>RESTAURANT SHOP</small><h2>Make ShakeStation yours</h2><p>Everything you buy stays saved on this browser.</p></div><button id="closeShop" aria-label="Close" class="modal-x">✕</button></header>'+
'<div class="wallet">💵 BALANCE · $'+cash.toFixed(2)+'</div><div class="shop-grid">'+goods.map(g=>{
const bought=owned.has(g.id),equip=g.kind==="theme"&&theme===g.id;
return '<article class="shop-item"><div class="shop-icon">'+g.icon+'</div><strong>'+g.name+'</strong><p>'+g.detail+'</p><button data-buy="'+g.id+'" '+(cash<g.cost&&!bought?"disabled":"")+'>'+(equip?"EQUIPPED":bought?(g.kind==="theme"?"EQUIP":"OWNED"):"BUY · $"+g.cost)+'</button></article>';
}).join("")+'</div><footer class="modal-footer"><button id="exitShop">'+(shiftOpen?"BACK TO KITCHEN":"DAY REPORT")+'</button></footer>',"shop");
$("#closeShop").addEventListener("click",back);$("#exitShop").addEventListener("click",back);
overlay.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>{
const g=goods.find(x=>x.id===btn.dataset.buy);if(!g)return;
if(!owned.has(g.id)){if(cash<g.cost)return;cash-=g.cost;owned.add(g.id);playSfx("ding")}
if(g.kind==="theme")theme=g.id;
save();applyDecor();status();showShop();
}));
}
function report(){
const avg=reviews.length?Math.round(reviews.reduce((sum,x)=>sum+x.score,0)/reviews.length):0;
show('<header class="modal-heading"><div><small>SHIFT COMPLETE</small><h2>Day '+day+' wrapped! 🎉</h2><p>You made it through another shift.</p></div></header>'+
'<div class="report-grid"><div><small>EARNED</small><strong>$'+dayRevenue.toFixed(2)+'</strong></div><div><small>SERVED</small><strong>'+servedToday+'</strong></div><div><small>ORDER QUALITY</small><strong>'+avg+'%</strong></div><div><small>REPUTATION</small><strong>'+Math.round(rep)+' ★</strong></div></div>'+
'<section class="reviews"><b>LOCAL BUZZ</b>'+(reviews.filter(r=>r.special).map(r=>'<p>'+r.message+'</p>').join("")||'<p>No influencers or critics this shift.</p>')+'</section>'+
'<footer class="modal-footer"><button id="endShop">🛍 SPEND EARNINGS</button><button class="primary-next" id="nextShift">START DAY '+(day+1)+' →</button></footer>',"report");
$("#endShop").addEventListener("click",showShop);
$("#nextShift").addEventListener("click",()=>{
day++;taken=0;servedToday=0;dayRevenue=0;reviews=[];shiftOpen=true;
save();status();close();setStation("order");spawnCustomer();
});
}
function finishShift(){if(!shiftOpen)return;shiftOpen=false;save();status();setTimeout(report,350)}
function specialNotice(o){
if(!o?.special){notice.hidden=true;return}
notice.hidden=false;
notice.textContent=o.special==="critic"?"📝 FOOD CRITIC · This review affects your reputation!":"📸 INFLUENCER · A great meal brings more customers!";
}
window.ShakeStationExpansion={
decorateOrder(o){const n=Math.random();o.special=n<.12?"critic":n<.25?"influencer":null;return o},
canSpawn(){return shiftOpen&&taken<quota()},
orderTaken(o){taken++;specialNotice(null);status()},
customerArrived(o){specialNotice(o)},
stationChanged(id){if(id==="order")specialNotice(currentCustomer)},
rackCapacity(){return owned.has("rack")?10:6},
served(o,score,earned){
servedToday++;let bonus=0,message="",delta=0;
if(o.special){
const good=score>=(o.special==="critic"?90:85);
delta=good?(o.special==="critic"?12:15):(score<70?-12:-5);
bonus=good?(o.special==="critic"?6:8):0;
if(owned.has("vip"))bonus=Math.round(bonus*1.25*100)/100;
rep=clamp(rep+delta,0,100);
message=(good?"🌟 ":"⚠️ ")+(o.special==="critic"?"Critic":"Influencer")+" · "+score+"% · REP "+(delta>=0?"+":"")+delta+(bonus?" · +$"+bonus.toFixed(2):"");
$("#scoreResult").textContent+=" · "+message;
}
if(owned.has("jukebox"))bonus+=Math.round(earned*.10*100)/100;
cash+=bonus;dayRevenue+=earned+bonus;reviews.push({score,special:o.special,message});
save();status();
},
afterServe(){if(taken>=quota()&&orders.length===0)finishShift()}
};
applyDecor();status();

// Drag the cup horizontally and shake to mix, instead of relying on a button alone.
const cup=$("#shakeCup");
cup.addEventListener("pointerdown",e=>{
if(e.button!==0)return;
const build=getBuild();if(!build?.shake?.size)return;
e.preventDefault();stopHold();
const id=selectedId,x=e.clientX,y=e.clientY;let last=x,changed=false;
cup.classList.add("hand-shaking");
function move(ev){
if(id!==selectedId){done();return}
const dx=clamp(ev.clientX-x,-70,70),dy=clamp(ev.clientY-y,-35,35);
cup.style.translate=dx+"px "+dy+"px";
const distance=Math.abs(ev.clientX-last);last=ev.clientX;
if(distance>2&&build.shake.baseAmount>=20){
build.shake.stir=clamp(build.shake.stir+distance*.14,0,100);
renderShakeVisual();changed=true;
}
}
function done(){
window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",done);window.removeEventListener("pointercancel",done);
cup.classList.remove("hand-shaking");cup.style.translate="0px 0px";
if(changed){playSfx("pop");updateBuildSummary();renderTickets()}
}
window.addEventListener("pointermove",move);window.addEventListener("pointerup",done);window.addEventListener("pointercancel",done);
});

// Shake toppings are chosen, then placed on the cup; dragging works on touch too.
const toppingButtons=[...document.querySelectorAll("[data-topping]")];
function putTopping(t){
const b=getBuild(),o=orders.find(x=>x.id===selectedId);if(!o?.shake||!b?.shake?.base)return false;
const list=b.shake.toppings,at=list.indexOf(t);
if(at>=0)list.splice(at,1);else list.push(t);
playSfx("pop");renderShakeVisual();renderTickets();updateBuildSummary();return true;
}
function unselect(){topSelected=null;toppingButtons.forEach(b=>b.classList.remove("selected-ingredient"))}
toppingButtons.forEach(btn=>{
btn.addEventListener("click",e=>{
if(skipTopClick){skipTopClick=false;e.preventDefault();return}
topSelected=btn.dataset.topping;toppingButtons.forEach(b=>b.classList.toggle("selected-ingredient",b===btn));
});
btn.addEventListener("pointerdown",e=>{
if(e.button!==0)return;
const x=e.clientX,y=e.clientY;let ghost=null;
function move(ev){
if(!ghost&&Math.hypot(ev.clientX-x,ev.clientY-y)>9){
ghost=document.createElement("div");ghost.className="ingredient-ghost";ghost.textContent=btn.textContent;document.body.append(ghost);
}
if(ghost){ghost.style.left=ev.clientX+"px";ghost.style.top=ev.clientY+"px"}
}
function done(ev){
window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",done);window.removeEventListener("pointercancel",done);
if(ghost){
ghost.remove();skipTopClick=true;
for(const target of [$("#finishCup"),cup]){
const r=target.getBoundingClientRect();
if(ev.clientX>=r.left-15&&ev.clientX<=r.right+15&&ev.clientY>=r.top-15&&ev.clientY<=r.bottom+15){
putTopping(btn.dataset.topping);unselect();break;
}
}
}
}
window.addEventListener("pointermove",move);window.addEventListener("pointerup",done);window.addEventListener("pointercancel",done);
});
});
[$("#finishCup"),cup].forEach(el=>el.addEventListener("click",()=>{if(topSelected&&putTopping(topSelected))unselect()}));
const oldSpawn=spawnCustomer;
spawnCustomer=function(){oldSpawn();if(currentCustomer)specialNotice(currentCustomer)};
})();