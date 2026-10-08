(function(global){
"use strict";
const shapes={
lettuce:'<path d="M12 60Q2 47 17 38Q10 17 28 22Q38 4 53 16Q72 4 77 22Q96 24 85 43Q100 59 80 68Q75 88 57 77Q40 91 32 76Q13 81 12 60Z" fill="#65aa3d" stroke="#377739" stroke-width="5"/><path d="M22 56Q18 44 32 34Q39 21 55 27Q71 19 77 40Q85 55 65 64Q48 83 34 65Z" fill="#9bd95c"/><path d="M42 76L54 24M49 54L28 39M48 57L73 39M44 67L23 54M46 67L68 59" fill="none" stroke="#e6f6a4" stroke-width="4"/>',
tomato:'<circle cx="50" cy="51" r="40" fill="#d43a36" stroke="#a82d32" stroke-width="4"/><circle cx="50" cy="50" r="33" fill="#f66b58" stroke="#ffa391" stroke-width="4"/><path d="M48 18Q42 38 55 51Q69 43 76 39M54 50Q37 43 20 55M52 51Q63 68 51 81" fill="none" stroke="#f8a887" stroke-width="5"/><g fill="#ffe4a2"><ellipse cx="37" cy="34" rx="3" ry="5"/><ellipse cx="68" cy="36" rx="3" ry="5"/><ellipse cx="65" cy="66" rx="3" ry="5"/><ellipse cx="36" cy="66" rx="3" ry="5"/></g>',
onion:'<ellipse cx="47" cy="43" rx="36" ry="26" fill="none" stroke="#9a68a7" stroke-width="14"/><ellipse cx="47" cy="43" rx="36" ry="26" fill="none" stroke="#f0c4ed" stroke-width="8"/><ellipse cx="60" cy="59" rx="28" ry="19" fill="none" stroke="#92589c" stroke-width="13"/><ellipse cx="60" cy="59" rx="28" ry="19" fill="none" stroke="#edb1e8" stroke-width="7"/>',
pickles:'<ellipse cx="34" cy="43" rx="27" ry="24" fill="#a6bd45" stroke="#577d37" stroke-width="6"/><ellipse cx="34" cy="43" rx="20" ry="18" fill="#d4dc75"/><ellipse cx="65" cy="56" rx="27" ry="24" fill="#9cb63f" stroke="#527a33" stroke-width="6"/><ellipse cx="65" cy="56" rx="20" ry="18" fill="#d6df72"/><g fill="#f9e6a1"><circle cx="25" cy="33" r="3"/><circle cx="48" cy="51" r="3"/><circle cx="69" cy="59" r="3"/><circle cx="56" cy="69" r="3"/></g>',
cheese:'<path d="M8 35L69 15L92 61L32 82Z" fill="#d68d2e" stroke="#ae792d" stroke-width="5"/><path d="M8 27L68 9L91 55L33 76Z" fill="#ffda5e" stroke="#efb43e" stroke-width="4"/><path d="M18 30L66 15L82 51L35 68Z" fill="#fff2a6" opacity=".55"/>',
patty:'<ellipse cx="50" cy="64" rx="43" ry="27" fill="#633c31"/><path d="M8 51Q11 30 30 29Q48 16 62 28Q82 22 91 43Q100 62 81 70Q59 82 44 73Q24 79 10 65Z" fill="#9e603d" stroke="#613b2f" stroke-width="5"/><path d="M25 40l17 15M48 33l17 15M68 39l12 14M22 58l15 10M51 55l15 12" stroke="#5a342c" stroke-width="5"/><path d="M22 36Q45 26 71 37" stroke="#d99967" stroke-width="5" fill="none"/>',
burnt:'<ellipse cx="50" cy="60" rx="42" ry="27" fill="#392827" stroke="#241b20" stroke-width="6"/><path d="M20 40L34 61M44 34L58 58M68 35L79 58M30 69L52 51" stroke="#17161a" stroke-width="6"/>',
topbun:'<path d="M7 72Q11 13 51 13Q91 14 94 73Q50 87 7 72Z" fill="#dc9551" stroke="#a76a37" stroke-width="5"/><path d="M13 68Q18 22 51 21Q81 21 89 68Q56 81 13 68Z" fill="#f5b66f"/><g fill="#fff2c7"><ellipse cx="33" cy="40" rx="5" ry="2" transform="rotate(30 33 40)"/><ellipse cx="57" cy="30" rx="5" ry="2" transform="rotate(-30 57 30)"/><ellipse cx="72" cy="49" rx="5" ry="2"/><ellipse cx="42" cy="61" rx="5" ry="2"/></g>',
bottombun:'<path d="M5 53Q48 41 95 53L90 70Q68 87 49 83Q26 87 10 70Z" fill="#d3934e" stroke="#ad6d36" stroke-width="5"/><ellipse cx="50" cy="51" rx="44" ry="15" fill="#f9cc88" stroke="#bb783b" stroke-width="4"/>',
ketchup:'<rect x="25" y="28" width="50" height="57" rx="11" fill="#e84c44" stroke="#a33235" stroke-width="5"/><path d="M42 28L48 6Q50 2 54 6L60 28" fill="#e84c44" stroke="#a33235" stroke-width="4"/><rect x="36" y="47" width="29" height="22" rx="6" fill="#fff2d5"/><circle cx="50" cy="58" r="8" fill="#df413f"/><path d="M48 52L45 48M51 52L58 48" stroke="#5b9f55" stroke-width="3"/>',
whipped:'<path d="M17 77Q7 63 25 56Q15 43 36 39Q31 28 45 26Q47 8 57 18Q69 20 65 31Q84 36 76 49Q93 58 82 76Z" fill="#fffbfc" stroke="#e3cfdb" stroke-width="5"/><path d="M34 58Q42 45 59 45" stroke="#fff" stroke-width="6" fill="none"/>',
sprinkles:'<ellipse cx="50" cy="52" rx="38" ry="27" fill="#fff7e8"/><g stroke-width="6" stroke-linecap="round"><path d="M24 44l9 5M44 30l8 7M65 43l8-5M29 64l9-5" stroke="#e35f91"/><path d="M55 63l-4-10M72 57l8 7" stroke="#65b9c6"/><path d="M46 72l-3-8M60 29l6 6" stroke="#eab94f"/></g>',
cookie:'<circle cx="50" cy="50" r="36" fill="#d5a46f" stroke="#946044" stroke-width="6"/><g fill="#764a36"><circle cx="37" cy="33" r="6"/><circle cx="62" cy="42" r="7"/><circle cx="68" cy="64" r="6"/><circle cx="40" cy="64" r="7"/></g>',
strawberries:'<path d="M20 32Q36 19 51 32Q69 18 80 36Q78 69 50 84Q20 70 20 32Z" fill="#e64e62" stroke="#b7364c" stroke-width="5"/><path d="M24 29Q50 13 79 30L64 36L50 29L38 37Z" fill="#64a653"/><g fill="#ffd6aa"><circle cx="35" cy="47" r="3"/><circle cx="57" cy="47" r="3"/><circle cx="63" cy="62" r="3"/><circle cx="43" cy="69" r="3"/></g>',
cherry:'<path d="M50 52Q45 29 68 13Q78 11 84 20" stroke="#50894b" stroke-width="6" fill="none"/><circle cx="50" cy="63" r="24" fill="#c92e46" stroke="#8c283a" stroke-width="5"/><ellipse cx="42" cy="56" rx="10" ry="6" fill="#f4757c"/>',
trash:'<path d="M21 31H80L74 86H28Z" fill="#8b8592" stroke="#56525d" stroke-width="6"/><path d="M16 25H84M37 15H64" stroke="#5c5863" stroke-width="9" stroke-linecap="round"/><path d="M39 43V71M52 43V71M65 43V71" stroke="#dcd4e0" stroke-width="5"/>'
};
function cup(o){
 o=o||{};const fill=Math.max(0,Math.min(100,o.fill||0)),base=o.base||"vanilla";
 const col={vanilla:"#f5dfb2",chocolate:"#976148",strawberry:"#eda4bc"}[base];
 const sy={caramel:"#c6843e",chocolate:"#633628",strawberry:"#dc507c"}[o.syrup]||"#d98b69";
 const y=78-fill*.59;
 return '<path d="M14 16H86L75 91H26Z" fill="#ffffffae" stroke="#fff" stroke-width="5"/>'+(fill?'<path d="M20 '+y+'H81L73 85H31Z" fill="'+col+'"/><path d="M20 '+y+'Q50 '+(y-8)+' 81 '+y+'" stroke="#fff" stroke-opacity=".55" stroke-width="4" fill="none"/>':'')+'<path d="M27 31L38 79M48 31L58 80M71 32L64 83" stroke="#de6499" stroke-width="5" opacity=".7"/><circle cx="51" cy="54" r="17" fill="#e85c9a"/><text x="51" y="60" font-size="16" text-anchor="middle" fill="white" font-weight="900" font-family="Arial">SS</text>'+(o.syrup?'<path d="M32 '+(y+8)+'Q45 '+(y+19)+' 57 '+(y+7)+' T76 '+(y+7)+'" fill="none" stroke="'+sy+'" stroke-width="5"/>':'')+'<path d="M13 17H87" stroke="#fff" stroke-width="7" stroke-linecap="round"/>';
}
function bottle(o){
 const palette={caramel:["#e9b86e","#b97d3f"],chocolate:["#88533b","#54322c"],strawberry:["#f37ea3","#c13e69"]}[o.flavor]||["#88533b","#54322c"];
 return '<rect x="28" y="28" width="46" height="62" rx="12" fill="'+palette[1]+'" stroke="#754951" stroke-width="4"/><rect x="32" y="30" width="38" height="55" rx="10" fill="'+palette[0]+'"/><path d="M44 30V13Q44 8 51 8Q57 8 57 13V30" fill="'+palette[1]+'"/><rect x="38" y="52" width="26" height="22" rx="5" fill="#fff1df"/><circle cx="51" cy="63" r="9" fill="'+palette[1]+'"/><path d="M39 34v13" stroke="#fff" stroke-opacity=".5" stroke-width="4"/>';
}
function sprite(name,options){
 const shape=name==="cup"?cup(options):name==="bottle"?bottle(options):shapes[name]||shapes.lettuce;
 return '<svg class="food-svg food-'+name+'" viewBox="0 0 100 100" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">'+shape+'</svg>';
}
global.ShakeArt={sprite};
})(window);