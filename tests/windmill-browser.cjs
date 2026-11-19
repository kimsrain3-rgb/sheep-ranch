const assert=require('node:assert/strict');
const {existsSync,mkdirSync}=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');

(async()=>{
  const {windmillStart:start,windmillOpening:opening,windmillStage}=await import('../dist/game/windmill-construction.js');
  const {BuildingRenderer}=await import('../dist/render/buildings-three.js');
  const renderer=new BuildingRenderer(),day=86400000;
  for(let i=0;i<=10;i++){
    assert.equal(windmillStage(start+i*day),i);
    if(i)assert.equal(windmillStage(start+i*day-1),i-1);
    renderer.setMillStage(i);
    const mill=renderer.buildings.windmill;
    assert.equal(!!mill.sails,i>=9);
    assert.equal(mill.model.userData.parts.some(part=>part.name==='gallery boards'),i>=7);
    assert.equal(mill.model.userData.parts.some(part=>part.name==='survey stake'),i<10);
  }
  renderer.dispose();
  const executable=process.env.BROWSER_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({executablePath:existsSync(executable)?executable:undefined,args:['--enable-unsafe-swiftshader','--mute-audio']});
  const out=path.resolve('.sites-runtime/windmill-qa');
  mkdirSync(out,{recursive:true});
  try{
    for(const [width,height] of [[1280,800],[390,760],[320,568]]){
      const page=await browser.newPage({viewport:{width,height}}),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.clock.setFixedTime(new Date(start+1000));
      await page.goto((process.env.PREVIEW_URL||'http://127.0.0.1:4174')+'/?start=windmill');
      await page.locator('#start').click();
      if(width<700)await page.locator('#mobile-menu-toggle').click();
      await page.locator('#windmill-enter').click();
      const panel=page.locator('#windmill-panel');
      await page.waitForSelector('#windmill-panel[open][data-stage="0"]');
      const remaining=page.locator('#mill-countdown');
      assert.equal(await remaining.textContent(),'완공까지 10일');
      assert.match(await page.locator('#mill-opening').textContent(),/11월 29일.*오후 7:33/);
      assert.equal(await page.locator('#mill-climb').isVisible(),false);
      await page.screenshot({path:path.join(out,'site-'+width+'.png')});
      await page.clock.setFixedTime(new Date(start+7*day));
      await page.waitForSelector('#windmill-panel[data-stage="7"]');
      assert.equal(await remaining.textContent(),'완공까지 3일');
      await page.clock.setFixedTime(new Date(opening-65*60000));
      await remaining.filter({hasText:'완공까지 1시간 5분'}).waitFor();
      await page.clock.setFixedTime(new Date(opening-1));
      await page.waitForSelector('#windmill-panel[data-stage="9"]');
      await remaining.filter({hasText:'완공까지 1분 미만'}).waitFor();
      assert.equal(await page.locator('#mill-climb').isVisible(),false);
      await page.clock.setFixedTime(new Date(opening));
      await page.locator('#mill-climb').click();
      await page.waitForSelector('#windmill-panel[data-mode="balcony"]');
      assert.equal(await remaining.isVisible(),false);
      await page.screenshot({path:path.join(out,'balcony-'+width+'.png')});
      await page.keyboard.press('ArrowLeft');
      await page.locator('#mill-close').click();
      assert.equal(await panel.isVisible(),false);
      assert.deepEqual(errors,[]);
      await page.close();
    }
  }finally{await browser.close();}
  console.log('Ten daily boundaries, staged geometry, live opening, balcony and exit passed on desktop and two phone sizes.');
})().catch(error=>{console.error(error);process.exitCode=1;});
