import {presets,hairColors,outfitColors,resolveAppearance,currentAppearance,applyAppearance} from './game/visitor-appearance.js';
import {drawVisitor} from './visitor.js?v=limb-light-1';
import {ensureMintModel,mintModelReady} from './render/mint-model.js';
import {onMintArtLoaded} from './render/mint-visitor.js';

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
  const mint=draft.id==='mint';
  byId('avatar-hair').closest('fieldset').hidden=mint;
  byId('avatar-outfit').closest('fieldset').hidden=mint;
  byId('mint-accessories').hidden=!mint;
  byId('mint-model').hidden=!mint;
  const wants3D=mint&&draft.model==='3d';
  for(const radio of byId('mint-model').querySelectorAll('input')) radio.checked=radio.value===(wants3D?'3d':'2d');
  byId('mint-model-status').textContent=wants3D&&!mintModelReady()?'3D 캐릭터를 불러오는 중…':'';
  if(wants3D&&!mintModelReady()) ensureMintModel().then(ready=>{
    if(!panel.open||draft.model!=='3d')return;
    if(ready)refresh();
    else byId('mint-model-status').textContent='이 기기에서는 손그림으로 표시돼요.';
  });
  for(const key of ['hat','bag']) byId('mint-'+key).checked=!!draft[key];
  for(const {input,key,value,canvas} of controls){
    input.checked=draft[key]===value;
    if(!canvas)continue;
    const c=canvas.getContext('2d');
    c.clearRect(0,0,canvas.width,canvas.height);
    drawVisitor(c,{x:64,y:132,s:55},{pose:'front',label:false,
      appearance:input.checked?draft:resolveAppearance({id:value})});
  }
}
for(const key of ['hat','bag']){
  byId('mint-'+key).onchange=e=>{draft=resolveAppearance({...draft,[key]:e.target.checked});refresh();};
}
byId('mint-model').addEventListener('change',e=>{
  draft=resolveAppearance({...draft,model:e.target.value}); refresh();
});
onMintArtLoaded(()=>{if(panel.open)refresh();});
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
