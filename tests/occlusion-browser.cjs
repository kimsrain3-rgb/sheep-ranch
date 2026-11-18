const {chromium}=require('playwright-core');
const fs=require('node:fs/promises'),{existsSync}=require('node:fs');
const path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
(async()=>{
 const executable=process.env.BROWSER_EXECUTABLE||[
  path.join(process.env.LOCALAPPDATA||'','ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'),
  'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
 ].find(existsSync);
 const browser=await chromium.launch({...(executable?{executablePath:executable}:{}),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
 const output=path.resolve('.sites-runtime/occlusion-qa');await fs.mkdir(output,{recursive:true});
 const hooks=`
  const originalWorldPainter=paintWorldLayers;
  paintWorldLayers=layers=>originalWorldPainter(globalThis.__targetBuilding?layers.filter(layer=>layer.building?layer.building===globalThis.__targetBuilding:layer.actor).map(layer=>layer.actor&&globalThis.__focusSheep?{...layer,focused:true}:layer):layers);
  globalThis.__occlusionQA={
   scene(kind,yaw,where){
    globalThis.__targetBuilding=kind;paused=true;started=false;selected=null;marker=null;interaction.active=null;feeding=false;t=5;particles.length=0;
    const spec=CONFIG[kind],depth=kind==='lodge'?13.5:kind==='barn'?18:kind==='coop'?9:0;
    const center={x:spec.x,z:(spec.entrance?.z??spec.z)+depth/2};
    if(kind==='barn')center.x+=where==='door'?4:7;
    sheep.forEach(a=>a.hiddenInBarn=true);companions.animals.forEach(a=>{a.hiddenInCoop=true;a.hiddenInLodge=true;});shepherd.insideLodge=true;
    Object.assign(player,center,{tx:center.x,tz:center.z});view=outdoorView;view.zoom=kind==='barn'?.75:1;view.yaw=yaw;view.pitch=.23;
    const animal=sheep[0];animal.size=1;animal.state='roam';animal.hop=0;animal.headX=.8;animal.walking=false;animal.careContact=false;animal.phase=.7;
    const distance=where==='front'?-(kind==='barn'?23:Math.max(spec.halfWidth||7,depth/2)+4):where==='far'?Math.max(spec.halfWidth||7,depth/2)+3:0;
    animal.x=center.x+Math.sin(yaw)*distance;animal.z=center.z+Math.cos(yaw)*distance;
    if(where==='partial'){animal.x=spec.x-7.2;animal.z=(spec.entrance?.z??spec.z)+depth/2;}
    animal.hiddenInBarn=true;render();render();
   },
   focus(value){globalThis.__focusSheep=value;},raw(){sheep[0].hiddenInBarn=false;drawSheep(sheep[0]);},
   normal(){sheep[0].hiddenInBarn=false;render();}

  };
 `;
 try{
  for(const [name,viewport] of [['desktop',{width:1280,height:800}],['phone',{width:390,height:844}]]){
   const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const source=await fs.readFile('dist/app.js','utf8');await page.route('**/app.js?*',route=>route.fulfill({contentType:'text/javascript',body:source+hooks}));
   await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.locator('#start').click();
   // Compare the browser's actual screenshot pixels, including final Canvas
   // compositing, rather than relying on getImageData readback behavior.
   await page.addStyleTag({content:'body > :not(#world){visibility:hidden!important}'});
   const sample=async(kind,yaw,where)=>{
    await page.evaluate(args=>__occlusionQA.scene(...args),[kind,yaw,where]);
    await page.screenshot({path:path.join(output,'base.png')});
    await page.evaluate(()=>__occlusionQA.raw());await page.screenshot({path:path.join(output,'raw.png')});
    await page.evaluate(()=>__occlusionQA.normal());await page.screenshot({path:path.join(output,'normal.png')});
    const code="from PIL import Image,ImageChops;import json,sys;ims=[Image.open(p).convert('RGB') for p in sys.argv[1:]];out=[];\nfor im in ims[1:]:\n d=ImageChops.difference(ims[0],im);out.append({'count':sum(1 for c in d.getdata() if sum(c)>6),'bbox':d.getbbox()})\nprint(json.dumps(out))";
    return JSON.parse(execFileSync('python',['-c',code,...['base.png','raw.png','normal.png'].map(n=>path.join(output,n))],{encoding:'utf8'}));
   };
   for(const kind of ['lodge','coop','barn','shed'])for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
    const [raw,hidden]=await sample(kind,yaw,kind==='shed'?'far':'inside');
    assert.ok(raw.count>100,`${name} ${kind} ${yaw}: raw sheep appears`);
    assert.ok(hidden.count<4,`${name} ${kind} ${yaw}: hidden sheep must not show (${JSON.stringify(hidden)})`);
    const [,front]=await sample(kind,yaw,'front');
    assert.ok(front.count>100,`${name} ${kind} ${yaw}: foreground sheep stays visible`);
   }
   await page.evaluate(()=>__occlusionQA.focus(true));
   const [,focused]=await sample('lodge',Math.PI,'inside');assert.ok(focused.count<4,'foreground care composition cannot bypass the building wall');
   await page.evaluate(()=>__occlusionQA.focus(false));
   const [,door]=await sample('barn',0,'door');assert.ok(door.count>100,'the real open barn door still reveals animals within the doorway');
   const [full,partial]=await sample('lodge',0,'partial');
   assert.ok(partial.count>100&&partial.count<full.count*.9,'wall clips only the covered part at a corner');
   await page.screenshot({path:path.join(output,`${name}-partial.png`)});
   await sample('lodge',Math.PI,'inside');await page.screenshot({path:path.join(output,`${name}-behind-wall.png`)});
   assert.deepEqual(errors,[]);console.log(name+': four sides of all four buildings hide rear sheep; foreground and partial-edge pixels passed.');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
