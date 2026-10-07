const stationMeta={
  order:["FRONT COUNTER","Order Station","Customers walk in, tell you what they want, and their ticket joins the queue."],
  grill:["COOK LINE","Grill Station","Cook burger patties carefully. Pull them in the green window before they burn."],
  burger:["BUILD LINE","Burger Station","Stack the cooked patty and toppings in the same order the customer requested."],
  shake:["DRINK LINE","Shake Station","Hold a flavor to pour it, stir the cup, then hold a syrup to drizzle it in."],
  finish:["FINISH LINE","Finish Station","Add visible toppings to the shake and check the whole order before serving."],
  serve:["PICKUP COUNTER","Serve Station","Match your finished food to the ticket and serve it for a score and tip."]
};

const names=["Maya","Theo","Lena","Devin","Nora","Miles","Avery","Jules","Sam","Riley"];
const burgerOptions=["cheese","lettuce","tomato","onion","pickles","ketchup"];
const shakeToppings=["whipped","sprinkles","cookie","strawberries","cherry"];
const bases=["vanilla","chocolate","strawberry"];
const syrups=["chocolate","strawberry","caramel"];
const sizes=["S","M","L"];
const skinTones=["#f3c8a6","#e6ad83","#c9845f","#9b6045","#704633","#4f3329"];
const hairColors=["#3d2926","#604135","#a96d35","#2f2528","#7d553c","#d0a160"];
const shirtColors=["#71c8e8","#ef78a9","#78bd78","#f0a451","#8e82dc","#5ab7a2"];
const hairStyles=["hair-1","hair-2","hair-3","hair-4"];

let orders=[];
let selectedId=null;
let nextId=1;
let currentCustomer=null;
let cash=0;
let served=0;
const builds={};
let activeHold=null;
let audio=null;
let loopSound=null;
const MAX_OPEN_ORDERS=4;
const cookedPatties=[];
let pendingIngredient=null;
let pattySerial=0;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function rand(arr){return arr[Math.floor(Math.random()*arr.length)]}
function sample(arr,min,max){
  const copy=[...arr].sort(()=>Math.random()-.5);
  const count=min+Math.floor(Math.random()*(max-min+1));
  return copy.slice(0,count);
}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

function getAudio(){
  if(!audio){
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return null;
    audio=new Ctx();
  }
  if(audio.state==="suspended") audio.resume();
  return audio;
}

document.addEventListener("pointerdown",()=>getAudio(),{once:true});

function tone(freq=440,duration=.08,type="sine",volume=.04,slide=0){
  const ctx=getAudio(); if(!ctx)return;
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(freq,ctx.currentTime);
  if(slide) osc.frequency.linearRampToValueAtTime(freq+slide,ctx.currentTime+duration);
  gain.gain.setValueAtTime(volume,ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime+duration);
}

function playSfx(name){
  if(name==="door"){tone(660,.07,"sine",.035,100);setTimeout(()=>tone(900,.1,"sine",.03,-80),65)}
  if(name==="ticket"){tone(1050,.04,"square",.025,-150);setTimeout(()=>tone(760,.05,"square",.018,80),50)}
  if(name==="pop"){tone(520,.06,"triangle",.025,140)}
  if(name==="grill"){tone(150,.1,"sawtooth",.025,-30)}
  if(name==="ding"){tone(880,.12,"sine",.04,180);setTimeout(()=>tone(1180,.16,"sine",.03,0),110)}
}

function startLoop(kind){
  stopLoop();
  const ctx=getAudio(); if(!ctx)return;
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  osc.type=kind==="stir"?"sawtooth":"triangle";
  osc.frequency.value=kind==="stir"?85:kind==="syrup"?220:165;
  gain.gain.value=kind==="stir"?.018:.014;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  loopSound={osc,gain};
}
function stopLoop(){
  if(!loopSound)return;
  try{loopSound.gain.gain.setTargetAtTime(.0001,getAudio().currentTime,.02);loopSound.osc.stop(getAudio().currentTime+.08)}catch(e){}
  loopSound=null;
}

function makeAppearance(){
  return{
    skin:rand(skinTones),
    hair:rand(hairColors),
    shirt:rand(shirtColors),
    style:rand(hairStyles)
  };
}

function makeOrder(){
  const roll=Math.random();
  const type=roll<.36?"shake":roll<.70?"burger":"combo";
  const order={id:nextId++,name:rand(names),type,burger:null,shake:null,appearance:makeAppearance()};
  if(type!=="shake") order.burger={toppings:sample(burgerOptions,2,4)};
  if(type!=="burger"){
    order.shake={
      size:rand(sizes),
      base:rand(bases),
      syrup:rand(syrups),
      toppings:sample(shakeToppings,1,3)
    };
  }
  return window.ShakeStationExpansion?.decorateOrder(order)||order;
}

function orderSentence(o){
  const pieces=[];
  if(o.burger) pieces.push("a burger with "+o.burger.toppings.map(cap).join(", "));
  if(o.shake) pieces.push(`a ${o.shake.size} ${o.shake.base} shake with ${o.shake.syrup} syrup and ${o.shake.toppings.map(cap).join(", ")}`);
  return pieces.join(" and ");
}

function ticketLines(o){
  const lines=[];
  if(o.burger) lines.push("Burger: "+o.burger.toppings.map(cap).join(" · "));
  if(o.shake) lines.push(`Shake: ${o.shake.size} · ${cap(o.shake.base)} · ${cap(o.shake.syrup)} · ${o.shake.toppings.map(cap).join(" · ")}`);
  return lines.join("\n");
}

function blankBuild(){
  return{
    burger:[],
    pattyItem:null,
    pattyQuality:null,
    pattyScore:null,
    shake:{size:null,base:null,baseAmount:0,stir:0,syrup:null,syrupAmount:0,toppings:[]}
  };
}

function setStation(id){
  stopHold();
  $(".station").forEach(b=>b.classList.toggle("active",b.dataset.station===id));
  $$(".station-view").forEach(v=>v.classList.toggle("active",v.id==="view-"+id));
  const meta=stationMeta[id];
  $("#stationKicker").textContent=meta[0];
  $("#stationTitle").textContent=meta[1];
  $("#stationHelp").textContent=meta[2];
  updateBuildSummary();
  renderShakeVisual();
  window.ShakeStationExpansion?.stationChanged(id);
}
$(".station").forEach(b=>b.addEventListener("click",()=>setStation(b.dataset.station)));

function setCustomerAppearance(order){
  const el=$("#customer");
  hairStyles.forEach(x=>el.classList.remove(x));
  if(!order)return;
  const a=order.appearance;
  el.classList.add(a.style);
  el.style.setProperty("--skin",a.skin);
  el.style.setProperty("--hair",a.hair);
  el.style.setProperty("--shirt",a.shirt);
}

function avatarMarkup(order,mini=false){
  const a=order.appearance;
  if(mini){
    return `<div class="mini-avatar" style="--skin:${a.skin};--hair:${a.hair};--shirt:${a.shirt}">
      <div class="m-head"><span class="m-hair"></span></div><div class="m-body"></div>
    </div>`;
  }
  return `<div class="waiting-sprite" style="--skin:${a.skin};--hair:${a.hair};--shirt:${a.shirt}">
    <div class="w-head"><span class="w-hair"></span><i class="w-eye l"></i><i class="w-eye r"></i></div><div class="w-body"></div>
  </div>`;
}

function spawnCustomer(){
  if(currentCustomer||orders.length>=MAX_OPEN_ORDERS||window.ShakeStationExpansion?.canSpawn()===false)return;
  currentCustomer=makeOrder();
  setCustomerAppearance(currentCustomer);
  $("#customerName").textContent=currentCustomer.name;
  $("#orderText").textContent="Customer is ready to order.";
  $("#speech").textContent="Hi! Can I order "+orderSentence(currentCustomer)+"?";
  $("#takeOrder").disabled=false;
  $("#customer").classList.remove("walk-in");
  $("#speech").classList.remove("show");
  requestAnimationFrame(()=>{
    $("#customer").classList.add("walk-in");
    setTimeout(()=>{$("#speech").classList.add("show");playSfx("door")},580);
  });
  renderQueue();
}

function takeOrder(){
  if(!currentCustomer||orders.length>=MAX_OPEN_ORDERS)return;
  stopHold();
  clearIngredient();
  const o=currentCustomer;
  orders.push(o);
  builds[o.id]=blankBuild();
  window.ShakeStationExpansion?.orderTaken(o);
  $("#scoreResult").textContent="";
  selectedId=o.id;
  currentCustomer=null;
  playSfx("ticket");
  $("#speech").classList.remove("show");
  $("#customer").classList.remove("walk-in");
  $("#customerName").textContent="Waiting...";
  $("#orderText").textContent="Next customer is on the way.";
  $("#takeOrder").disabled=true;
  renderTickets();
  renderQueue();
  updateBuildSummary();
  renderShakeVisual();
  if(orders.length<MAX_OPEN_ORDERS)setTimeout(spawnCustomer,1700);
}
$("#takeOrder").addEventListener("click",takeOrder);

function renderTickets(){
  const wrap=$("#tickets");
  wrap.innerHTML="";
  orders.forEach(o=>{
    const b=document.createElement("button");
    b.className="ticket"+(o.id===selectedId?" active":"");
    const phase=buildProgress(o,builds[o.id]);
    b.innerHTML=`<b>#${String(o.id).padStart(2,"0")} · ${o.name}${o.special?` <em class="special-tag">${o.special==="critic"?"★ CRITIC":"✦ INFLUENCER"}</em>`:""}</b><span class="ticket-phase ${phase==="READY"?"ready":""}">${phase}</span><span>${o.type.toUpperCase()}</span><span>${ticketLines(o).replace(/\n/g,"<br>")}</span>`;
    b.addEventListener("click",()=>{
      stopHold();
      clearIngredient();
      selectedId=o.id;
      renderTickets();
      updateBuildSummary();
      renderShakeVisual();
    });
    wrap.appendChild(b);
  });
  $("#ticketCount").textContent=orders.length;
}

function renderQueue(){
  const q=$("#queue");
  q.innerHTML="";
  const floor=$("#lobbyWaiting");
  floor.innerHTML="";

  if(currentCustomer){
    const d=document.createElement("div");
    d.className="queue-person";
    d.innerHTML=avatarMarkup(currentCustomer,true)+`<span>${currentCustomer.name}<br><small>At counter</small></span>`;
    q.appendChild(d);
  }

  orders.slice(0,4).forEach(o=>{
    const d=document.createElement("div");
    d.className="queue-person";
    d.innerHTML=avatarMarkup(o,true)+`<span>${o.name}<br><small>Waiting on order</small></span>`;
    q.appendChild(d);
  });

  orders.slice(0,3).forEach(o=>{
    floor.insertAdjacentHTML("beforeend",avatarMarkup(o,false));
  });

  $("#queueCount").textContent=(currentCustomer?1:0)+orders.length;
}

function getBuild(){return selectedId?builds[selectedId]:null}

function missingSteps(o,b){
  if(!o||!b)return ["Choose an order ticket"];
  const missing=[];
  if(o.burger){
    if(b.pattyQuality===null)missing.push("Take a cooked patty from the rack");
    if(!b.burger.includes("patty"))missing.push("Add the patty");
    if(!b.burger.includes("topbun"))missing.push("Finish the burger");
  }
  if(o.shake){
    if(!b.shake.size)missing.push("Pick a cup size");
    if(!b.shake.base||b.shake.baseAmount<60)missing.push("Pour the shake to 60%");
    if(b.shake.stir<45)missing.push("Stir to 45%");
    if(!b.shake.syrup||b.shake.syrupAmount<15)missing.push("Add syrup");
    if(!b.shake.toppings.length)missing.push("Add toppings");
  }
  return missing;
}

function buildProgress(o,b){
  if(!missingSteps(o,b).length)return "READY";
  if(!b)return "NEW";
  const s=b.shake;
  return b.pattyQuality||b.burger.length||s.size||s.baseAmount||s.stir||s.syrupAmount||s.toppings.length?"IN PROGRESS":"NEW";
}
function updateOrderGuide(){
  const o=orders.find(x=>x.id===selectedId);
  const missing=missingSteps(o,getBuild());
  $("#activeTicketLabel").textContent=o?`#${String(o.id).padStart(2,"0")} · ${o.name}`:"NO TICKET SELECTED";
  $("#activeTicketSteps").textContent=!o?"Take a customer order to start cooking.":missing.length?"NEXT: "+missing.slice(0,3).join(" · "):"READY TO SERVE ✓";
  $("#serveOrder").disabled=missing.length>0;
  $("#serveHint").textContent=!o?"Pick an order ticket first.":missing.length?"Still needed: "+missing.join(" · "):"Everything is on the tray. Serve when you're happy with it!";
}

const slots=$(".patty-slot");
function rackCapacity(){return window.ShakeStationExpansion?.rackCapacity()||6}
function renderCookedRack(){
  ["#grillRack","#burgerRack"].forEach(sel=>{
    const rack=$(sel);if(!rack)return;
    rack.innerHTML="";
    if(!cookedPatties.length){
      const empty=document.createElement("span");
      empty.className="rack-empty";
      empty.textContent="No patties yet · cook some on the grill!";
      rack.appendChild(empty);
    }
    cookedPatties.forEach((p,i)=>{
      const btn=document.createElement("button");
      btn.type="button";
      btn.className="rack-patty "+p.quality;
      btn.dataset.patty=String(p.id);
      btn.textContent=`🍔 ${p.quality.toUpperCase()} · ${p.score}%`;
      btn.title="Drag onto the burger, or tap and then tap the burger";
      btn.addEventListener("pointerdown",ingredientPointerStart);
      btn.addEventListener("click",()=>selectIngredient({type:"patty",pattyId:p.id}));
      rack.appendChild(btn);
    });
  });
  $("#rackCount").textContent=`${cookedPatties.length}/${rackCapacity()}`;
}
function returnPatty(build){
  if(!build?.pattyItem)return;
  cookedPatties.unshift(build.pattyItem);
  build.pattyItem=null;
  build.pattyScore=null;
  build.pattyQuality=null;
  renderCookedRack();
}
function placeIngredient(kind,pattyId=null){
  const o=orders.find(x=>x.id===selectedId),b=getBuild();
  if(!o?.burger||!b)return false;
  if(kind==="patty"){
    if(b.burger.includes("patty")||b.burger.includes("topbun"))return false;
    const index=pattyId===null?0:cookedPatties.findIndex(x=>x.id===pattyId);
    if(index<0||!cookedPatties.length)return false;
    const p=cookedPatties.splice(index,1)[0];
    b.pattyItem=p;b.pattyQuality=p.quality;b.pattyScore=p.score;
    renderCookedRack();
  }
  if(b.burger.includes("topbun"))return false;
  b.burger.push(kind);playSfx("pop");
  renderBurger();renderTickets();updateBuildSummary();
  return true;
}
function selectIngredient(ingredient){
  pendingIngredient=ingredient;
  $(".ingredient-tray button,.rack-patty").forEach(el=>el.classList.toggle("selected-ingredient",ingredient.type==="patty"?el.dataset.patty===String(ingredient.pattyId):el.dataset.burger===ingredient.type));
  $("#burgerHint").textContent=`Place ${ingredient.type==="patty"?"cooked patty":cap(ingredient.type)} onto the burger →`;
}
function clearIngredient(){
  pendingIngredient=null;
  $(".selected-ingredient").forEach(el=>el.classList.remove("selected-ingredient"));
  $("#burgerHint").textContent="Drag ingredients onto the burger or tap an ingredient, then tap the bun.";
}
function ingredientPointerStart(e){
  if(e.button!==0)return;
  const source=e.currentTarget;
  const ingredient=source.dataset.patty?{type:"patty",pattyId:Number(source.dataset.patty)}:{type:source.dataset.burger};
  const startX=e.clientX,startY=e.clientY;
  let ghost=null;
  function move(ev){
    if(!ghost&&Math.hypot(ev.clientX-startX,ev.clientY-startY)>8){
      ghost=document.createElement("div");
      ghost.className="ingredient-ghost";ghost.textContent=source.textContent.trim();
      document.body.appendChild(ghost);
    }
    if(ghost){ghost.style.left=ev.clientX+"px";ghost.style.top=ev.clientY+"px"}
  }
  function finish(ev){
    window.removeEventListener("pointermove",move);
    window.removeEventListener("pointerup",finish);
    window.removeEventListener("pointercancel",finish);
    if(ghost){
      ghost.remove();
      const drop=$("#burgerStack").getBoundingClientRect();
      if(ev.clientX>=drop.left-45&&ev.clientX<=drop.right+45&&ev.clientY>=drop.top-45&&ev.clientY<=drop.bottom+45){
        if(placeIngredient(ingredient.type,ingredient.pattyId??null))clearIngredient();
      }
    }
  }
  window.addEventListener("pointermove",move);
  window.addEventListener("pointerup",finish,{once:true});
  window.addEventListener("pointercancel",finish,{once:true});
}

function pattyState(el){
  const start=Number(el.dataset.start||0);
  if(!start)return;

  const secs=(Date.now()-start)/1000;
  const progress=Math.min(100,(secs/14)*100);
  const marker=el.querySelector(".cook-marker");
  const label=el.querySelector(".patty-label");

  marker.style.left=progress+"%";
  el.classList.toggle("good",secs>=6&&secs<11);
  el.classList.toggle("burnt",secs>=11);

  if(secs>=11) label.textContent="BURNT";
  else if(secs>=6) label.textContent="READY";
  else label.textContent="COOKING";
}
setInterval(()=>slots.forEach(pattyState),250);

slots.forEach(el=>el.addEventListener("click",()=>{
  if(!el.dataset.start){
    if(!orders.some(o=>o.burger)||cookedPatties.length>=rackCapacity())return;
    el.dataset.start=Date.now();
    el.classList.add("cooking");
    el.querySelector(".patty-label").textContent="COOKING";
    el.querySelector(".cook-marker").style.left="0%";
    playSfx("grill");
  }else{
    if(cookedPatties.length>=rackCapacity()){
      $("#stationHelp").textContent="The holding rack is full. Use some patties before lifting another.";
      return;
    }
    const secs=(Date.now()-Number(el.dataset.start))/1000;
    const distance=Math.abs(secs-8.5);
    const score=Math.max(0,Math.round(100-(distance*18)));
    const quality=secs<6?"undercooked":secs<11?"good":"burnt";
    cookedPatties.push({id:++pattySerial,score,quality});
    el.dataset.start="";
    el.className="patty-slot";
    el.querySelector(".patty-label").textContent="+";
    el.querySelector(".cook-marker").style.left="0%";
    playSfx("pop");
    renderCookedRack();
    updateBuildSummary();renderTickets();
    $("#stationHelp").textContent=`Patty on holding rack (${cookedPatties.length}/${rackCapacity()}). Keep cooking or start assembling!`;
  }
}));

function renderBurger(){
  const build=getBuild();
  const stack=$("#burgerStack");
  stack.innerHTML='<div class="bun bottom"></div>';
  if(!build)return;
  build.burger.forEach(x=>{
    const layer=document.createElement("div");
    layer.className="layer "+x;
    stack.appendChild(layer);
  });
}

$("[data-burger]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    selectIngredient({type:btn.dataset.burger});
  });
  btn.addEventListener("pointerdown",ingredientPointerStart);
  btn.addEventListener("keydown",e=>{
    if(e.key==="Enter"&&placeIngredient(btn.dataset.burger))clearIngredient();
  });
});
$("#burgerStack").addEventListener("click",()=>{
  if(pendingIngredient&&placeIngredient(pendingIngredient.type,pendingIngredient.pattyId??null))clearIngredient();
});
$("#burgerStack").addEventListener("keydown",e=>{
  if((e.key==="Enter"||e.key===" ")&&pendingIngredient){e.preventDefault();if(placeIngredient(pendingIngredient.type,pendingIngredient.pattyId??null))clearIngredient()}
});
$("#clearBurger").addEventListener("click",()=>{
  const build=getBuild(); if(!build)return;
  returnPatty(build);
  build.burger=[];clearIngredient();
  renderBurger();renderTickets();updateBuildSummary();
});
$("#undoBurger").addEventListener("click",()=>{
  const build=getBuild(); if(!build||!build.burger.length)return;
  const removed=build.burger.pop();
  if(removed==="patty")returnPatty(build);
  playSfx("pop");
  renderBurger();renderTickets();updateBuildSummary();
});

const baseColors={vanilla:"#f0dfae",chocolate:"#7b4d35",strawberry:"#e98caa"};
const syrupColors={
  chocolate:"repeating-linear-gradient(110deg,#6d412f 0 7px,#0000 7px 18px)",
  strawberry:"repeating-linear-gradient(110deg,#c94361 0 7px,#0000 7px 18px)",
  caramel:"repeating-linear-gradient(110deg,#c98237 0 7px,#0000 7px 18px)"
};

function beginHold(kind,value,button){
  const build=getBuild(); if(!build)return;
  if(kind==="syrup"&&!build.shake.base){
    $("#stationHelp").textContent="Pour a shake base before adding syrup.";
    return;
  }
  if(!build.shake.size){
    $("#stationHelp").textContent="Choose a cup size before pouring the shake.";
    return;
  }
  stopHold();
  button.classList.add("holding");
  if(kind==="base"){
    build.shake.base=value;
    $("#pourStream").style.background=baseColors[value];
    $("#pourStream").classList.add("active");
    startLoop("pour");
  }else if(kind==="syrup"){
    if(!build.shake.base)return;
    build.shake.syrup=value;
    startLoop("syrup");
  }
  const pourRates={S:3.0,M:2.1,L:1.55};
  const orderId=selectedId;
  activeHold={kind,value,button,orderId,timer:setInterval(()=>{
    const b=builds[orderId];
    if(!b||selectedId!==orderId){stopHold();return;}
    if(kind==="base"){
      b.shake.base=value;
      b.shake.baseAmount=Math.min(100,b.shake.baseAmount+pourRates[b.shake.size]);
    }else{
      b.shake.syrup=value;
      b.shake.syrupAmount=Math.min(100,b.shake.syrupAmount+2.5);
    }
    renderShakeVisual();
  },45)};
}

function stopHold(){
  if(!activeHold)return;
  clearInterval(activeHold.timer);
  activeHold.button.classList.remove("holding");
  $("#pourStream").classList.remove("active");
  $("#shakeCup").classList.remove("stirring");
  $("#shakeSwirl").style.opacity="0";
  stopLoop();
  activeHold=null;
  updateBuildSummary();
  renderTickets();
}

$$("[data-size]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const build=getBuild(); if(!build)return;
    build.shake.size=btn.dataset.size;
    playSfx("pop");
    renderShakeVisual();
    updateBuildSummary();
  });
});

$$("[data-base]").forEach(btn=>{
  btn.addEventListener("pointerdown",e=>{e.preventDefault();beginHold("base",btn.dataset.base,btn)});
});
$$("[data-syrup]").forEach(btn=>{
  btn.addEventListener("pointerdown",e=>{e.preventDefault();beginHold("syrup",btn.dataset.syrup,btn)});
});
window.addEventListener("pointerup",stopHold);
window.addEventListener("pointercancel",stopHold);
window.addEventListener("blur",stopHold);
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopHold()});
$("[data-base],[data-syrup],#stirButton").forEach(btn=>{
  btn.addEventListener("keydown",e=>{
    if((e.key===" "||e.key==="Enter")&&!e.repeat){
      e.preventDefault();
      if(btn.id==="stirButton")beginStir();
      else beginHold(btn.dataset.base?"base":"syrup",btn.dataset.base||btn.dataset.syrup,btn);
    }
  });
  btn.addEventListener("keyup",e=>{
    if(e.key===" "||e.key==="Enter"){e.preventDefault();stopHold()}
  });
});

function beginStir(){
  const build=getBuild(); if(!build||!build.shake.base||build.shake.baseAmount<20)return;
  stopHold();
  if(activeHold)return;
  $("#shakeSwirl").style.opacity=".45";
  $("#shakeCup").classList.add("stirring");
  $("#stirButton").classList.add("holding");
  startLoop("stir");
  const orderId=selectedId;
  activeHold={kind:"stir",button:$("#stirButton"),orderId,timer:setInterval(()=>{
    const b=builds[orderId];
    if(!b||selectedId!==orderId){stopHold();return;}
    b.shake.stir=Math.min(100,b.shake.stir+1.8);
    renderShakeVisual();
  },55)};
}
$("#stirButton").addEventListener("pointerdown",e=>{e.preventDefault();beginStir()});
window.addEventListener("pointerup",()=>{
  $("#shakeCup").classList.remove("stirring");
  $("#shakeSwirl").style.opacity="0";
});

function toppingNodes(container,list){
  container.innerHTML="";
  list.forEach(t=>{
    const s=document.createElement("span");
    s.className="topping-"+t;
    container.appendChild(s);
  });
}

function renderShakeVisual(){
  const build=getBuild();
  const mainLiquid=$("#shakeLiquid"), finishLiquid=$("#finishLiquid");
  const mainSyrup=$("#shakeSyrup"), finishSyrup=$("#finishSyrup");
  const mainTops=$("#shakeToppings"), finishTops=$("#finishToppings");

  if(!build){
    [mainLiquid,finishLiquid].forEach(x=>x.style.height="0");
    [mainSyrup,finishSyrup].forEach(x=>x.style.height="0");
    $("#pourMeter").style.width="0";
    $("#stirMeter").style.width="0";
    $("#syrupMeter").style.width="0";
    $("#shakeCup").classList.remove("size-s","size-m","size-l");
    $("#finishCup").classList.remove("size-s","size-m","size-l");
    $$("[data-size]").forEach(btn=>btn.classList.remove("active"));
    toppingNodes(mainTops,[]);
    toppingNodes(finishTops,[]);
    return;
  }

  const s=build.shake;
  $("#shakeCup").classList.remove("size-s","size-m","size-l");
  $("#finishCup").classList.remove("size-s","size-m","size-l");
  if(s.size){
    const cls="size-"+s.size.toLowerCase();
    $("#shakeCup").classList.add(cls);
    $("#finishCup").classList.add(cls);
  }
  $$("[data-size]").forEach(btn=>btn.classList.toggle("active",btn.dataset.size===s.size));
  const liquidHeight=Math.round(s.baseAmount*.78);
  [mainLiquid,finishLiquid].forEach(x=>{
    x.style.height=liquidHeight+"%";
    if(s.base)x.style.background=baseColors[s.base];
  });

  const syrupHeight=Math.round(Math.min(s.baseAmount*.78,s.syrupAmount*.62));
  [mainSyrup,finishSyrup].forEach(x=>{
    x.style.height=syrupHeight+"%";
    if(s.syrup)x.style.background=syrupColors[s.syrup];
  });

  $("#pourMeter").style.width=s.baseAmount+"%";
  $("#stirMeter").style.width=s.stir+"%";
  $("#syrupMeter").style.width=s.syrupAmount+"%";
  toppingNodes(mainTops,s.toppings);
  toppingNodes(finishTops,s.toppings);

  $("[data-topping]").forEach(btn=>btn.classList.toggle("active",s.toppings.includes(btn.dataset.topping)));
}

// Drag and tap-to-place shake toppings live in restaurant.js.
$("#clearShake").addEventListener("click",()=>{
  const build=getBuild();if(!build)return;
  stopHold();
  build.shake={size:null,base:null,baseAmount:0,stir:0,syrup:null,syrupAmount:0,toppings:[]};
  playSfx("pop");renderShakeVisual();renderTickets();updateBuildSummary();
});

// Live plating preview at the pickup counter reflects the selected ticket.
function renderTray(){
  const o=orders.find(x=>x.id===selectedId), b=getBuild();
  const burger=$("#trayBurger"),shake=$("#trayShake");
  burger.classList.toggle("empty",!o?.burger);
  shake.classList.toggle("empty",!o?.shake);
  if(!o?.burger){
    burger.textContent="NO BURGER";
  }else{
    const layers=(b?.burger||[]).map(x=>`<span class="mini-layer ${x}"></span>`).join("");
    burger.innerHTML=`<div class="mini-burger"><span class="mini-bottom"></span>${layers}</div><small>${b?.burger.includes("topbun")?"ASSEMBLED":"BUILDING"}</small>`;
  }
  if(!o?.shake){
    shake.textContent="NO SHAKE";
  }else{
    const s=b.shake;
    const height=Math.min(78,s.baseAmount*.78);
    const color=baseColors[s.base]||"transparent";
    shake.innerHTML=`<div class="mini-cup"><i style="height:${height}%;background:${color}"></i><b>SS</b></div><small>${s.size||"?"} · ${s.base?cap(s.base):"EMPTY"}</small>`;
  }
}

function updateBuildSummary(){
  const o=orders.find(x=>x.id===selectedId);
  const build=getBuild();
  if(!o||!build){
    $("#buildSummary").textContent="Select a ticket to start building.";
    $("#serveTicket").textContent="Select an order ticket.";
    renderBurger();
    renderTray();
    updateOrderGuide();
    return;
  }
  const burger=build.burger.length?build.burger.map(cap).join(" → "):"Not built";
  const s=build.shake;
  const shake=s.base?((s.size||"No size")+" · "+cap(s.base)+" · fill "+Math.round(s.baseAmount)+"% · stir "+Math.round(s.stir)+"% · "+(s.syrup?cap(s.syrup)+" syrup "+Math.round(s.syrupAmount)+"%":"no syrup")+" · "+(s.toppings.length?s.toppings.map(cap).join(", "):"no toppings")):(s.size?s.size+" cup selected":"Not built");
  const pattyText=build.pattyQuality ? cap(build.pattyQuality)+" · "+(build.pattyScore??0)+"% cook" : "Not cooked";
  $("#buildSummary").textContent=`BURGER\n${burger}\n\nPATTY\n${pattyText}\n\nSHAKE\n${shake}`;
  $("#serveTicket").textContent=`#${String(o.id).padStart(2,"0")} · ${o.name}\n${ticketLines(o)}`;
  renderBurger();
  renderTray();
  updateOrderGuide();
}

function scoreOrder(o,b){
  let points=0,total=0;
  if(o.burger){
    total+=1;
    points+=(b.pattyScore||0)/100;
    const wanted=["patty",...o.burger.toppings,"topbun"];
    wanted.forEach((x,index)=>{total++;if(b.burger[index]===x)points++});
    const extras=Math.max(0,b.burger.length-wanted.length);
    points=Math.max(0,points-extras*.35);
  }
  if(o.shake){
    total+=7+o.shake.toppings.length;
    if(b.shake.size===o.shake.size)points++;
    if(b.shake.base===o.shake.base)points++;
    if(b.shake.baseAmount>=65&&b.shake.baseAmount<=100)points++;
    if(b.shake.stir>=55&&b.shake.stir<=100)points++;
    if(b.shake.syrup===o.shake.syrup)points++;
    if(b.shake.syrupAmount>=18&&b.shake.syrupAmount<=100)points++;
    if(b.shake.base)points++;
    o.shake.toppings.forEach(x=>{if(b.shake.toppings.includes(x))points++});
    const extras=b.shake.toppings.filter(x=>!o.shake.toppings.includes(x)).length;
    points=Math.max(0,points-extras*.35);
  }
  return Math.max(0,Math.min(100,Math.round((points/Math.max(total,1))*100)));
}

$("#serveOrder").addEventListener("click",()=>{
  const idx=orders.findIndex(x=>x.id===selectedId);
  if(idx<0)return;
  const o=orders[idx],b=builds[o.id];
  if(missingSteps(o,b).length){updateOrderGuide();return}
  stopHold();
  const score=scoreOrder(o,b);
  const base=o.type==="combo"?12:o.type==="burger"?8:7;
  let earned=base*(.45+.55*(score/100));
  cash+=earned;served++;
  playSfx("ding");
  const rating=score>=95?"PERFECT!":score>=80?"GREAT JOB!":score>=60?"NICE TRY!":"NEEDS WORK!";
  $("#scoreResult").textContent=`${rating} · ${score}% · +${earned.toFixed(2)}`;
  window.ShakeStationExpansion?.served(o,score,earned);
  delete builds[o.id];
  clearIngredient();
  orders.splice(idx,1);
  selectedId=orders[0]?.id||null;
  $("#cash").textContent="$"+cash.toFixed(2);
  $("#served").textContent=served;
  if(!window.ShakeStationExpansion){
    $("#goalBar").style.width=Math.min(100,cash/75*100)+"%";
  }
  renderTickets();
  renderQueue();
  updateBuildSummary();
  renderShakeVisual();
  window.ShakeStationExpansion?.afterServe();
  setTimeout(spawnCustomer,1000);
});

renderTickets();
renderQueue();
renderCookedRack();
renderShakeVisual();
setTimeout(spawnCustomer,700);
setInterval(()=>{if(!currentCustomer&&orders.length<MAX_OPEN_ORDERS)spawnCustomer()},18000);
updateOrderGuide();


const menuButton=$("#menuButton");
const gameMenu=$("#gameMenu");
const buildId=$("#buildId");

if(menuButton&&gameMenu){
  menuButton.addEventListener("click",e=>{
    e.stopPropagation();
    const open=gameMenu.hasAttribute("hidden");
    if(open) gameMenu.removeAttribute("hidden"); else gameMenu.setAttribute("hidden","");
    menuButton.setAttribute("aria-expanded",String(open));
  });

  document.addEventListener("click",e=>{
    if(!gameMenu.hasAttribute("hidden")&&!gameMenu.contains(e.target)&&e.target!==menuButton){
      gameMenu.setAttribute("hidden","");
      menuButton.setAttribute("aria-expanded","false");
    }
  });
}

if(buildId){
  fetch("https://api.github.com/repos/focustap/ShakeStation/commits/main",{headers:{"Accept":"application/vnd.github+json"}})
    .then(r=>r.ok?r.json():Promise.reject())
    .then(data=>{
      if(data&&data.sha) buildId.textContent=data.sha.slice(0,4);
    })
    .catch(()=>{});
}
