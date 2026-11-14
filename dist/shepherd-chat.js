export function parseShepherdIntent(text){
  const s=String(text).replace(/\s+/g,'');
  if(/(숙소|오두막|전망대|발코니).*(가자|가줘|가볼|들어|보러)/.test(s))return 'enter_lodge';
  if(/(상태|몇마리|마릿수|어디|날씨|몇시|시간|왜|언제|어떻게)/.test(s))return 'status';
  if(/(밖으로|나가자|나갈래|나가줘)/.test(s)&&!/(양|닭|방목)/.test(s))return 'leave_barn';
  if(/(축사|안으로).*(들어|가자|가줘|가볼|보러)/.test(s))return 'enter_barn';
  if(/(양|닭|방목).*(내보내|풀어|밖으로|방목해)/.test(s))return 'release';
  if(/(양|닭|축사|닭장).*(모아|몰아|넣어|데려|재워)|모아줘/.test(s))return 'gather';
  if(/(둘러|살펴|확인해|순찰)/.test(s))return 'inspect';
  return 'none';
}
export function localShepherdReply(text,state,receipt=''){
  if(receipt)return receipt;
  if(/안녕|반가|이름|누구/.test(text))return '안녕하세요, 목장주님! 저는 양들을 살피는 소년 목동 하루예요. 곁의 보리개와 목장을 둘러보고 있어요.';
  if(/숙소|오두막|전망대|발코니/.test(text))return `제 숙소는 축사 뒤편의 2층 집이에요. 1층에는 목동의 침대와 식탁, 난로, 세면대, 바람이와 보리의 자리가 있어요. 2층 발코니에서는 지금 움직이는 목장 친구들을 내려다볼 수 있어요. ${state.shepherdInLodge?'저도 안에서 쉬고 있어요.':'저는 지금 목장을 돌보고 있어요.'}`;
  if(parseShepherdIntent(text)==='status')return `지금은 ${state.time}, ${state.weather}이에요. 양 ${state.total}마리 중 ${state.inside}마리가 축사에, 닭 ${state.chickens}마리 중 ${state.chickensInside}마리가 옆 닭장에 있어요.${state.night?' 해가 져서 개들이 나머지 동물들도 안으로 안내하고 있어요.':''}`;
  if(/쓰다듬|친해|내양|이름/.test(text))return '양을 자주 쓰다듬고 건초를 건네면 목장주님을 알아봐요. 내 양 메뉴에서 이름도 붙여줄 수 있어요.';
  if(/닭장|닭/.test(text))return `닭장은 큰 양들의 축사 바로 옆에 있어요. 지금 닭 ${state.chickens}마리 중 ${state.chickensInside}마리가 안에서 쉬고 있어요. 개들이 닭을 그곳으로 안내합니다.`;
  if(/축사/.test(text))return '큰 축사는 목장 왼쪽에 있어요. “축사로 가자”라고 하시면 문까지 걸어가서 안을 둘러볼 수 있어요.';
  return '지금은 목장 안내 모드예요. 양과 닭의 상태를 알려드리고, 동물 모으기·순찰·축사 출입을 도와드릴 수 있어요. 자유로운 AI 대화는 아직 연결 전이에요.';
}
export function setupShepherdChat({snapshot,execute,onOpen=()=>{},fetcher=globalThis.fetch?.bind(globalThis)}){
  const $=id=>document.getElementById(id),panel=$('shepherd-chat'),log=$('shepherd-messages');let connected=false,busy=false,requestId=0;
  const history=[];
  function mode(text){$('shepherd-mode').textContent=text;}
  function append(role,text){
    const p=document.createElement('p');p.className=role==='user'?'chat-user':'chat-boy';p.textContent=text;log.append(p);while(log.children.length>24)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;
    history.push({role:role==='user'?'user':'assistant',content:String(text).slice(0,1000)});while(history.length>12)history.shift();
  }
  async function check(){try{const r=await fetcher('/api/shepherd/status');const data=await r.json();connected=r.ok&&data.connected===true;}catch{connected=false;}mode(connected?'AI 목동 · 하루':'목장 안내 모드 · AI 연결 전');}
  function open(){panel.hidden=false;document.body.classList.add('chat-open');$('shepherd-talk').hidden=true;onOpen();if(!history.length)append('assistant','목장주님, 어서 오세요! 저는 하루예요. 양들과 축사를 살피고 있어요. 무엇을 도와드릴까요?');void check();}
  function close(){panel.hidden=true;document.body.classList.remove('chat-open');$('shepherd-talk').hidden=false;$('shepherd-talk').focus();}
  async function send(text){
    text=String(text).trim().slice(0,500);if(!text||busy)return;
    busy=true;const id=++requestId;$('shepherd-send').disabled=true;append('user',text);$('shepherd-input').value='';
    const intent=parseShepherdIntent(text),receipt=['gather','release','enter_barn','enter_lodge','leave_barn','inspect'].includes(intent)?execute(intent):'';
    if(!connected){append('assistant',localShepherdReply(text,snapshot(),receipt));busy=false;$('shepherd-send').disabled=false;return;}
    mode('하루가 생각하고 있어요…');
    try{
      const response=await fetcher('/api/shepherd',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:history.slice(-8),state:snapshot(),receipt}),signal:AbortSignal.timeout(18000)});
      const data=await response.json();if(!response.ok||typeof data.reply!=='string')throw Error('AI response unavailable');
      if(id===requestId)append('assistant',data.reply);
    }catch{if(id===requestId){append('assistant',localShepherdReply(text,snapshot(),receipt)+' (AI 연결이 지연되어 목장 안내로 답했어요.)');connected=false;}}
    finally{busy=false;$('shepherd-send').disabled=false;mode(connected?'AI 목동 · 하루':'목장 안내 모드 · AI 연결 전');}
  }
  $('shepherd-talk').onclick=open;$('shepherd-minimize').onclick=close;
  $('shepherd-form').onsubmit=e=>{e.preventDefault();void send($('shepherd-input').value);};
  panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')close();});
  panel.querySelectorAll('[data-shepherd-prompt]').forEach(button=>button.onclick=()=>void send(button.dataset.shepherdPrompt));
  void check();return {open,close};
}
