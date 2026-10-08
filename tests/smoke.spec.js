const {test,expect}=require("@playwright/test");

test.beforeEach(async({page})=>{
  await page.goto("/");
  await expect(page.locator(".front-scene")).toBeVisible();
});

test("starts without JavaScript errors; grill can cook ahead and trash mistakes",async({page})=>{
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.locator('[data-view="grill"]').click();
  await expect(page.locator(".grill-slot")).toHaveCount(3);
  await page.locator(".grill-slot").first().click();
  await expect(page.locator(".grill-slot.active")).toHaveCount(1);
  await page.locator(".grill-slot.active").dragTo(page.locator('[data-drop="trash"]'));
  await expect(page.locator(".grill-slot.active")).toHaveCount(0);
  expect(await page.evaluate(()=>window.ShakeStationDebug.state().rack.length)).toBe(0);
  expect(errors).toEqual([]);
});

test("serves a real combo using drag-and-drop food and a physical shake",async({page})=>{
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.locator(".take-ticket").click();
  await page.evaluate(()=>{
    const D=window.ShakeStationDebug,s=D.state(),o=s.orders[0];
    o.type="combo";
    o.burger={toppings:["cheese","lettuce"]};
    o.shake={size:"M",base:"vanilla",syrup:"caramel",toppings:["cherry"]};
    D.renderAll();
  });
  await page.locator('[data-view="grill"]').click();
  await page.locator(".grill-slot").first().click();
  await page.evaluate(()=>window.ShakeStationDebug.state().grill[0].start=Date.now()-8500);
  await page.locator(".grill-slot.active").first().click();
  expect(await page.evaluate(()=>window.ShakeStationDebug.state().rack.length)).toBe(1);
  await page.locator('[data-view="burger"]').click();
  const board=page.locator('[data-drop="burger"]');
  await page.locator('.patty-drawer [data-drag^="rack:"]').first().dragTo(board);
  await page.locator('[data-drag="ingredient:cheese"]').dragTo(board);
  await page.locator('[data-drag="ingredient:lettuce"]').dragTo(board);
  await page.locator('[data-drag="ingredient:topbun"]').dragTo(board);
  expect(await page.evaluate(()=>{
    const s=window.ShakeStationDebug.state(),o=s.orders[0];
    return s.builds[o.id].layers.join(",");
  })).toBe("patty,cheese,lettuce,topbun");
  await page.locator('[data-view="shake"]').click();
  await page.locator('[data-drag="cup:M"]').dragTo(page.locator('[data-drop="shake:0"]'));
  await expect(page.locator(".cup-visual")).toBeVisible();
  const nozzle=page.locator('[data-pour="0"]');
  await nozzle.hover();await page.mouse.down();await page.waitForTimeout(2900);await page.mouse.up();
  const cup=page.locator(".cup-visual");
  let b=await cup.boundingBox();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
  await page.mouse.down();
  for(let i=0;i<5;i++){
    await page.mouse.move(b.x+b.width/2+33,b.y+b.height/2,{steps:3});
    await page.mouse.move(b.x+b.width/2-33,b.y+b.height/2,{steps:3});
  }
  await page.mouse.up();
  await page.locator('[data-drag="syrup:caramel"]').dragTo(page.locator('[data-drop="shake:0"]'));
  await page.locator('[data-view="finish"]').click();
  await page.locator('[data-drag="topping:cherry"]').dragTo(page.locator('[data-drop="finish-cup"]'));
  await expect(page.locator('[data-action="serve"]')).toBeEnabled();
  await page.locator('[data-action="serve"]').click();
  expect(await page.evaluate(()=>window.ShakeStationDebug.state().served)).toBe(1);
  expect(await page.evaluate(()=>window.ShakeStationDebug.state().money)).toBeGreaterThan(0);
  await page.reload();
  expect(await page.evaluate(()=>window.ShakeStationDebug.state().served)).toBe(1);
  expect(errors).toEqual([]);
});

test("two orders keep independent burgers and a shop purchase persists",async({page})=>{
  await page.locator(".take-ticket").click();
  await page.locator('[data-view="front"]').click();
  await page.locator(".take-ticket").click();
  await page.evaluate(()=>{
    const D=window.ShakeStationDebug,s=D.state();
    s.orders.forEach(o=>{o.type="burger";o.burger={toppings:["cheese","onion"]};o.shake=null});
    s.rack.push({id:1,score:99,quality:"good"},{id:2,score:85,quality:"good"});
    D.renderAll();
  });
  await page.locator('[data-view="burger"]').click();
  let orderIds=await page.evaluate(()=>window.ShakeStationDebug.state().orders.map(o=>o.id));
  await page.locator('[data-select="'+orderIds[0]+'"]').click();
  await page.locator('.patty-drawer [data-drag="rack:1"]').dragTo(page.locator('[data-drop="burger"]'));
  await page.locator('[data-select="'+orderIds[1]+'"]').click();
  await page.locator('.patty-drawer [data-drag="rack:2"]').dragTo(page.locator('[data-drop="burger"]'));
  expect(await page.evaluate(()=>{
    const s=window.ShakeStationDebug.state(),[a,b]=s.orders;
    return s.builds[a.id].patty.id!==s.builds[b.id].patty.id && s.rack.length===0;
  })).toBe(true);
  await page.evaluate(()=>{const D=window.ShakeStationDebug;D.state().money=150;D.renderAll()});
  await page.locator("#shopOpen").click();
  await page.locator('[data-buy="mint"]').click();
  expect(await page.evaluate(()=>window.ShakeStationDebug.state().theme)).toBe("mint");
  await page.reload();
  expect(await page.evaluate(()=>window.ShakeStationDebug.state().theme)).toBe("mint");
});