export function drawLodge(c,p,{night=false,snow=false,occupants=0}={}){
  if(!p)return null;
  c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  c.fillStyle='#223d292d';c.beginPath();c.ellipse(0,.2,7.2,1,0,0,Math.PI*2);c.fill();
  rect(-5.7,-8.4,11.4,8.4,'#c0a078');
  rect(-5.35,-8.1,10.7,7.9,'#ead5aa');
  for(let x=-5.1;x<5.4;x+=.8)rect(x,-8.1,.07,7.9,'#b78e604d');
  rect(-6.2,-5.1,12.4,.35,'#735c42');
  rect(-6.2,-9.2,12.4,.38,'#735c42');
  poly([[-6.5,-9.2],[0,-12.2],[6.5,-9.2]],'#725d4a');
  if(snow)poly([[-6.5,-9.25],[0,-12.25],[6.5,-9.25],[5.9,-9.32],[0,-11.9],[-5.9,-9.32]],'#f7f3e9');
  rect(-1.25,-3.9,2.5,3.9,'#6f563d');
  rect(-1,-3.65,2,3.65,'#92724f');
  rect(.68,-2,.18,.18,'#efcf80');
  for(const x of [-4.5,2.7]){
    rect(x,-7.7,1.8,1.7,night?'#f7d98d':'#9ebfbe');
    rect(x+.84,-7.7,.11,1.7,'#f5e7c5');rect(x,-6.91,1.8,.11,'#f5e7c5');
  }
  for(const x of [-4.5,2.7]){
    rect(x,-3.6,1.8,1.5,night?'#f7d98d':'#9ebfbe');
    rect(x+.84,-3.6,.11,1.5,'#f5e7c5');
  }
  rect(-6.4,-5.3,12.8,.22,'#513f32');
  for(const x of [-5.8,-2.8,.2,3.2,5.6])rect(x,-5.3,.15,1.05,'#735840');
  rect(-3,-10.4,6,.7,'#385643');
  c.fillStyle='#fff6dc';c.textAlign='center';c.font='.48px sans-serif';c.fillText('목동과 강아지의 집',0,-9.91);
  rect(-4.2,-13.35,8.4,.7,'#355443e8');
  c.fillStyle='#fff9e7';c.font='.41px sans-serif';c.fillText('2층 전망대 · 함께 쉬는 곳',0,-12.86);
  if(occupants){c.fillStyle='#46694e';c.font='.43px sans-serif';c.fillText(`쉬는 친구 ${occupants}`,0,.65);}
  c.restore();
  return {x:p.x,y:p.y,w:p.s*13,h:p.s*13.5};
}

// Walkable cutaway rooms use the same perspective and ground picking as the barn.
export function drawLodgeInterior(c,W,H,project,{floor=1,night=false}={}){
  const poly=(points,color)=>{
    const p=points.map(([x,z,y=0])=>project(x,z,y));
    if(p.some(v=>!v))return;
    c.fillStyle=color;c.beginPath();p.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.fill();
  };
  const line=(a,b,color,width=.04)=>{
    const p=project(...a),q=project(...b);if(!p||!q)return;
    c.strokeStyle=color;c.lineWidth=Math.max(1,p.s*width);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();
  };
  const box=(x1,z1,x2,z2,h,side,top)=>{
    poly([[x1,z1],[x2,z1],[x2,z2],[x1,z2]],side);
    poly([[x1,z1,0],[x2,z1,0],[x2,z1,h],[x1,z1,h]],side);
    poly([[x1,z1,h],[x2,z1,h],[x2,z2,h],[x1,z2,h]],top);
  };
  const label=(text,x,z,y,color='#fff8e5')=>{
    const p=project(x,z,y);if(!p)return;
    c.fillStyle=color;c.textAlign='center';c.font=`${Math.max(11,Math.min(19,p.s*.26))}px sans-serif`;c.fillText(text,p.x,p.y);
  };
  if(floor===1){
    const backdrop=c.createLinearGradient(0,0,0,H);
    backdrop.addColorStop(0,'#695f50');backdrop.addColorStop(1,'#d5bb91');
    c.fillStyle=backdrop;c.fillRect(0,0,W,H);
    poly([[-5.5,-1],[5.5,-1],[5.5,14],[-5.5,14]],'#bea176');
    for(let z=0;z<14;z+=.9)line([-5.5,z,.02],[5.5,z,.02],'#9c79585e',.018);
    poly([[-5.5,14,0],[5.5,14,0],[5.5,14,5.2],[-5.5,14,5.2]],'#dfcaa3');
    poly([[-5.5,-1,0],[-5.5,14,0],[-5.5,14,3.4],[-5.5,-1,3.4]],'#ad8b68');
    poly([[5.5,-1,0],[5.5,14,0],[5.5,14,3.4],[5.5,-1,3.4]],'#b69973');
    // A real window, warm light and readable furniture surround an open aisle.
    poly([[-2.5,13.98,2.15],[2.5,13.98,2.15],[2.5,13.98,4.1],[-2.5,13.98,4.1]],night?'#536b75':'#a5c9ba');
    line([0,13.96,2.15],[0,13.96,4.1],'#f7e7c0',.11);
    line([-2.5,13.96,3.15],[2.5,13.96,3.15],'#f7e7c0',.1);
    box(-5,3,-2.1,6.8,.55,'#75573e','#f6e7c8');label('목동 침대',-3.5,5,1);
    box(2.1,3,4.7,5.4,.85,'#785b43','#ddbc78');label('식탁 · 차',3.4,4.5,1.22);
    box(-5,9,-3.2,11.5,1.55,'#785a42','#b78362');label('책과 목장 일지',-4.1,10.8,1.9);
    box(3,7.1,5,8.8,1.25,'#545046','#e7a85c');label('난로',4,8.2,1.55);
    box(-4.9,1,-3.3,2.2,.8,'#8d927e','#c2d8d1');label('세면대',-4.1,1.8,1.12);
    for(const [x,name] of [[-2.4,'바람개'],[1,'보리개']]){
      poly([[x,11.2,.05],[x+1.5,11.2,.05],[x+1.5,12.8,.05],[x,12.8,.05]],'#e9c989');
      label(name+' 자리',x+.75,12.2,.14,'#463f2f');
    }
    box(3.2,10,5.2,12,.2,'#785f48','#bd9c71');label('2층 계단 ↑',4.1,11.4,.5,'#2d4e3b');
    for(const z of [2,12]){line([-5.3,z,3.5],[5.3,z,3.5],'#76563f',.1);const p=project(0,z,3.35);if(p){c.save();c.shadowColor='#ffde95';c.shadowBlur=20;c.fillStyle='#f4d18b';c.beginPath();c.arc(p.x,p.y,Math.max(3,p.s*.11),0,Math.PI*2);c.fill();c.restore();}}
  }else{
    // The real meadow is painted behind the open balcony before these rails.
    poly([[-5.5,-1],[5.5,-1],[5.5,14],[-5.5,14]],'#ae9067');
    for(let z=0;z<14;z+=1.1)line([-5.5,z,.02],[5.5,z,.02],'#e0bc8755',.025);
    poly([[-5.5,14,0],[5.5,14,0],[5.5,14,.42],[-5.5,14,.42]],'#6d543e');
    for(let x=-5.5;x<=5.5;x+=1.1)line([x,14,.4],[x,14,1.35],'#654b37',.08);
    line([-5.5,14,1.35],[5.5,14,1.35],'#ead1a0',.12);
    for(const x of [-5.5,5.5])line([x,-1,.05],[x,14,1.2],'#715640',.09);
    box(-4.8,2,-2.4,4,.55,'#725b43','#dcc69a');label('전망 의자',-3.6,3.3,.9);
    box(2.5,7,4.7,9,.45,'#75583f','#b99564');label('망원경',3.6,8,.82);
    box(3.2,10,5.2,12,.2,'#785f48','#bd9c71');label('1층 계단 ↓',4.1,11.4,.5,'#2d4e3b');
  }
}
