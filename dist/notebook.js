const $=id=>document.getElementById(id);
const endpoint='/api/shepherd/notebook';
const host='https://wind-sheep-meadow.kimsrain3.chatgpt.site';
if(location.origin==='https://kimsrain3-rgb.github.io')location.replace(host+'/notebook.html');
let editing=null;
function editor(row){
  editing=row?.id||null;
  $('editor').hidden=false;
  $('summary').value=row?.summary||'';
  $('summary').readOnly=!!row;
  $('kind').value=row?.kind||'planned';
  $('answer').value=row?.answer||'';
  $('heading').textContent=row?'하루에게 답 가르치기':'목장 일지 쓰기';
  (row?$('answer'):$('summary')).focus();
}
async function refresh(message){
  const response=await fetch(endpoint,{cache:'no-store'});
  if(!response.ok){
    $('access').hidden=response.status!==403;
    throw Error(response.status===403?'운영자 계정으로 로그인해야 수첩을 열 수 있어요.':'지금은 수첩을 열 수 없어요.');
  }
  const {rows}=await response.json();$('desk').hidden=false;$('access').hidden=true;
  $('rows').replaceChildren();
  for(const row of rows){
    const card=document.createElement('article'),button=document.createElement('button'),detail=document.createElement('p');
    button.textContent=row.summary+' · '+row.count+'회';
    button.onclick=()=>editor(row);
    detail.textContent=({planned:'예정 · ',observed:'관찰 · ',question:''}[row.kind])+(row.answer||'답을 기다리고 있어요.');
    card.append(button,detail);$('rows').append(card);
  }
  $('status').textContent=message||(rows.length?'질문을 누르면 답을 등록하거나 고칠 수 있어요.':'아직 수첩에 적힌 질문이 없어요.');
}
$('new').onclick=()=>editor(null);
$('cancel').onclick=()=>{$('editor').hidden=true;};
$('editor').onsubmit=async event=>{
  event.preventDefault();const button=event.submitter;button.disabled=true;
  try{
    const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:editing,summary:$('summary').value,kind:$('kind').value,answer:$('answer').value})});
    if(!response.ok)throw Error('저장하지 못했어요. 로그인 상태와 같은 제목이 있는지 확인해 주세요.');
    $('editor').hidden=true;await refresh('저장했어요. 다음 질문부터 하루가 이 기록을 참고해요.');
  }catch(error){$('status').textContent=error.message;}
  finally{button.disabled=false;}
};
refresh().catch(error=>{$('status').textContent=error.message;});
