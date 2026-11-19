const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
  const base=process.env.PREVIEW_URL||'http://127.0.0.1:4197';
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-unsafe-swiftshader','--mute-audio']});
  try{
    for(const width of [320,390,1280]){
      const page=await browser.newPage({viewport:{width,height:width===320?568:780}});
      await page.goto(base);const popup=page.locator('#welcome');
      await popup.waitFor();assert.equal(await page.locator('#skip-intro').isChecked(),false);
      await page.locator('#start').click();await page.reload();await popup.waitFor();
      await page.locator('#skip-intro').check();await page.locator('#start').click();
      await page.reload();await page.locator('body.walking').waitFor();assert.equal(await popup.isVisible(),false);
      if(width<700)await page.locator('#mobile-menu-toggle').click();
      await page.locator('#help').click();assert.equal(await page.locator('#help-skip').isChecked(),true);
      await page.locator('#help-skip').uncheck();await page.reload();await popup.waitFor();await page.close();
      console.log('Entry, persistence and help verified at width',width);
    }
    if(process.env.CHECK_TEACHING!=='1')return;
    const ask=async text=>{
      const page=await browser.newPage({viewport:{width:1100,height:750}});
      try{
        await page.goto(base);await page.locator('#start').click();await page.locator('#shepherd-talk').click();
        await page.locator('#shepherd-input').fill(text,{timeout:120000});
        await page.locator('#shepherd-send').click();await page.locator('#shepherd-send:enabled').waitFor({timeout:30000});
        return await page.locator('#shepherd-messages p').last().innerText();
      }finally{await page.close();}
    };
    const answer='목장 라디오의 첫 곡은 운영자가 고른 풀잎 왈츠예요.';
    assert.match(await ask('목장 라디오에서 맨 처음 들려줄 노래는 뭔가요?'),/질문 수첩에 적어둘게요/);
    const desk=await browser.newPage();await desk.goto(base+'/notebook.html');
    await desk.locator('#rows button').filter({hasText:/라디오/}).first().click();
    await desk.locator('#answer').fill(answer);await desk.locator('button[type=submit]').click();
    await desk.getByText('저장했어요.',{exact:false}).waitFor();
    assert.equal(await ask('목장의 라디오 방송 첫 선곡이 궁금해요.'),answer);
    console.log('Two independent visitors and operator teaching verified');
  }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
