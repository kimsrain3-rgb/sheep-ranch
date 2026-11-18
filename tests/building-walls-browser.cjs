const {chromium}=require('playwright-core');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
(async()=>{
 const browser=await chromium.launch({executablePath:path.join(process.env.LOCALAPPDATA,'ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
 const output=path.resolve('.sites-runtime/wall-qa');await fs.mkdir(output,{recursive:true});
 const hooks=`
  const originalPainter=paintWorldLayers;
  paintWorldLayers=layers=>originalPainter(globalThis.__wallsOnly?layers.filter(l=>l.building):layers);
  globalThis.__wallQA={
   scene(yaw){
    paused=true;started=false;t=5;globalThis.__wallsOnly=true;globalThis.__reverseBuildingQA=false;
    sheep.forEach(a=>a.hiddenInBarn=true);companions.animals.forEach(a=>{a.hiddenInCoop=true;a.hiddenInLodge=true;});shepherd.insideLodge=true;
    view=outdoorView;view.yaw=yaw;view.pitch=.23;view.zoom=.95;
    Object.assign(player,{x:-20,z:39,tx:-20,tz:39});render();render();
   },
   order(reverse){globalThis.__reverseBuildingQA=reverse;render();},
   setupWalk(){
    globalThis.__wallsOnly=false;globalThis.__reverseBuildingQA=false;
    const a=sheep[0];Object.assign(a,{size:.8,x:-13.8,z:35,tx:-1.7,tz:35,state:'roam',walkGoal:null,walkRoute:null,hiddenInBarn:false,lock:null});
    Object.assign(player,{x:-8.5,z:34,tx:-8.5,tz:34});view.yaw=-.45;view.zoom=1.65;render();return {x:a.x,z:a.z};
   },
   walk(seconds){
    const a=sheep[0],samples=[];
    for(let i=0;i<seconds/.05;i++){const before={x:a.x,z:a.z};flock.move(a,.05,1.6,view.yaw);t+=.05;samples.push({x:a.x,z:a.z,step:Math.hypot(a.x-before.x,a.z-before.z)});}
    render();return samples;
   }
  };
 `;
 try{
  for(const [name,viewport] of [['desktop',{width:1280,height:800}],['phone',{width:390,height:844}]]){
   const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const source=(await fs.readFile('dist/app.js','utf8')).replace('for(const layer of layers)if(layer.building)buildingOcclusion.drawBuilding','for(const layer of (globalThis.__reverseBuildingQA?[...layers].reverse():layers))if(layer.building)buildingOcclusion.drawBuilding');
   await page.route('**/app.js?*',route=>route.fulfill({contentType:'text/javascript',body:source+hooks}));
   await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.locator('#start').click();
   await page.addStyleTag({content:'body > :not(#world){visibility:hidden!important}'});
   for(const [angle,yaw] of [['back',Math.PI],['side',Math.PI/2],['front',-.65]]){
    await page.evaluate(y=>__wallQA.scene(y),yaw);
    const normal=path.join(output,`${name}-${angle}.png`),reverse=path.join(output,`${name}-${angle}-reverse.png`);
    await page.screenshot({path:normal});await page.evaluate(()=>__wallQA.order(true));await page.screenshot({path:reverse});
    const code="from PIL import Image,ImageChops;import sys,json;d=ImageChops.difference(*[Image.open(p).convert('RGB') for p in sys.argv[1:]]);print(json.dumps({'pixels':sum(1 for c in d.getdata() if max(c)>10),'bbox':d.getbbox()}))";
    const difference=JSON.parse(execFileSync('python',['-c',code,normal,reverse],{encoding:'utf8'}));
    assert.ok(difference.pixels<220,`${name} ${angle}: building faces must stay opaque in either draw order (${JSON.stringify(difference)})`);
   }
   await page.evaluate(()=>__wallQA.setupWalk());await page.screenshot({path:path.join(output,`${name}-sheep-before.png`)});
   const samples=await page.evaluate(()=>__wallQA.walk(7));await page.screenshot({path:path.join(output,`${name}-sheep-corner.png`)});
   samples.push(...await page.evaluate(()=>__wallQA.walk(30)));await page.screenshot({path:path.join(output,`${name}-sheep-after.png`)});
   for(const a of samples){
    assert.ok(a.step<=.080001,'sheep stays at normal walking speed');
    assert.ok(!(a.x>-13.38&&a.x<-3.62&&a.z>29.92&&a.z<42.88),'the sheep body never intersects the coop wall');
   }
   const last=samples.at(-1);assert.ok(Math.hypot(last.x+1.7,last.z-35)<.31,'the sheep reaches the far side by walking around the walls');
   assert.deepEqual(errors,[]);console.log(name+': reversed building draw order, actual barn/coop/lodge overlaps and continuous sheep wall detour passed.');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
