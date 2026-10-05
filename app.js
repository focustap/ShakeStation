const stationMeta={
  order:["FRONT COUNTER","Order Station","Customers walk in, tell you what they want, and their ticket joins the queue."],
  grill:["COOK LINE","Grill Station","Cook burger patties carefully. Pull them in the green window before they burn."],
  burger:["BUILD LINE","Burger Station","Stack the cooked patty and toppings in the same order the customer requested."],
  shake:["DRINK LINE","Shake Station","Pour the base, stir it smooth, then add the requested syrup."],
  finish:["FINISH LINE","Finish Station","Add shake toppings and check the whole order before serving."],
  serve:["PICKUP COUNTER","Serve Station","Match your finished food to the ticket and serve it for a score and tip."]
};

const names=["Maya","Theo","Lena","Devin","Nora","Miles","Avery","Jules","Sam","Riley"];
const burgerOptions=["cheese","lettuce","tomato","onion","pickles","ketchup"];
const shakeToppings=["whipped","sprinkles","cookie","strawberries","cherry"];
const bases=["vanilla","chocolate","strawberry"];
const syrups=["chocolate","strawberry","caramel"];
const sizes=["S","M","L"];

let orders=[];
let selectedId=null;
let nextId=1;
let currentCustomer=null;
let cash=0;
let served=0;
const builds={};
let stirTimer=null;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function rand(arr){return arr[Math.floor(Math.random()*arr.length)]}
function sample(arr,min,max){
  const copy=[...arr].sort(()=>Math.random()-.5);
  const count=min+Math.floor(Math.random()*(max-min+1));
  return copy.slice(0,count);
}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

function makeOrder(){
  const roll=Math.random();
  const type=roll<.36?"shake":roll<.70?"burger":"combo";
  const order={id:nextId++,name:rand(names),type,burger:null,shake:null};
  if(type!=="shake"){
    order.burger={
      toppings:sample(burgerOptions,2,4)
    };
  }
  if(type!=="burger"){
    order.shake={
      size:rand(sizes),
      base:rand(bases),
      syrup:rand(syrups),
      toppings:sample(shakeToppings,1,3)
    };
  }
  return order;
}

function orderSentence(o){
  const pieces=[];
  if(o.burger){
    pieces.push("a burger with "+o.burger.toppings.map(cap).join(", "));
  }
  if(o.shake){
    pieces.push(`a ${o.shake.size} ${o.shake.base} shake with ${o.shake.syrup} syrup and ${o.shake.toppings.map(cap).join(", ")}`);
  }
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
    pattyQuality:null,
    shake:{base:null,stir:0,syrup:null,toppings:[]}
  };
}

function setStation(id){
  $$(".station").forEach(b=>b.classList.toggle("active",b.dataset.station===id));
  $$(".station-view").forEach(v=>v.classList.toggle("active",v.id==="view-"+id));
  const meta=stationMeta[id];
  $("#stationKicker").textContent=meta[0];
  $("#stationTitle").textContent=meta[1];
  $("#stationHelp").textContent=meta[2];
  if(id==="finish"||id==="serve") updateBuildSummary();
}

$$(".station").forEach(b=>b.addEventListener("click",()=>setStation(b.dataset.station)));

function spawnCustomer(){
  if(currentCustomer) return;
  currentCustomer=makeOrder();
  $("#customerName").textContent=currentCustomer.name;
  $("#orderText").textContent="Customer is ready to order.";
  $("#speech").textContent="Hi! Can I order "+orderSentence(currentCustomer)+"?";
  $("#takeOrder").disabled=false;
  $("#customer").classList.remove("walk-in");
  $("#speech").classList.remove("show");
  requestAnimationFrame(()=>{
    $("#customer").classList.add("walk-in");
    setTimeout(()=>$("#speech").classList.add("show"),600);
  });
  renderQueue();
}

function takeOrder(){
  if(!currentCustomer) return;
  const o=currentCustomer;
  orders.push(o);
  builds[o.id]=blankBuild();
  selectedId=o.id;
  currentCustomer=null;
  $("#speech").classList.remove("show");
  $("#customer").classList.remove("walk-in");
  $("#customerName").textContent="Waiting...";
  $("#orderText").textContent="Next customer is on the way.";
  $("#takeOrder").disabled=true;
  renderTickets();
  renderQueue();
  updateBuildSummary();
  setTimeout(spawnCustomer,1700);
}
$("#takeOrder").addEventListener("click",takeOrder);

function renderTickets(){
  const wrap=$("#tickets");
  wrap.innerHTML="";
  orders.forEach(o=>{
    const b=document.createElement("button");
    b.className="ticket"+(o.id===selectedId?" active":"");
    b.innerHTML=`<b>#${String(o.id).padStart(2,"0")} · ${o.name}</b><span>${o.type.toUpperCase()}</span><span>${ticketLines(o).replace(/\n/g,"<br>")}</span>`;
    b.addEventListener("click",()=>{
      selectedId=o.id;
      renderTickets();
      updateBuildSummary();
    });
    wrap.appendChild(b);
  });
  $("#ticketCount").textContent=orders.length;
}

function renderQueue(){
  const q=$("#queue");
  q.innerHTML="";
  if(currentCustomer){
    const d=document.createElement("div");
    d.className="queue-person";
    d.innerHTML=`<i></i><span>${currentCustomer.name}<br><small>At counter</small></span>`;
    q.appendChild(d);
  }
  orders.slice(0,4).forEach(o=>{
    const d=document.createElement("div");
    d.className="queue-person";
    d.innerHTML=`<i></i><span>${o.name}<br><small>Waiting on order</small></span>`;
    q.appendChild(d);
  });
  $("#queueCount").textContent=(currentCustomer?1:0)+orders.length;
}

function getBuild(){
  return selectedId?builds[selectedId]:null;
}

const slots=$$(".patty-slot");
function pattyState(el){
  const start=Number(el.dataset.start||0);
  if(!start)return;
  const secs=(Date.now()-start)/1000;
  el.classList.toggle("good",secs>=6&&secs<11);
  el.classList.toggle("burnt",secs>=11);
  el.querySelector("span").textContent=secs>=11?"BURNT":secs>=6?"GOOD":Math.ceil(secs)+"s";
}
setInterval(()=>slots.forEach(pattyState),250);

slots.forEach(el=>el.addEventListener("click",()=>{
  const build=getBuild();
  if(!build)return;
  if(!el.dataset.start){
    el.dataset.start=Date.now();
    el.classList.add("cooking");
    el.querySelector("span").textContent="1s";
  }else{
    const secs=(Date.now()-Number(el.dataset.start))/1000;
    build.pattyQuality=secs<6?"raw":secs<11?"good":"burnt";
    el.dataset.start="";
    el.className="patty-slot";
    el.querySelector("span").textContent="+";
    updateBuildSummary();
    setStation("burger");
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

$$("[data-burger]").forEach(btn=>btn.addEventListener("click",()=>{
  const build=getBuild();
  if(!build)return;
  const item=btn.dataset.burger;
  if(item==="patty"&&!build.pattyQuality)return;
  build.burger.push(item);
  renderBurger();
  updateBuildSummary();
}));
$("#clearBurger").addEventListener("click",()=>{
  const build=getBuild();
  if(!build)return;
  build.burger=[];
  renderBurger();
  updateBuildSummary();
});

$$("[data-base]").forEach(btn=>btn.addEventListener("click",()=>{
  const build=getBuild(); if(!build)return;
  build.shake.base=btn.dataset.base;
  const colors={vanilla:"#f0dfae",chocolate:"#7b4d35",strawberry:"#e98caa"};
  $("#shakeLiquid").style.background=colors[btn.dataset.base];
  $("#shakeLiquid").style.height="78%";
  updateBuildSummary();
}));

function beginStir(){
  const build=getBuild(); if(!build||!build.shake.base)return;
  if(stirTimer)return;
  $("#shakeSwirl").style.opacity=".45";
  stirTimer=setInterval(()=>{
    build.shake.stir=Math.min(100,build.shake.stir+2);
    $("#stirMeter").style.width=build.shake.stir+"%";
  },80);
}
function stopStir(){
  clearInterval(stirTimer); stirTimer=null;
  $("#shakeSwirl").style.opacity="0";
  updateBuildSummary();
}
$("#stirButton").addEventListener("pointerdown",beginStir);
window.addEventListener("pointerup",stopStir);
$("#stirButton").addEventListener("pointerleave",stopStir);

$$("[data-syrup]").forEach(btn=>btn.addEventListener("click",()=>{
  const build=getBuild(); if(!build)return;
  build.shake.syrup=btn.dataset.syrup;
  $("#shakeSwirl").style.opacity=".28";
  updateBuildSummary();
}));

$$("[data-topping]").forEach(btn=>btn.addEventListener("click",()=>{
  const build=getBuild(); if(!build)return;
  const t=btn.dataset.topping;
  const list=build.shake.toppings;
  const i=list.indexOf(t);
  if(i>=0) list.splice(i,1); else list.push(t);
  btn.classList.toggle("active",i<0);
  updateBuildSummary();
}));

function updateBuildSummary(){
  const o=orders.find(x=>x.id===selectedId);
  const build=getBuild();
  if(!o||!build){
    $("#buildSummary").textContent="Select a ticket to start building.";
    $("#serveTicket").textContent="Select an order ticket.";
    return;
  }
  const burger=build.burger.length?build.burger.map(cap).join(" → "):"Not built";
  const shake=build.shake.base?`${cap(build.shake.base)} · stir ${build.shake.stir}% · ${build.shake.syrup?cap(build.shake.syrup):"no syrup"} · ${build.shake.toppings.length?build.shake.toppings.map(cap).join(", "):"no toppings"}`:"Not built";
  $("#buildSummary").textContent=`BURGER\n${burger}\n\nPATTY\n${build.pattyQuality||"Not cooked"}\n\nSHAKE\n${shake}`;
  $("#serveTicket").textContent=`#${String(o.id).padStart(2,"0")} · ${o.name}\n${ticketLines(o)}`;
  renderBurger();
}

function scoreOrder(o,b){
  let points=0,total=0;
  if(o.burger){
    total+=1; if(b.pattyQuality==="good")points++;
    const wanted=["patty",...o.burger.toppings,"topbun"];
    wanted.forEach(x=>{total++;if(b.burger.includes(x))points++});
    const extras=b.burger.filter(x=>!wanted.includes(x)).length;
    points=Math.max(0,points-extras*.35);
  }
  if(o.shake){
    total+=4+o.shake.toppings.length;
    if(b.shake.base===o.shake.base)points++;
    if(b.shake.stir>=60&&b.shake.stir<=100)points++;
    if(b.shake.syrup===o.shake.syrup)points++;
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
  const score=scoreOrder(o,b);
  const base=o.type==="combo"?12:o.type==="burger"?8:7;
  const earned=base*(.45+.55*(score/100));
  cash+=earned;served++;
  $("#scoreResult").textContent=`${score}% order · +$${earned.toFixed(2)}`;
  delete builds[o.id];
  orders.splice(idx,1);
  selectedId=orders[0]?.id||null;
  $("#cash").textContent="$"+cash.toFixed(2);
  $("#served").textContent=served;
  $("#goalBar").style.width=Math.min(100,cash/75*100)+"%";
  renderTickets();renderQueue();updateBuildSummary();
});

renderTickets();
renderQueue();
setTimeout(spawnCustomer,700);
setInterval(()=>{if(!currentCustomer&&orders.length<4)spawnCustomer()},18000);
