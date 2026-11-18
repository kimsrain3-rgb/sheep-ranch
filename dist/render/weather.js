// Screen-space precipitation stays bounded independently of the animal count.
export function drawWeather(c,W,H,time,weather){
  c.save();
  if(weather.night){c.fillStyle='#142b485c';c.fillRect(0,0,W,H);}
  else if(weather.kind==='overcast'||weather.wet||weather.kind==='fog'){c.fillStyle=weather.kind==='fog'?'#d4dedc35':'#45596625';c.fillRect(0,0,W,H);}
  if(weather.kind==='rain'){
    c.strokeStyle='#e4eff080';c.lineWidth=1;c.beginPath();
    for(let i=0;i<95;i++){const x=((i*127.73+time*(430/3))%(W+50))-25,y=(i*93.41+time*430)%(H+35)-35;c.moveTo(x,y);c.lineTo(x+5,y+15);}c.stroke();
  }else if(weather.kind==='snow'){
    c.fillStyle='#fffdf0cc';
    for(let i=0;i<70;i++){const x=((i*137.3+Math.sin(time*.7+i)*18+time*9)%(W+40)+W+40)%(W+40)-20,y=(i*79.7+time*(20+i%5*5))%(H+15)-15;c.beginPath();c.arc(x,y,1+i%3*.65,0,Math.PI*2);c.fill();}
  }
  c.restore();
}
export function drawFriendBadge(c,p,a,time){
  if(!p||!a.isFriend||a.hiddenInBarn)return;
  c.save();c.textAlign='center';c.font=`${Math.max(10,Math.min(17,p.s*.38))}px sans-serif`;c.fillStyle='#f6dba1';c.strokeStyle='#52664dcc';c.lineWidth=3;
  const x=p.x,y=p.y-p.s*a.size*2.1-5;
  c.strokeText(a.begging?'♡':'✦',x,y+Math.sin(time*2)*2);c.fillText(a.begging?'♡':'✦',x,y+Math.sin(time*2)*2);c.restore();
}
