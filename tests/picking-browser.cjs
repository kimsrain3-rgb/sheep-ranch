const {chromium}=require('playwright-core'),fs=require('node:fs/promises'),{existsSync}=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const executable=process.env.BROWSER_EXECUTABLE||[path.join(process.env.LOCALAPPDATA||'','ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'),'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
 const browser=await chromium.launch({executablePath:executable,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
 const output=path.resolve('.sites-runtime/picking-qa');await fs.mkdir(output,{recursive:true});
 const hooks=`
  const simulatePicking=update;update=()=>{};globalThis.requestAnimationFrame=()=>0;
  globalThis.__pickingQA={
   state(){return {selected:selected?.id,care:interaction.active?.animal.id,phase:interaction.active?.phase,barnTrip:barnVisit.trip,barnInside:barnVisit.inside,farmTrip:farmVisit.trip,lodgeTrip:lodgeVisit.trip,walking:!!outdoorWalk,modelReady:document.querySelector('#world').dataset.buildings==='three-webgl'};},
   advance(seconds){for(let i=0;i<seconds/.05;i++)simulatePicking(.05);render();return this.state();},
   scene(mode){
    paused=false;started=true;t=5;cancelBarnTrip();cancelLodgeTrip();interaction.cancel(view);interaction.supplyTrip=false;selected=null;marker=null;outdoorWalk=null;shelter.active=false;feeding=false;hammocking=false;seated=false;
    sheep.forEach(a=>{a.hiddenInBarn=true;a.screen=null;});companions.animals.forEach(a=>{a.hiddenInCoop=true;a.hiddenInLodge=true;});shepherd.insideLodge=true;shepherd.screen=null;
    Object.assign(player,{x:-29,z:24,tx:-29,tz:24});view=outdoorView;view.zoom=3.4;view.pitch=.23;view.yaw=mode==='turnedGrass'?Math.PI:0;
    const kind=mode.startsWith('building:')?mode.split(':')[1]:null;
    if(kind){const at=CONFIG[kind].entrance;player.x=player.tx=at.x;player.z=player.tz=at.z-4;view.zoom=1.3;}
    if(mode==='turnedGrass')player.x=player.tx=-25,player.z=player.tz=27;
    if(mode==='frontSheep'||mode==='hiddenSheep')Object.assign(sheep[1],{x:-29,z:mode==='frontSheep'?25:32,size:1,state:'roam',hiddenInBarn:false,walking:false,hop:0,lock:null,careContact:false});
    render();render();
    if(mode.endsWith('Sheep')){
      const a=sheep[1],point=project(a.x,a.z,1.3);
      return {point,building:buildingOcclusion.buildingAt(point.x,point.y),occluded:buildingOcclusion.occluded(point.x,point.y,project(a.x,a.z).depth)};
    }
    const b=barnVisit.screen;
    for(let y=H*.45;y<H*.92;y+=5)for(let x=W*.2;x<W*.8;x+=5){
      const actual=buildingOcclusion.buildingAt(x,y);
      if(kind?actual===kind:mode==='wall'?actual==='barn':!actual&&view.ground(x,y,W,H)&&b&&Math.abs(x-b.x)<b.w*.5&&y<b.y+15&&y>b.y-b.h)return {point:{x,y},building:actual};
    }
    throw Error('No representative '+mode+' pixel found');
   }
  };
 `;
 try{
  for(const [name,viewport] of [['desktop',{width:1280,height:800}],['phone',{width:390,height:844}]]){
   const page=await browser.newPage({viewport,hasTouch:name==='phone',deviceScaleFactor:name==='phone'?2:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const source=await fs.readFile('dist/app.js','utf8');await page.route('**/app.js?*',route=>route.fulfill({contentType:'text/javascript',body:source+hooks}));
   await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.locator('#start').click();
   await page.addStyleTag({content:'body > :not(#world){visibility:hidden!important}'});
   const tap=async p=>name==='phone'?page.touchscreen.tap(p.x,p.y):page.mouse.click(p.x,p.y);
   const front=await page.evaluate(()=>__pickingQA.scene('frontSheep'));
   assert.equal(front.building,'barn','a real barn wall is behind the sheep');assert.equal(front.occluded,false,'the sheep is in front of the wall');
   await page.screenshot({path:path.join(output,name+'-wall-front-sheep.png')});await tap(front.point);
   let state=await page.evaluate(()=>__pickingQA.state());assert.equal(state.care,'sheep-1');assert.equal(state.barnTrip,null);assert.equal(state.barnInside,false);
   state=await page.evaluate(()=>__pickingQA.advance(2));assert.equal(state.phase,'playing','real selected sheep can be approached and petted');assert.equal(state.barnInside,false);
   for(const mode of ['grass','turnedGrass']){
    const empty=await page.evaluate(m=>__pickingQA.scene(m),mode);assert.equal(empty.building,null);
    if(mode==='turnedGrass')await page.screenshot({path:path.join(output,name+'-looking-out-empty-grass.png')});
    await tap(empty.point);state=await page.evaluate(()=>__pickingQA.state());
    assert.equal(state.barnTrip,null,mode+': empty grass does not enter a barn');assert.equal(state.care,undefined);assert.equal(state.walking,true,mode+': grass starts ordinary walking');
   }
   const hidden=await page.evaluate(()=>__pickingQA.scene('hiddenSheep'));assert.equal(hidden.building,'barn');assert.equal(hidden.occluded,true);
   await tap(hidden.point);state=await page.evaluate(()=>__pickingQA.state());assert.equal(state.care,undefined);assert.equal(state.barnTrip,'enter','a solid wall hides its rear sheep and still selects its building');
   for(const kind of ['coop','lodge','shed']){const target=await page.evaluate(k=>__pickingQA.scene('building:'+k),kind);assert.equal(target.building,kind);await tap(target.point);state=await page.evaluate(()=>__pickingQA.state());assert.equal(kind==='lodge'?state.lodgeTrip:state.farmTrip,'enter',kind+': visible building surface still starts entry');}
   assert.deepEqual(errors,[]);console.log(name+': mouse/touch at 340% selects foreground sheep and starts petting; empty grass including the outward view walks; hidden sheep cannot be touched through a wall.');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
