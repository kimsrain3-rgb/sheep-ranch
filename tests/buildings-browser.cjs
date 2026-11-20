// Run against an existing local preview. A separate headless browser is used;
// no user tabs, profiles, or game saves are modified.
const {chromium}=require('playwright-core');
const {readFile,mkdir}=require('node:fs/promises');
const {existsSync}=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const executable=process.env.BROWSER_EXECUTABLE||[
  path.join(process.env.LOCALAPPDATA||'','ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'),
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
 ].find(p=>existsSync(p));
 const browser=await chromium.launch({...(executable?{executablePath:executable}:{}),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
 const output=process.env.BUILDINGS_QA_OUTPUT||path.resolve('.sites-runtime/buildings-qa');await mkdir(output,{recursive:true});
 try{
  for(const [name,viewport] of [['desktop',{width:1440,height:900}],['phone',{width:390,height:844}]]){
   const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   // Test-only access to the real app's state. The shipped source has no hooks.
   const source=await readFile(path.resolve('dist/app.js'),'utf8');
   await page.route('**/app.js?*',route=>route.fulfill({contentType:'text/javascript',body:source+`
    globalThis.__buildingQA={
      place(x,z,yaw=0){cancelBarnTrip();cancelLodgeTrip();cancelHammockWalk();interaction.cancel(view);player.x=player.tx=x;player.z=player.tz=z;outdoorView.yaw=yaw;outdoorView.zoom=1.1;following=true;render();},
      step(seconds){for(let i=0;i<seconds/.05;i++){t+=.05;update(.05);}render();},
      state(){return {farmInside:farmVisit.inside,kind:farmVisit.kind,player:{...player},farmTrip:farmVisit.trip,barn:barnVisit.inside,lodge:lodgeVisit.inside,floor:lodgeVisit.floor,lodgeCamera:lodgeView.basis(innerWidth,innerHeight),screens:{coop:coopScreen,shed:shedScreen,lodge:lodgeScreen}};},
      rotate(yaw,pitch){view.yaw=yaw;if(pitch!==undefined)view.pitch=pitch;render();},houseWalk(x,z){lodgeVisit.walkTo({x,z},player);},meetHost(){shepherd.insideLodge=true;requestShepherdTalk();},
    };` }));
   const response=await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});assert.equal(response.status(),200);
   await page.locator('#start').click();
   assert.equal(await page.locator('#world').getAttribute('data-buildings'),'three-webgl','actual Three.js GPU rendering is active');
   await page.evaluate(()=>__buildingQA.place(-40,32,-.45));
   await page.screenshot({path:path.join(output,`${name}-3d-buildings.png`)});
   if(name==='phone'){
    await page.locator('#mobile-menu-toggle').click();
    assert.ok(await page.locator('#coop-enter').isVisible());assert.ok(await page.locator('#shed-enter').isVisible());
    await page.locator('#mobile-menu-close').click();
   }
   // The buttons exercise real controllers; advancing the simulation saves
   // waiting several real minutes for the four normal-speed walking trips.
   for(const [kind,point] of [['coop',[-8.5,27]],['shed',[24,44]]]){
    await page.evaluate(p=>__buildingQA.place(...p),point);
    if(name==='phone')await page.locator('#mobile-menu-toggle').click();
    if(name==='desktop'){
      const screen=(await page.evaluate(()=>__buildingQA.state())).screens[kind];
      await page.locator('#world').click({position:{x:screen.x,y:Math.max(220,screen.y-screen.h*.45)}});
    }else await page.locator('#'+kind+'-enter').click();
    assert.equal((await page.evaluate(()=>__buildingQA.state())).farmInside,false,'entry begins with an outdoor walk');
    await page.evaluate(()=>__buildingQA.step(12));
    let state=await page.evaluate(()=>__buildingQA.state());assert.ok(state.farmInside);assert.equal(state.kind,kind);
    assert.ok(await page.locator('#farm-room-leave').isVisible());assert.ok(await page.locator('#farm-room-status').isVisible());
    await page.screenshot({path:path.join(output,`${name}-${kind}-inside.png`)});
    await page.keyboard.down('w');await page.evaluate(()=>__buildingQA.step(.8));await page.keyboard.up('w');
    const moved=await page.evaluate(()=>__buildingQA.state());assert.ok(moved.player.z>state.player.z+.5,'visitor can walk inside');
    await page.evaluate(()=>__buildingQA.rotate(1.6));
    await page.screenshot({path:path.join(output,`${name}-${kind}-walls.png`)});
    await page.locator('#farm-room-leave').click();await page.evaluate(()=>__buildingQA.step(12));
    state=await page.evaluate(()=>__buildingQA.state());assert.equal(state.farmInside,false);assert.equal(state.farmTrip,null);
   }
   {
    await page.evaluate(()=>__buildingQA.place(-46,40));if(name==='phone')await page.locator('#mobile-menu-toggle').click();await page.locator('#lodge-enter').click();await page.evaluate(()=>__buildingQA.step(12));
    let house=await page.evaluate(()=>__buildingQA.state());assert.equal(house.lodge,true);assert.ok(Math.abs(house.lodgeCamera.x-house.player.x)<1);assert.ok(house.lodgeCamera.z>0&&house.lodgeCamera.z<house.player.z);assert.equal(house.lodgeCamera.height,1.65);
    assert.equal(await page.locator('#world').getAttribute('data-lodge-interior'),'eye-height-three');
    await page.screenshot({path:path.join(output,name+'-lodge-entry.png')});
    const beforeTurn=await page.evaluate(()=>__buildingQA.state());
    await page.mouse.move(viewport.width*.5,viewport.height*.55);await page.mouse.down();
    await page.mouse.move(viewport.width*.5+60,viewport.height*.55-45,{steps:5});await page.mouse.up();
    const afterTurn=await page.evaluate(()=>__buildingQA.state());
    assert.ok(Math.abs(afterTurn.lodgeCamera.sy-beforeTurn.lodgeCamera.sy)>.15,'dragging turns the head');
    assert.ok(afterTurn.lodgeCamera.z>0&&Math.abs(afterTurn.lodgeCamera.x)<5.5,'the rotating camera stays inside the house');

    await page.evaluate(()=>{__buildingQA.houseWalk(0,5);__buildingQA.step(8);__buildingQA.rotate(-Math.PI/2,.08);});
    await page.screenshot({path:path.join(output,name+'-lodge-bed.png')});
    await page.keyboard.down('w');await page.evaluate(()=>__buildingQA.step(1.5));await page.keyboard.up('w');
    let stopped=await page.evaluate(()=>__buildingQA.state());assert.ok(stopped.player.x>-2.04,'walking cannot pass through the bed');
    await page.evaluate(()=>__buildingQA.step(.5));
    let rested=await page.evaluate(()=>__buildingQA.state());assert.ok(Math.hypot(stopped.player.x-rested.player.x,stopped.player.z-rested.player.z)<.001,'releasing the key stops walking immediately');
    if(name==='desktop'){
      await page.evaluate(()=>{__buildingQA.meetHost();__buildingQA.step(10);});
      assert.ok(await page.locator('#shepherd-chat').isVisible(),'face-to-face indoor conversation still opens');
      await page.locator('#shepherd-minimize').click();
    }

    await page.evaluate(()=>__buildingQA.rotate(0,-.8));
    await page.screenshot({path:path.join(output,name+'-lodge-ceiling.png')});
    await page.locator('#lodge-stairs').click();await page.evaluate(()=>__buildingQA.step(12));assert.equal((await page.evaluate(()=>__buildingQA.state())).floor,2);
    await page.evaluate(()=>{__buildingQA.houseWalk(0,-1.05);__buildingQA.step(12);__buildingQA.rotate(Math.PI,.08);});
    house=await page.evaluate(()=>__buildingQA.state());assert.ok(house.player.z<0,'the visitor can physically walk onto the balcony');
    await page.screenshot({path:path.join(output,name+'-lodge-balcony.png')});
    await page.locator('#lodge-leave').click();await page.evaluate(()=>__buildingQA.step(20));assert.equal((await page.evaluate(()=>__buildingQA.state())).lodge,false);
    if(name==='desktop'){await page.evaluate(()=>__buildingQA.place(-25,24));await page.locator('#barn-enter').click();await page.evaluate(()=>__buildingQA.step(12));assert.equal((await page.evaluate(()=>__buildingQA.state())).barn,true);
    assert.equal(await page.locator('#world').getAttribute('data-barn-interior'),'eye-height-three','the barn room uses the shared Three.js renderer');
    await page.screenshot({path:path.join(output,name+'-barn-inside.png')});
    await page.locator('#barn-leave').click();await page.evaluate(()=>__buildingQA.step(12));assert.equal((await page.evaluate(()=>__buildingQA.state())).barn,false);}
   }
   assert.deepEqual(errors,[],'no browser runtime errors');console.log(`${name}: Three.js GPU buildings, room walking/exit, labels and menu passed.`);await page.close();
  }
  console.log('Screenshots: '+output);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
