(function(global){
"use strict";
const names=["Maya","Theo","Lena","Devin","Nora","Miles","Avery","Jules","Sam","Riley","Sage","Robin","Harper","Jamie","Rowan"];
const skins=["#efc3a0","#e7ae87","#cf9271","#b37755","#8a5943","#654231"];
const hairs=["#493334","#825541","#a5703d","#282732","#67333e","#d4a263"];
const shirts=["#78bfd3","#e986a9","#90b68c","#f1c87b","#9793c8","#c17d94"];
const toppings=["lettuce","tomato","onion","pickles","cheese","ketchup"];
const shakeTops=["whipped","sprinkles","cookie","strawberries","cherry"];
const bases=["vanilla","chocolate","strawberry"],syrups=["chocolate","strawberry","caramel"],sizes=["S","M","L"];
const shop=[
{id:"pink",title:"Classic Pink",desc:"The original strawberry-and-cream diner look.",price:0,icon:"🍓",type:"theme"},
{id:"mint",title:"Mint Makeover",desc:"A fresh mint-and-cream diner theme.",price:30,icon:"🎨",type:"theme"},
{id:"night",title:"Moonlight Diner",desc:"Blue, lavender and midnight sparkle.",price:45,icon:"🌙",type:"theme"},
{id:"neon",title:"Neon Sign",desc:"Give the shop a little more sparkle.",price:24,icon:"💡",type:"decor"},
{id:"plants",title:"Indoor Jungle",desc:"Decorative greenery for the counter.",price:30,icon:"🌿",type:"decor"},
{id:"rack",title:"Extra Patty Shelf",desc:"Store 10 cooked patties instead of 6.",price:40,icon:"🍔",type:"upgrade"},
{id:"jukebox",title:"Retro Jukebox",desc:"10% extra money earned as tips.",price:65,icon:"🎵",type:"upgrade"},
{id:"vip",title:"VIP Booth",desc:"Reviewer bonuses are worth 50% more.",price:90,icon:"⭐",type:"upgrade"},
{id:"clock",title:"Kitchen Timer",desc:"Customer patience lasts longer.",price:48,icon:"⏰",type:"upgrade"},
{id:"poster",title:"Diner Artwork",desc:"Add an extra touch to the entrance.",price:20,icon:"🖼️",type:"decor"}
];
const achievements=[
{id:"first",name:"First Serve",detail:"Serve your first customer."},
{id:"perfect",name:"Picture Perfect",detail:"Earn a perfect order score."},
{id:"streak",name:"On a Roll",detail:"Serve 5 great orders consecutively."},
{id:"critic",name:"Critic Approved",detail:"Impress a food critic."},
{id:"day3",name:"Regular Spot",detail:"Reach day 3."},
{id:"rich",name:"Big Spender",detail:"Earn $250 total."}
];
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function choose(list,count){
 const a=[...list];for(let i=a.length-1;i>0;i--){const n=Math.floor(Math.random()*(i+1));[a[i],a[n]]=[a[n],a[i]]}
 return a.slice(0,count);
}
function build(){return {layers:[],patty:null,shake:{size:null,slot:null,base:null,fill:0,stir:0,syrup:null,syrupAmount:0,toppings:[]}}}
function order(day=1,rep=50){
 const roll=Math.random();
 const type=roll<.32?"burger":roll<.64?"shake":"combo";
 let special=null;
 const v=Math.random();
 if(v<.08)special="critic";else if(v<.20)special="influencer";else if(v<.27&&day>1)special="regular";
 const o={id:0,name:pick(names),type,special,burger:null,shake:null,avatar:{skin:pick(skins),hair:pick(hairs),shirt:pick(shirts)},createdAt:Date.now()};
 if(type!=="shake")o.burger={toppings:choose(toppings,2+Math.floor(Math.random()*3))};
 if(type!=="burger")o.shake={size:pick(sizes),base:pick(bases),syrup:pick(syrups),toppings:choose(shakeTops,1+Math.floor(Math.random()*3))};
 return o;
}
function ready(o,b){
 if(!o||!b)return false;
 if(o.burger){
  if(!b.patty||!b.layers.includes("patty")||!b.layers.includes("topbun"))return false;
 }
 if(o.shake){
  const s=b.shake;
  if(!s.size||!s.base||s.fill<55||s.stir<30||!s.syrup||s.syrupAmount<10||!s.toppings.length)return false;
 }
 return true;
}
function score(o,b,now=Date.now(),clock=false){
 if(!ready(o,b))return 0;
 let total=0,n=0;
 if(o.burger){
  n++;
  const correct=["patty",...o.burger.toppings,"topbun"],given=b.layers;
  const matched=correct.reduce((a,x,i)=>a+(x===given[i]?1:0),0)/correct.length;
  const extra=Math.max(0,given.length-correct.length)*.08;
  const quality=Math.max(0,Math.min(1,Number(b.patty.score||0)/100));
  total+=Math.max(0,.72*matched+.28*quality-extra);
 }
 if(o.shake){
  n++;
  const wanted=o.shake,s=b.shake;
  const qty=Math.min(1,wanted.toppings.length/Math.max(1,s.toppings.length));
  const tops=wanted.toppings.filter(t=>s.toppings.some(p=>p.type===t)).length/wanted.toppings.length;
  const base=[s.size===wanted.size,s.base===wanted.base,s.syrup===wanted.syrup].filter(Boolean).length/3;
  const pour=s.fill>=65&&s.fill<=92?1:Math.max(0,1-Math.abs(s.fill-78)/80);
  const mix=s.stir>=55&&s.stir<=95?1:Math.min(1,s.stir/55);
  const syrup=s.syrupAmount>=18&&s.syrupAmount<=65?1:Math.max(0,1-Math.abs(s.syrupAmount-35)/70);
  total+=.36*base+.18*pour+.16*mix+.10*syrup+.20*tops*qty;
 }
 const waited=Math.max(0,(now-(o.takenAt||now))/1000);
 const grace=clock?240:180;
 const lost=Math.max(0,(waited-grace)/18);
 return Math.max(0,Math.min(100,Math.round(total/Math.max(1,n)*100-lost)));
}
function newSave(){
 return {version:2,day:1,money:0,rep:50,served:0,earned:0,streak:0,bestStreak:0,owned:[],theme:"pink",awards:[],today:{taken:0,served:0,earned:0,scores:[],reviews:[]},orders:[],selected:null,nextOrderId:1,grill:[null,null,null],rack:[],builds:{},customer:null,customerToken:0,view:"front",muted:false};
}
function quota(s){return 6+Math.min(3,Math.max(0,Math.floor((s.rep-50)/16)))}
function goal(s){return 65+s.day*8}
function cleaned(s){
 const base=newSave();
 if(!s||typeof s!=="object")return base;
 if(s.version!==2)return base;
 const o={...base,...s};
 o.today={...base.today,...s.today};
 o.owned=Array.isArray(s.owned)?s.owned.filter(x=>shop.some(z=>z.id===x)):[];
 o.awards=Array.isArray(s.awards)?s.awards.filter(x=>achievements.some(z=>z.id===x)):[];
 o.orders=Array.isArray(s.orders)?s.orders.slice(0,4):[];
 o.grill=Array.isArray(s.grill)?s.grill.slice(0,3):base.grill;
 while(o.grill.length<3)o.grill.push(null);
 o.rack=Array.isArray(s.rack)?s.rack:[];
 o.builds=s.builds&&typeof s.builds==="object"?s.builds:{};
 o.money=Math.max(0,Number(s.money)||0);
 o.rep=Math.min(100,Math.max(0,Number.isFinite(Number(s.rep))?Number(s.rep):50));
 o.day=Math.max(1,Math.round(Number(s.day)||1));
 o.nextOrderId=Math.max(1,Math.round(Number(s.nextOrderId)||1));
 o.view=["front","grill","burger","shake","finish"].includes(s.view)?s.view:"front";
 o.theme=["pink","mint","night"].includes(s.theme)?s.theme:"pink";
 if(!o.orders.some(x=>x.id===o.selected))o.selected=o.orders[0]?.id||null;
 return o;
}
function reviewEffect(o,grade,owned=[]){
 if(o.special==="critic")return grade>=90?{rep:12,bonus:8,quote:"The critic loved every bite! ★★★★★"}:{rep:grade<65?-14:-7,bonus:0,quote:"The critic wasn't impressed. Keep practicing!"};
 if(o.special==="influencer")return grade>=85?{rep:15,bonus:10,quote:"Your shake just went viral! More people know the diner."}:{rep:grade<65?-10:-4,bonus:0,quote:"That influencer's followers noticed the mix-up."};
 if(o.special==="regular")return grade>=80?{rep:4,bonus:4,quote:"A regular says they'll bring their friends next time."}:{rep:-3,bonus:0,quote:"Your regular hopes for a better meal tomorrow."};
 return grade>=90?{rep:2,bonus:0,quote:"Another happy customer!"}:grade<65?{rep:-2,bonus:0,quote:"That wasn't your best meal."}:{rep:0,bonus:0,quote:"Order delivered."};
}
global.ShakeCore={shop,achievements,build,order,ready,score,newSave,quota,goal,cleaned,reviewEffect};
})(window);