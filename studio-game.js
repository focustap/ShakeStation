(function(){
"use strict";
const Core=window.ShakeCore,Art=window.ShakeArt;
if(!Core||!Art){document.body.textContent="ShakeStation could not load its ingredients. Refresh the page.";return}
const KEY="shakestation-studio-v2",OLD="shakestation-shifts-v1";
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const art=(name,options)=>Art.sprite(name,options);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const money=n=>"$"+Number(n||0).toFixed(2);
const caps=s=>s?String(s).replace(/^\w/,c=>c.toUpperCase()):"";
function load(){
 let data=null;
 try{data=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
 if(data?.version===2)return Core.cleaned(data);
 const fresh=Core.newSave();
 try{
  const old=JSON.parse(localStorage.getItem(OLD)||"null");
  if(old){
   fresh.day=Math.max(1,Number(old.day)||1);
   fresh.money=Math.max(0,Number(old.cash)||0);
   fresh.rep=Number.isFinite(Number(old.rep))?clamp(Number(old.rep),0,100):50;
   fresh.served=Math.max(0,Number(old.served)||0);
   fresh.owned=Array.isArray(old.owned)?old.owned.filter(x=>Core.shop.some(g=>g.id===x)):[];
   fresh.theme=["mint","night"].includes(old.theme)?old.theme:"pink";
  }
 }catch(e){}
 return fresh;
}
let S=load(),drag=null,pouring=null,selectedProp=null,audio=null,toastTimer=null;
let finishedDay=false;
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
}
function tone(type){
 if(S.muted)return;
 try{
  if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();
  if(audio.state==="suspended")audio.resume();
  const note={pop:[490,.07],grill:[155,.13],ding:[960,.16],bad:[185,.18],cash:[780,.10],pour:[315,.04]}[type]||[550,.06];
  const oscillator=audio.createOscillator(),gain=audio.createGain();
  oscillator.type=type==="grill"?"sawtooth":"sine";
  oscillator.frequency.setValueAtTime(note[0],audio.currentTime);
  gain.gain.setValueAtTime(.035,audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+note[1]);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();oscillator.stop(audio.currentTime+note[1]);
 }catch(e){}
}
function toast(message){
 const box=$("#toast");if(!box)return;
 box.textContent=message;box.classList.add("show");
 if(toastTimer)clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>box.classList.remove("show"),2400);
}
function makeGuest(){
 if(S.today.taken>=Core.quota(S)||S.orders.length>=4)return null;
 if(!S.customer)S.customer=Core.order(S.day,S.rep);
 return S.customer;
}
function active(){return S.orders.find(x=>x.id===S.selected)||null}
function build(){return S.builds[S.selected]||null}
function isReady(o){return Core.ready(o,S.builds[o?.id])}
function todayEvent(){
 if(S.day%5===0)return {title:"FIVE-DAY FESTIVAL",detail:"Guests tip 20% extra today!"};
 if(S.day%3===0)return {title:"WEEKEND RUSH",detail:"More orders, bigger opportunities."};
 return {title:"MAKE THEM SMILE",detail:"Great meals get better tips and bring regulars back."};
}
function summary(o){
 if(!o)return "Take an order at the counter.";
 const a=[];
 if(o.burger)a.push("🍔 "+o.burger.toppings.map(caps).join(" · "));
 if(o.shake)a.push("🥤 "+o.shake.size+" "+caps(o.shake.base)+" · "+caps(o.shake.syrup)+" syrup · "+o.shake.toppings.map(caps).join(", "));
 return a.join("<br>");
}
function orderStatus(o){
 if(isReady(o))return "READY";
 const b=S.builds[o.id];
 if(!b)return "NEW";
 if(b.layers.length||b.shake.size||b.shake.fill||b.shake.toppings.length)return "IN PROGRESS";
 return "NEW";
}
function prop(type,token,label,extra=""){
 const isCup=type==="cup"&&token.startsWith("cup:");
 const part=isCup?art("cup"):art(type,type==="bottle"?{flavor:token.split(":")[1]}:null);
 return '<button type="button" class="illustrated-prop '+extra+'" data-drag="'+token+'" aria-label="'+label+'" title="'+label+'">'+part+'</button>';
}
function stackMarkup(o,b){
 const pieces=['bottombun',...(b?.layers||[])];
 return '<div class="stacked-burger" data-drag="assembled-burger" tabindex="0" role="img" aria-label="Current burger; drag to trash to discard">'+pieces.map((x,i)=>'<div class="burger-layer '+(x==="topbun"?"top":"")+'" style="z-index:'+(i+1)+'">'+art(x==="patty"&&b?.patty?.quality==="burnt"?"burnt":x)+'</div>').join("")+'</div>';
}
function visualCup(s){return art("cup",{base:s.base,fill:s.fill,syrup:s.syrup})}
function colorGuest(o){
 const a=o?.avatar||{skin:"#e3ae8d",hair:"#65403b",shirt:"#e38aa3"};
 return '<div class="guest-portrait" style="--skin:'+a.skin+';--hair:'+a.hair+';--shirt:'+a.shirt+'"><div class="guest-hair"></div><div class="guest-head"></div><i class="guest-eye left"></i><i class="guest-eye right"></i><i class="guest-smile"></i><div class="guest-shirt"></div></div>';
}
function renderFront(){
 const guest=makeGuest(),quota=Core.quota(S),waiting=S.orders.length>=4;
 const last=S.today.taken>=quota;
 return '<div class="front-scene"><div class="front-wall"></div><div class="front-window"></div><div class="front-sign">SHAKESTATION<small>BURGERS & SHAKES ♥</small></div>'+
 (guest?'<div class="customer-block">'+colorGuest(guest)+'</div><div class="guest-speech"><strong>'+guest.name+(guest.special==="critic"?" ★":guest.special==="influencer"?" ✦":"")+'</strong>"Hi! Can I get '+(guest.burger&&guest.shake?"a burger and a milkshake":guest.burger?"a burger":"a milkshake")+'?"</div>':'')+
 '<div class="counter-ledge"></div><div class="front-status">'+(last?"All customers for today have arrived. Finish the remaining tickets!":waiting?"Your order rail is full. Serve someone first!":'WELCOME IN! · '+(quota-S.today.taken)+' ORDERS LEFT THIS SHIFT')+'</div>'+
 (!last&&!waiting?'<button class="take-ticket" data-action="take">✦ TAKE ORDER</button>':'')+
 '</div>';
}
function grillScore(p){
 const secs=Math.max(0,(Date.now()-p.start)/1000);
 return {seconds:secs,score:clamp(Math.round(100-Math.abs(secs-8.5)*18),0,100),quality:secs<6?"undercooked":secs<11?"good":"burnt",percent:clamp(secs/14*100,0,100)};
}
function renderRack(compact=false){
 if(!S.rack.length)return '<em>No patties yet. Cook some on the grill.</em>';
 return S.rack.map(p=>prop(p.quality==="burnt"?"burnt":"patty","rack:"+p.id,"Cooked "+p.quality+" patty, "+p.score+" percent","rack-piece")).join("");
}
function renderGrill(){
 return '<div class="grill-scene"><div class="grill-header"><span>THE HOT LINE · THREE COOKING SPOTS</span><span>'+S.rack.length+'/'+(S.owned.includes("rack")?10:6)+' ON HOLDING RACK</span></div><div class="grill-plate">'+S.grill.map((p,i)=>{
 const calc=p?grillScore(p):null;
 return '<button type="button" class="grill-slot '+(p?"active":"")+'" data-action="grill" data-index="'+i+'" '+(p?'data-drag="grill:'+i+'"':'')+' title="'+(p?"Click to lift, or drag to trash":"Click to place raw patty")+'" aria-label="'+(p?"Lift cooking patty "+(i+1):"Place raw patty on grill spot "+(i+1))+'">'+(p?art(calc.quality==="burnt"?"burnt":"patty"):'+')+'<span class="cook-track"><i class="cook-pin" style="left:'+(calc?.percent||0)+'%"></i></span></button>';
 }).join("")+'</div><div class="grill-bottom"><div class="grill-rack"><div class="rack-head"><span>WARMING RACK</span><span>DRAG A PATTY TO BURGER OR TRASH</span></div><div class="rack-contents">'+renderRack()+'</div></div><div class="big-trash" data-drop="trash" title="Drag spoiled patties into the bin">'+art("trash")+'<small>TRASH BIN</small></div></div></div>';
}
function renderBurger(){
 const o=active(),b=build();
 if(!o?.burger)return emptyStage("🍔","Pick a ticket with a burger.","You can prepare spare patties at the grill anytime.");
 const bins=["lettuce","tomato","onion","pickles","cheese"];
 return '<div class="burger-scene"><div class="ingredient-strip">'+bins.map(x=>'<div class="ingredient-bin">'+prop(x,"ingredient:"+x,"Drag "+caps(x)+" onto the burger")+'</div>').join("")+'</div><div class="burger-lower"><div class="patty-drawer">'+(S.rack.length?renderRack(true):'<span style="font-size:10px;color:#705667;text-align:center;margin:auto">GRILL PATTIES FIRST</span>')+'</div><div class="board" data-drop="burger" tabindex="0" role="button" aria-label="Assembly cutting board, drop ingredient here"><div class="board-shadow"></div>'+stackMarkup(o,b)+'<div class="board-caption">FRESHLY MADE BY YOU</div></div><div class="burger-accessories">'+prop("topbun","ingredient:topbun","Drag the top bun to finish")+prop("ketchup","ingredient:ketchup","Drag ketchup onto your burger")+'<div class="mini-trash" data-drop="trash" title="Drag burger or patty here to discard">'+art("trash")+'</div></div></div><div class="burger-footer"><div class="rack-shell"><small>WARMING RACK · '+S.rack.length+' READY</small><div class="rack-contents">'+renderRack(true)+'</div></div><button class="utility" data-action="undo-burger" title="Remove the top ingredient">↶ UNDO</button><button class="utility" data-action="trash-burger" title="Throw out the entire burger">🗑 TOSS</button></div></div>';
}
function renderShake(){
 const o=active(),b=build();
 if(!o?.shake)return emptyStage("🥤","Pick a ticket with a milkshake.","Then drag a cup from the left shelf underneath the flavor tap.");
 const s=b.shake;
 const cupShelf=["S","M","L"].map(size=>'<button class="illustrated-prop" type="button" data-drag="cup:'+size+'" data-cup="'+size+'" title="Drag '+size+' cup under the machine" aria-label="Pick up a '+size+' cup">'+art("cup")+'</button>').join("");
 const taps=["vanilla","chocolate","strawberry"].map((x,i)=>'<button type="button" class="nozzle-control" data-pour="'+i+'" title="Hold to pour '+x+' milkshake" aria-label="Hold '+x+' dispenser to pour">'+art(x==="vanilla"?"whipped":x==="chocolate"?"cookie":"strawberries")+'</button>').join("");
 const platforms=[0,1,2].map(i=>'<div class="cup-platform '+(s.slot===i?"active":"")+'" data-drop="shake:'+i+'" tabindex="0" role="button" aria-label="Place cup under '+["vanilla","chocolate","strawberry"][i]+' dispenser">'+(s.size&&s.slot===i?'<div class="cup-visual" data-drag="active-cup" title="Drag the cup sideways to blend, or move it to a flavor tap">'+visualCup(s)+'</div>':'')+'</div>').join("");
 return '<div class="shake-scene"><div class="shake-decoration">THE SHAKE LAB<small>TAKE A CUP · POUR · MIX · DRIZZLE</small></div><div class="cup-shelf">'+cupShelf+'</div><div class="dispenser-machine">'+taps+'</div><div class="cup-platforms">'+platforms+'</div><div class="syrup-rack">'+["chocolate","strawberry","caramel"].map(x=>prop("bottle","syrup:"+x,"Drag "+x+" syrup onto the cup")).join("")+'</div><div class="pour-stream" id="pourStream"></div><div class="syrup-splash" id="syrupSplash"></div><div class="shake-status"><span class="shake-indicator">FILL <i><b id="fillIndicator" style="width:'+s.fill+'%"></b></i></span><span class="shake-indicator mix">MIX <i><b id="mixIndicator" style="width:'+s.stir+'%"></b></i></span><span>'+Math.round(s.syrupAmount)+'% SYRUP</span></div></div>';
}
function renderFinish(){
 const o=active(),b=build();
 if(!o)return emptyStage("🍽️","No order on the serving tray.","Pick an order ticket, make its food, and bring it here.");
 const s=b?.shake||{};
 const toppings=["whipped","sprinkles","cookie","strawberries","cherry"].map(x=>'<div class="topping-bowl">'+prop(x,"topping:"+x,"Drag "+caps(x)+" onto the shake")+'</div>').join("");
 const platedBurger=o.burger?stackMarkup(o,b):'<span style="color:#b7a4aa;font-size:12px">—</span>';
 const platedShake=o.shake?'<div style="width:125px;height:155px;position:relative">'+visualCup(s)+(s.toppings||[]).map(t=>'<div class="finish-topper" style="left:'+clamp(t.x,5,85)+'%;top:'+clamp(t.y,0,50)+'%">'+art(t.type)+'</div>').join("")+'</div>':'<span style="color:#b7a4aa;font-size:12px">—</span>';
 return '<div class="finish-scene"><div class="topping-shelf">'+toppings+'</div><div class="plating-tray"><div class="plated-item" '+(o.burger?'data-drop="finish-burger"':'')+'>'+platedBurger+'</div><div class="plated-item" '+(o.shake?'data-drop="finish-cup" tabindex="0" role="button" aria-label="Drop topping on milkshake"':'')+'>'+platedShake+'</div></div><div class="finish-side"><div class="finish-ticket"><strong>#'+String(o.id).padStart(2,"0")+' '+o.name+'</strong><small>THE ORIGINAL TICKET</small>'+summary(o)+'<hr><small>'+(!isReady(o)?"STILL NEEDS SOME WORK":"READY FOR THE CUSTOMER ✓")+'</small></div><button class="serve-button" data-action="serve" '+(!isReady(o)?"disabled":"")+' type="button">✦ SERVE ORDER</button><div class="finish-mini">Take the ticket off the rail when the whole meal is ready.</div></div></div>';
}
function emptyStage(emoji,title,info){return '<div class="no-order-scene"><div><div class="empty-symbol">'+emoji+'</div><h2>'+title+'</h2><p>'+info+'</p></div></div>'}
function renderStage(){
 const el=$("#stage");
 const meta={front:["WELCOME TO YOUR DINER","Front Counter"],grill:["SIZZLE, FLIP, PERFECT","The Grill"],burger:["FRESH FROM THE PREP LINE","Burger Kitchen"],shake:["POUR SOMETHING SWEET","Milkshake Lab"],finish:["THE FINAL TOUCH","Finish & Serve"]};
 $("#sceneEyebrow").textContent=meta[S.view][0];
 $("#sceneName").textContent=meta[S.view][1];
 const o=active();
 $("#activeTicket").textContent=o?"TICKET #"+String(o.id).padStart(2,"0")+" · "+o.name:"NO TICKET SELECTED";
 $("#stationHelp").textContent={front:"Welcome guests and write up their order.",grill:"Click the grill to cook. Lift in green. Drag burnt food to the bin.",burger:"Pick up actual ingredients and put them on the board.",shake:"Drag a cup to a nozzle, hold to pour, move the cup to mix.",finish:"Top the shake by hand. Serve when the entire meal is ready."}[S.view];
 $("#hint").textContent={front:"Every happy customer helps grow your diner.",grill:"Cook ahead for several orders. Patties stay in the shared rack.",burger:"Drag real food pieces onto the cutting board, in ticket order.",shake:"Drag a cup under the flavor you want. Syrup bottles drop onto cups.",finish:"Drop toppings on the cup. The serve button unlocks when everything is ready."}[S.view];
 const views={front:renderFront,grill:renderGrill,burger:renderBurger,shake:renderShake,finish:renderFinish};
 el.innerHTML=views[S.view]();
}
function renderHud(){
 document.body.classList.toggle("theme-mint",S.theme==="mint");
 document.body.classList.toggle("theme-night",S.theme==="night");
 $("#dayName").textContent="DAY "+String(S.day).padStart(2,"0");
 $("#shiftTag").textContent=S.today.taken>=Core.quota(S)?"LAST ORDERS":"MORNING SHIFT";
 $("#money").textContent=money(S.money);
 $("#reputation").textContent="★ "+Math.round(S.rep);
 $("#streak").textContent="× "+S.streak;
 $("#audioToggle").textContent=S.muted?"♪̸":"♫";
 $("#ordersCount").textContent=S.orders.length+"/4";
 $("#todayServed").textContent=S.today.served+" served today";
 $("#dayOrders").textContent=S.today.taken+" / "+Core.quota(S)+" orders";
 const goal=Core.goal(S),pct=clamp(Math.round(S.today.earned/goal*100),0,100);
 $("#goalText").textContent=money(S.today.earned)+" / "+money(goal);
 $("#goalFill").style.width=pct+"%";
 $("#goalState").textContent=pct>=100?"DAILY GOAL MET!":"KEEP SERVING";
 $("#shiftProgress").textContent=pct+"%";
 const ev=todayEvent();
 $("#reviewCard").innerHTML='<span class="star-scatter">★★★★★</span><b>'+ev.title+'</b><p>'+ev.detail+'</p>';
 $("#lobby").innerHTML=S.customer?'<div class="lobby-avatar">🧑</div>':'<span style="font-size:29px">🪑</span>';
 $("#lobbyHint").textContent=S.today.taken>=Core.quota(S)?"Today's guests have all ordered.":S.orders.length>=4?"Serve an order to clear the rail.":S.customer?"A guest is ready to order.":"Head to the counter to meet the next guest.";
 $$(".nav-tab").forEach(btn=>{btn.classList.toggle("current",btn.dataset.view===S.view);btn.setAttribute("aria-current",String(btn.dataset.view===S.view))});
}
function renderTickets(){
 $("#ticketList").innerHTML=S.orders.length?S.orders.map(o=>{
  const status=orderStatus(o),active=S.selected===o.id;
  return '<button type="button" class="ticket '+(active?"active":"")+'" data-select="'+o.id+'"><span class="ticket-top">'+o.name+' <small class="ticket-id">#'+String(o.id).padStart(2,"0")+'</small></span>'+(o.special?'<span class="ticket-vip">'+({critic:"★ FOOD CRITIC",influencer:"✦ INFLUENCER",regular:"♥ REGULAR"}[o.special])+'</span>':'')+'<span class="ticket-order">'+summary(o)+'</span><span class="ticket-status '+(status==="READY"?"ready":"")+'"><i class="dot"></i>'+status+'</span></button>';
 }).join(""):'<p style="padding:21px 7px;color:#a68c97;font-size:11px;line-height:1.6">No tickets yet.<br>Head to the counter to welcome your first guest.</p>';
}
function renderAll(){renderHud();renderTickets();renderStage();save()}
function setView(view){
 if(!["front","grill","burger","shake","finish"].includes(view))return;
 stopPour();
 S.view=view;renderAll();
}
function chooseTicket(id){
 if(!S.orders.some(x=>x.id===id))return;
 stopPour();S.selected=id;selectedProp=null;renderAll();
}
function takeOrder(){
 const g=makeGuest();
 if(!g){toast(S.orders.length>=4?"Your ticket rail is full. Serve a guest first.":"The day's orders are complete.");return}
 g.id=S.nextOrderId++;g.takenAt=Date.now();
 S.orders.push(g);S.builds[g.id]=Core.build();
 S.selected=g.id;S.today.taken++;S.customer=null;
 tone("ding");renderAll();
 toast(g.special==="critic"?"★ A food critic is visiting! Their review matters.":g.special==="influencer"?"✦ Influencer at the counter! Make it good.":"Ticket #"+String(g.id).padStart(2,"0")+" added to your order rail!");
}
function clickGrill(index){
 const p=S.grill[index];
 if(!p){S.grill[index]={start:Date.now()};tone("grill");toast("Sizzling! Pull the patty when the marker reaches green.");}
 else{
  const limit=S.owned.includes("rack")?10:6;
  if(S.rack.length>=limit){toast("Your holding rack is full!");return}
  const c=grillScore(p);
  S.rack.push({id:Date.now()+"-"+index,quality:c.quality,score:c.score});
  S.grill[index]=null;tone("pop");
  toast(c.quality==="burnt"?"This patty burnt. Drag it into the trash bin.":c.quality==="good"?"Perfect timing! Patty stored on your holding rack.":"A little underdone — you can toss it and try again.");
 }
 renderAll();
}
function undoBurger(){
 const o=active(),b=build();if(!o?.burger||!b?.layers?.length)return;
 const part=b.layers.pop();
 if(part==="patty"&&b.patty){S.rack.push(b.patty);b.patty=null}
 tone("pop");renderAll();
}
function trashBurger(){
 const b=build();if(!active()?.burger||!b?.layers.length)return;
 b.layers=[];b.patty=null;
 tone("bad");toast("Burger discarded. Clean cutting board!");
 renderAll();
}
function addIngredient(type){
 const o=active(),b=build();
 if(!o?.burger||!b){toast("Choose a burger ticket first!");return}
 if(b.layers.includes("topbun")){toast("Already closed! Undo the top bun to change it.");return}
 if(type==="patty"){toast("Take a cooked patty from the warming rack.");return}
 b.layers.push(type);tone("pop");renderAll();
}
function addPatty(id){
 const o=active(),b=build();
 if(!o?.burger||!b){toast("Choose a burger ticket.");return}
 if(b.layers.includes("patty")||b.layers.includes("topbun")){toast("This burger already has a patty or top bun.");return}
 const i=S.rack.findIndex(p=>String(p.id)===String(id));
 if(i<0)return;
 b.patty=S.rack.splice(i,1)[0];b.layers.push("patty");
 tone("pop");renderAll();
}
function dropTrash(token){
 if(token.startsWith("rack:")){
  const i=S.rack.findIndex(p=>String(p.id)===token.slice(5));
  if(i<0)return;S.rack.splice(i,1);
 }else if(token.startsWith("grill:")){
  const i=Number(token.split(":")[1]);if(!S.grill[i])return;
  S.grill[i]=null;
 }else if(token==="assembled-burger"){trashBurger();return}
 else return;
 tone("bad");toast("Into the trash! Fresh patties are always better.");renderAll();
}
function chooseCup(size,slot){
 const o=active(),b=build();if(!o?.shake||!b)return;
 b.shake.size=size;b.shake.slot=slot;
 b.shake.base=null;b.shake.fill=0;b.shake.stir=0;b.shake.syrup=null;b.shake.syrupAmount=0;b.shake.toppings=[];
 tone("pop");renderAll();toast(size+" cup placed. Hold the nozzle directly above it to pour!");
}
function moveCup(slot){
 const b=build();if(!b?.shake.size)return;
 b.shake.slot=slot;tone("pop");renderAll();
}
function applySyrup(type){
 const o=active(),b=build();if(!o?.shake||!b?.shake.size||b.shake.fill<20){toast("Pour a shake into the cup first.");return}
 b.shake.syrup=type;b.shake.syrupAmount=clamp(b.shake.syrupAmount+26,0,100);
 tone("pour");renderAll();toast("Syrup squeezed! Add more by dragging the bottle again.");
}
function topShake(type,e,zone){
 const o=active(),b=build();if(!o?.shake||!b?.shake.size||b.shake.fill<20){toast("Make the shake first, then decorate it.");return}
 const existing=b.shake.toppings.findIndex(x=>x.type===type);
 if(existing>=0)b.shake.toppings.splice(existing,1);
 const rect=zone.getBoundingClientRect();
 const x=clamp(Math.round((e.clientX-rect.left)/Math.max(1,rect.width)*100),10,80);
 const y=clamp(Math.round((e.clientY-rect.top)/Math.max(1,rect.height)*50),3,36);
 b.shake.toppings.push({type,x,y});
 tone("pop");renderAll();
}
function earnAwards(){
 const newly=[];
 function add(id){if(!S.awards.includes(id)){S.awards.push(id);newly.push(Core.achievements.find(x=>x.id===id)?.name)}}
 if(S.served>=1)add("first");
 if(S.streak>=5)add("streak");
 if(S.day>=3)add("day3");
 if(S.earned>=250)add("rich");
 return newly.filter(Boolean);
}
function serve(){
 const o=active(),b=build();
 if(!Core.ready(o,b)){toast("Finish everything on the customer's ticket first.");return}
 const score=Core.score(o,b,Date.now(),S.owned.includes("clock"));
 const base=o.type==="combo"?16:o.type==="burger"?10:9;
 let earned=base*(.4+.7*score/100);
 if(S.owned.includes("jukebox"))earned*=1.10;
 if(S.day%5===0)earned*=1.2;
 S.streak=score>=85?S.streak+1:0;
 S.bestStreak=Math.max(S.bestStreak,S.streak);
 if(S.streak>=3)earned+=2+Math.floor(S.streak/3);
 const effect=Core.reviewEffect(o,score,S.owned);
 const bonus=effect.bonus*(S.owned.includes("vip")?1.5:1);
 earned+=bonus;earned=Math.round(earned*100)/100;
 S.money+=earned;S.earned+=earned;S.served++;
 S.rep=clamp(S.rep+effect.rep,0,100);
 S.today.served++;S.today.earned+=earned;S.today.scores.push(score);
 if(o.special)S.today.reviews.push(effect.quote);
 if(score===100&&!S.awards.includes("perfect"))S.awards.push("perfect");
 if(o.special==="critic"&&score>=90&&!S.awards.includes("critic"))S.awards.push("critic");
 S.orders=S.orders.filter(x=>x.id!==o.id);delete S.builds[o.id];
 S.selected=S.orders[0]?.id||null;
 const unlocks=earnAwards();
 tone(score>=80?"ding":"cash");
 renderAll();
 $("#reviewCard").innerHTML='<span class="star-scatter">'+("★".repeat(clamp(Math.round(score/20),1,5)))+'</span><b>'+score+"% · "+money(earned)+'</b><p>'+effect.quote+'</p>';
 toast(score>=95?"PERFECT ORDER! "+money(earned):score>=80?"GREAT JOB! "+score+"% · "+money(earned):"ORDER SERVED · "+score+"% · "+money(earned));
 if(unlocks.length)setTimeout(()=>toast("🏆 Achievement unlocked: "+unlocks.join(", ")),1100);
 if(S.today.taken>=Core.quota(S)&&S.orders.length===0){
  setTimeout(()=>{if(S.today.taken>=Core.quota(S)&&!S.orders.length)showReport()},750);
 }else{
  makeGuest();save();
 }
}
function openModal(html){
 $("#modal").hidden=false;
 $("#modal").innerHTML='<div class="modal-panel">'+html+'</div>';
}
function closeModal(){const el=$("#modal");el.hidden=true;el.innerHTML=""}
function showShop(){
 stopPour();
 const tiles=Core.shop.map(g=>{
  const bought=S.owned.includes(g.id)||g.id==="pink";
  const equipped=g.type==="theme"&&S.theme===g.id;
  return '<div class="shop-card"><span class="shop-icon">'+g.icon+'</span><strong>'+g.title+'</strong><p>'+g.desc+'</p><button data-buy="'+g.id+'" '+(S.money<g.price&&!bought?"disabled":"")+'>'+(equipped?"EQUIPPED":bought?(g.type==="theme"?"EQUIP":"OWNED"):"BUY · "+money(g.price))+'</button></div>';
 }).join("");
 const badges=Core.achievements.map(a=>'<span class="award">'+(S.awards.includes(a.id)?"🏆 ":"🔒 ")+a.name+'</span>').join("");
 openModal('<div class="modal-head"><div><span class="overline">MAKE IT YOUR OWN</span><h2>Diner Customization ✨</h2><p>Buy decor, unlock functional kitchen upgrades, and keep growing your own restaurant. Wallet: <b>'+money(S.money)+'</b></p></div><button class="close-modal" data-action="close-modal" aria-label="Close">×</button></div><div class="shop-grid">'+tiles+'</div><div><b>YOUR ACHIEVEMENTS</b><div>'+badges+'</div></div><div class="modal-footer"><button class="modal-action alt" data-action="classic">PLAY CLASSIC VERSION ↗</button><button class="modal-action" data-action="close-modal">BACK TO KITCHEN</button></div>');
}
function showReport(){
 if(finishedDay)return;
 finishedDay=true;
 const avg=S.today.scores.length?Math.round(S.today.scores.reduce((a,b)=>a+b,0)/S.today.scores.length):0;
 const reviews=S.today.reviews.slice(-3).map(x=>'<p>✦ '+x+'</p>').join("")||'<p>Everyone went home happy. Tomorrow brings more surprises!</p>';
 openModal('<div class="modal-head"><div><span class="overline">CLOSING TIME · DAILY REPORT</span><h2>Day '+S.day+' Complete! 🎉</h2><p>You built, poured, served, and kept the diner running.</p></div></div><div class="report-grid"><div class="report-stat"><small>REVENUE</small><strong>'+money(S.today.earned)+'</strong></div><div class="report-stat"><small>SERVED</small><strong>'+S.today.served+'</strong></div><div class="report-stat"><small>QUALITY</small><strong>'+avg+'%</strong></div><div class="report-stat"><small>REPUTATION</small><strong>★ '+Math.round(S.rep)+'</strong></div></div><div><b>LOCAL BUZZ</b>'+reviews+'</div><div class="modal-footer"><button class="modal-action alt" data-action="shop">🛍 SPEND EARNINGS</button><button class="modal-action" data-action="next-day">START DAY '+(S.day+1)+' →</button></div>');
}
function nextDay(){
 S.day++;S.today={taken:0,served:0,earned:0,scores:[],reviews:[]};
 S.customer=null;S.grill=[null,null,null];S.rack=[];S.view="front";
 finishedDay=false;earnAwards();closeModal();makeGuest();renderAll();
 toast("Day "+S.day+" is open for business!");
}
function buy(id){
 const g=Core.shop.find(x=>x.id===id);
 if(!g)return;
 const owned=S.owned.includes(id);
 if(!owned){
  if(S.money<g.price){toast("Not enough money yet.");return}
  S.money-=g.price;S.owned.push(id);tone("cash");
 }
 if(g.type==="theme")S.theme=id;
 save();renderAll();showShop();
 toast(owned?"Theme equipped!":g.title+" purchased!");
}
function goClassic(){window.location.href="./classic.html"}
function tickGrill(){
 if(S.view!=="grill")return;
 $$(".grill-slot.active").forEach(el=>{
  const index=Number(el.dataset.index),p=S.grill[index];if(!p)return;
  const q=grillScore(p),pin=el.querySelector(".cook-pin");
  if(pin)pin.style.left=q.percent+"%";
  const svg=el.querySelector("svg");
  if(svg)svg.style.filter=q.quality==="burnt"?"brightness(.45)":q.quality==="good"?"saturate(1.3)":"none";
 });
}
function beginPour(index,button){
 const o=active(),b=build();
 if(!o?.shake||!b?.shake.size){toast("Choose a shake ticket and grab a cup from the shelf.");return}
 if(b.shake.slot!==index){toast("Move the cup underneath this flavor's nozzle first!");return}
 if(pouring)stopPour(false);
 const flavor=["vanilla","chocolate","strawberry"][index];
 if(b.shake.base&&b.shake.base!==flavor&&b.shake.fill>10){toast("That cup already has a different flavor. Start a fresh shake to switch.");return}
 b.shake.base=flavor;b.shake.fill=clamp(b.shake.fill+5,0,100);
 pouring={index,button,interval:null};
 button.classList.add("holding");
 const stream=$("#pourStream");if(stream){stream.classList.add("pouring");stream.style.left=(37+14*index)+"%";stream.style.background={vanilla:"#f0dfaa",chocolate:"#8b543a",strawberry:"#e795ac"}[flavor]}
 tone("pour");
 function update(){
  if(!pouring)return;
  b.shake.fill=clamp(b.shake.fill+(b.shake.size==="S"?2.6:b.shake.size==="M"?2:1.5),0,100);
  const cup=$(".cup-visual");if(cup)cup.innerHTML=visualCup(b.shake);
  const fill=$("#fillIndicator");if(fill)fill.style.width=b.shake.fill+"%";
  if(b.shake.fill>=100)stopPour();
 }
 update();
 pouring.interval=setInterval(update,90);
}
function stopPour(shouldRender=true){
 if(!pouring)return;
 clearInterval(pouring.interval);
 pouring.button.classList.remove("holding");
 pouring=null;
 if(shouldRender)renderAll();
}
function beginDrag(e,element){
 if(e.button!==0||drag||pouring)return;
 const token=element.dataset.drag;
 if(!token)return;
 const ghost=$("#dragSprite");
 let shape=element.querySelector(".food-svg")?.outerHTML||art("patty");
 if(token==="assembled-burger"){shape=art("topbun")}
 if(token==="active-cup"){shape=element.querySelector(".food-svg")?.outerHTML||art("cup")}
 ghost.innerHTML=shape;ghost.hidden=false;
 ghost.style.left=e.clientX+"px";ghost.style.top=e.clientY+"px";
 drag={token,element,startX:e.clientX,startY:e.clientY,prevX:e.clientX,distance:0,originalMix:build()?.shake?.stir||0};
 selectedProp=token;
 if(e.pointerId!==undefined&&element.setPointerCapture){
  try{element.setPointerCapture(e.pointerId)}catch(ex){}
 }
}
function moveDrag(e){
 if(!drag)return;
 const ghost=$("#dragSprite");
 ghost.style.left=e.clientX+"px";ghost.style.top=e.clientY+"px";
 const shift=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY);
 drag.distance=shift;
 if(drag.token==="active-cup"){
  const b=build();
  if(b?.shake&&b.shake.fill>=15){
   const difference=Math.abs(e.clientX-drag.prevX);
   if(difference>2){
    b.shake.stir=clamp(b.shake.stir+difference*.22,0,100);
    const indicator=$("#mixIndicator");
    if(indicator)indicator.style.width=b.shake.stir+"%";
   }
  }
 }
 drag.prevX=e.clientX;
}
function finishDrag(e){
 if(!drag)return;
 const current=drag;drag=null;
 $("#dragSprite").hidden=true;$("#dragSprite").innerHTML="";
 const token=current.token;
 const stage=$("#stage");
 const points=$$("[data-drop]").filter(zone=>{
  const r=zone.getBoundingClientRect();
  return e.clientX>=r.left-12&&e.clientX<=r.right+12&&e.clientY>=r.top-12&&e.clientY<=r.bottom+12;
 });
 const zone=points.sort((a,b)=>a.getBoundingClientRect().width-b.getBoundingClientRect().width)[0];
 if(e.type==="pointercancel"){renderAll();return}
 if(zone)performDrop(token,zone.dataset.drop,e,zone);
 else if(current.distance<9){
  // Touch accessibility: tap an object, then tap the target surface.
  selectedProp=token;
  toast("Picked up! Drag onto the work surface, or tap where you want to place it.");
  renderAll();
 }else if(token==="active-cup"){
  const s=build()?.shake;
  if(s&&s.stir>current.originalMix){
   tone("pop");toast("Mixed! "+Math.round(s.stir)+"% smoothness.");renderAll();
  }
 }else renderAll();
}
function performDrop(token,destination,e,zone){
 selectedProp=null;
 if(destination==="trash"){dropTrash(token);return}
 if(destination==="burger"){
  if(token.startsWith("ingredient:"))addIngredient(token.slice(11));
  else if(token.startsWith("rack:"))addPatty(token.slice(5));
  else toast("Pick up a patty or ingredient from the prep counter.");
  return;
 }
 if(destination.startsWith("shake:")){
  const slot=Number(destination.split(":")[1]);
  if(token.startsWith("cup:"))chooseCup(token.slice(4),slot);
  else if(token==="active-cup")moveCup(slot);
  else if(token.startsWith("syrup:")){
   const s=build()?.shake;if(s?.slot===slot)applySyrup(token.slice(6));else toast("Drop the syrup bottle onto the cup.");
  }else toast("Bring a cup from the shelf.");
  return;
 }
 if(destination==="finish-cup"){
  if(token.startsWith("topping:"))topShake(token.slice(8),e,zone);
  else toast("Drag a topping bowl onto the cup to decorate.");
  return;
 }
 if(destination==="finish-burger"&&token.startsWith("rack:")){toast("Assemble burgers at the cutting board first.");return}
}
function clickDropTarget(e){
 if(!selectedProp||drag)return;
 const zone=e.target.closest("[data-drop]");if(!zone)return;
 performDrop(selectedProp,zone.dataset.drop,e,zone);
}
function tick(){
 tickGrill();
 if(!$("#modal").hidden)return;
 if(S.today.taken>=Core.quota(S)&&S.orders.length===0&&!finishedDay&&S.today.taken>0)showReport();
}
document.addEventListener("click",e=>{
 const nav=e.target.closest("[data-view]");if(nav){setView(nav.dataset.view);return}
 const select=e.target.closest("[data-select]");if(select){chooseTicket(Number(select.dataset.select));return}
 const action=e.target.closest("[data-action]");
 if(action){
  switch(action.dataset.action){
   case "take":takeOrder();break;
   case "grill":if(!drag)clickGrill(Number(action.dataset.index));break;
   case "undo-burger":undoBurger();break;
   case "trash-burger":trashBurger();break;
   case "serve":serve();break;
   case "close-modal":if(finishedDay)showReport();else closeModal();break;
   case "shop":showShop();break;
   case "next-day":nextDay();break;
   case "classic":goClassic();break;
  }
  return;
 }
 const purchase=e.target.closest("[data-buy]");if(purchase){buy(purchase.dataset.buy);return}
 const drop=e.target.closest("[data-drop]");
 if(drop&&selectedProp&&!drag){clickDropTarget(e);return}
});
$("#shopOpen").addEventListener("click",showShop);
$("#audioToggle").addEventListener("click",()=>{S.muted=!S.muted;renderHud();save();toast(S.muted?"Sound off.":"Sound on.")});
document.addEventListener("pointerdown",e=>{
 const nozzle=e.target.closest("[data-pour]");
 if(nozzle){e.preventDefault();beginPour(Number(nozzle.dataset.pour),nozzle);return}
 const piece=e.target.closest("[data-drag]");
 if(piece){e.preventDefault();beginDrag(e,piece)}
});
document.addEventListener("pointermove",moveDrag);
document.addEventListener("pointerup",e=>{if(pouring)stopPour();if(drag)finishDrag(e)});
document.addEventListener("pointercancel",e=>{if(pouring)stopPour();if(drag)finishDrag(e)});
window.addEventListener("blur",()=>{if(pouring)stopPour();if(drag){drag=null;$("#dragSprite").hidden=true;renderAll()}});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&pouring)stopPour()});
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"){if(!finishedDay)closeModal();selectedProp=null;return}
 const target=e.target.closest("[data-drag]");
 if(target&&(e.key==="Enter"||e.key===" ")){e.preventDefault();selectedProp=target.dataset.drag;toast("Picked up! Select the spot to place it.");return}
 const drop=e.target.closest("[data-drop]");
 if(drop&&selectedProp&&(e.key==="Enter"||e.key===" ")){e.preventDefault();performDrop(selectedProp,drop.dataset.drop,{clientX:drop.getBoundingClientRect().left+drop.clientWidth/2,clientY:drop.getBoundingClientRect().top+drop.clientHeight/2},drop)}
});
makeGuest();renderAll();setInterval(tick,250);
window.ShakeStationDebug={state:()=>S,Core,grillScore,performDrop,renderAll};
})();