import {presets,hairColors,outfitColors,resolveAppearance,currentAppearance,applyAppearance} from './game/visitor-appearance.js';
import {drawVisitor} from './visitor.js?v=visitor-look-1';

const byId=id=>document.getElementById(id);
const panel=byId('avatar-panel'), opener=byId('avatar-open');
let draft;
const controls=[];
function option(parent,key,value,name,color){
  const input=document.createElement('input'), label=document.createElement('label');
  input.type='radio'; input.name='visitor-'+key; input.value=value;
  const caption=document.createElement('span'); caption.textContent=name;
  let canvas;
  if(color){
    const swatch=document.createElement('i'); swatch.style.backgroundColor=color;
    label.append(input,swatch,caption);
  }else{
    canvas=document.createElement('canvas'); canvas.width=128; canvas.height=144;
    canvas.setAttribute('aria-hidden','true'); label.append(input,canvas,caption);
  }
  byId(parent).append(label);
  controls.push({input,key,value,canvas});
  input.addEventListener('change',()=>{
    draft=resolveAppearance(key==='id'?{id:value}:{...draft,[key]:value});
    refresh();
  });
}
for(const p of presets) option('avatar-presets','id',p.id,p.name);
for(const [id,[name,color]] of Object.entries(hairColors)) option('avatar-hair','hair',id,name,color);
for(const [id,[name,color]] of Object.entries(outfitColors)) option('avatar-outfit','outfit',id,name,color);
function refresh(){
  for(const {input,key,value,canvas} of controls){
    input.checked=draft[key]===value;
    if(!canvas)continue;
    const c=canvas.getContext('2d');
    c.clearRect(0,0,canvas.width,canvas.height);
    drawVisitor(c,{x:64,y:132,s:55},{pose:'front',label:false,
      appearance:input.checked?draft:resolveAppearance({id:value})});
  }
}
opener.addEventListener('click',()=>{
  draft=currentAppearance(); refresh(); panel.showModal();
  panel.querySelector('input:checked').focus();
});
panel.addEventListener('keydown',event=>event.stopPropagation());
panel.addEventListener('close',()=>{
  (opener.getClientRects().length?opener:byId('mobile-menu-toggle')).focus();
});
byId('avatar-close').onclick=()=>panel.close();
byId('avatar-apply').onclick=()=>{
  const saved=applyAppearance(draft);
  panel.close();
  if(!saved){
    const status=byId('avatar-storage-note'); status.hidden=false;
    setTimeout(()=>status.hidden=true,5500);
  }
};
