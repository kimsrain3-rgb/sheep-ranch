// Compare the view through each threshold with the outdoor scene at the same eye position.
// State controls exist only in the browser test, like those in buildings-browser.cjs.
const {chromium}=require('playwright-core');
const {readFile}=require('node:fs/promises');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({
    ...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),
    headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--mute-audio']
  });
  try{
    for(const [width,height,fallback] of [[1000,700,false],[390,760,false],[650,420,true]]){
      const page=await browser.newPage({viewport:{width,height}});
      if(fallback)await page.addInitScript(()=>{
        const get=HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext=function(kind,...args){
          return kind.startsWith('webgl')?null:get.call(this,kind,...args);
        };
      });
      const source=await readFile('dist/app.js','utf8');
      await page.route('**/app.js?*',route=>route.fulfill({contentType:'text/javascript',body:source+`
        window.checkDoor=(kind,floor,yaw)=>{
          paused=true;
          barnVisit.inside=kind==='barn';lodgeVisit.inside=kind==='lodge';
          lodgeVisit.floor=floor;farmVisit.inside=kind==='shed'||kind==='coop';farmVisit.kind=kind;
          view=barnVisit.inside?indoorView:lodgeVisit.inside?lodgeView:farmView;
          const room=view;player.x=player.tx=.15;player.z=player.tz=5;
          room.yaw=yaw;room.pitch=-.03;room.zoom=1.25;centerView();
          const door=CONFIG[kind].entrance;
          lookoutView.target.x=door.x+player.x;lookoutView.target.z=door.z+player.z;
          lookoutView.yaw=yaw;lookoutView.pitch=room.pitch;lookoutView.zoom=room.zoom;
          lookoutView.eyeHeight=room.eyeHeight+(floor-1)*4.2;
          view=lookoutView;drawOutdoorScenery(kind);drawWeather(c,W,H,t,atmosphere);
          const sample=()=>c.getImageData(0,0,canvas.width,canvas.height).data;
          const outside=sample();view=room;render();const inside=sample();
          function compare(xs){
            let total=0,same=0;const colors=new Set();
            for(const x of xs)for(let y=1.4;y<=2.55;y+=.07){
              const p=project(x,0,y);if(!p||p.x<1||p.y<1||p.x>=W-1||p.y>=H-1)continue;
              const n=(Math.floor(p.y*dpr)*canvas.width+Math.floor(p.x*dpr))*4;
              total++;if([0,1,2].every(k=>Math.abs(outside[n+k]-inside[n+k])<=3))same++;
              colors.add(outside[n]*65536+outside[n+1]*256+outside[n+2]);
            }
            return {total,same,colors:colors.size};
          }
          const jamb=kind==='barn'?3.1:kind==='lodge'?1.1:1;
          return {door:compare([-.5,-.2,0,.2,.5]),wall:compare([jamb+.25,jamb+.45,-jamb-.3]),
            renderer:canvas.dataset.buildings};
        };
      `}));
      await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173/');
      await page.locator('#start').click();
      for(const [kind,floor] of [['barn',1],['coop',1],['shed',1],['lodge',1],['lodge',2]]){
        for(const yaw of [Math.PI,Math.PI+.19]){
          const result=await page.evaluate(([kind,floor,yaw])=>checkDoor(kind,floor,yaw),[kind,floor,yaw]);
          const label=[width,height,kind,floor,yaw].join('/');
          assert.equal(result.renderer,fallback?'three-mesh-canvas':'three-webgl',label);
          assert.ok(result.door.total>12&&result.door.colors>3&&result.door.same/result.door.total>.88,label+' doorway '+JSON.stringify(result));
          assert.ok(result.wall.total>0&&result.wall.same/result.wall.total<.1,label+' wall '+JSON.stringify(result));
        }
      }
      console.log('Open-door meadow and opaque jambs passed',width,height,fallback?'Canvas':'WebGL');
      await page.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
