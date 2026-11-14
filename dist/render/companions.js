export function drawCompanion(c,p,a,time){
  if(!p)return;
  c.save();
  c.translate(p.x,p.y);
  const scale=p.s*(a.type==='chicken'?.55:1);
  c.scale(scale*a.dir,scale);
  const ell=(x,y,rx,ry,color)=>{
    c.fillStyle=color;
    c.beginPath();
    c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    c.fill();
  };
  const line=(points,color,w)=>{
    c.strokeStyle=color;
    c.lineWidth=w;
    c.lineCap='round';
    c.beginPath();
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    c.stroke();
  };
  ell(0,0,.75,.13,'#30402e22');
  const step=a.walking?Math.sin(time*10+a.phase)*.12:0;
  if(a.type==='chicken'){
    for(const x of [-.2,.2])line([[x,-.4],[x+step,-.05],[x+.12+step,-.04]],'#b59048',.055);
    ell(0,-.66,.65,.45,a.phase>3?'#d1ae78':'#f1e9cd');
    ell(-.2,-.62,.38,.28,'#d5c9a5');
    line([[-.5,-.7],[-.85,-1.1],[-.8,-.65]],'#99896b',.13);
    const peck=a.state==='peck'?Math.max(0,Math.sin(time*4+a.phase))*.75:0;
    c.save();
    c.translate(.45+peck*.18,-1+peck);
    ell(0,0,.25,.3,'#eee1c3');
    ell(-.05,-.28,.16,.12,'#b26650');
    ell(.10,-.02,.035,.043,'#353c2e');
    line([[.2,.04],[.4,.1],[.2,.15]],'#c89d49',.06);
    c.restore();
  }
  else{
    const rest=a.state==='rest';
    for(const [i,x] of [-.5,-.3,.38,.58].entries())line([[x,-.65],[x+step*(i%2?1:-1),rest?-.18:-.05]],'#5f6253',.11);
    ell(0,rest?-.5:-.83,.85,rest?.3:.45,'#e2dfcb');
    ell(-.35,rest?-.5:-.86,.4,.32,'#515c51');
    line([[-.75,rest?-.5:-.8],[-1.03,-.4-Math.sin(time*3+a.phase)*.12]],'#586253',.12);
    ell(.65,rest?-.57:-1.04,.33,.35,'#535d51');
    ell(.82,rest?-.48:-.92,.3,.16,'#e9e3cb');
    ell(1.05,rest?-.49:-.94,.065,.06,'#333c32');
    line([[.46,rest?-.75:-1.25],[.4,rest?-1:-1.55],[.66,rest?-.77:-1.26]],'#485348',.11);
    if(rest)line([[.68,-.6],[.8,-.6]],'#263a2c',.025);
    else ell(.77,-1.11,.035,.035,'#242f28');
  }
  c.restore();
}
