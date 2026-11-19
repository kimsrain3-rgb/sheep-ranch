import {guideFacts,liveIntent} from './game/ranch-guide.js?v=haru-voice-1';
export function parseShepherdIntent(text){
  const s=String(text).replace(/\s+/g,'');
  if(/(숙소|오두막|전망대|발코니).*(가자|가줘|가볼|들어|보러)/.test(s))return 'enter_lodge';
  if(/(상태|몇마리|마릿수|어디|날씨|몇시|시간|왜|언제|어떻게)/.test(s))return 'status';
  if(/(밖으로|나가자|나갈래|나가줘)/.test(s)&&!/(양|닭|방목)/.test(s))return 'leave_barn';
  if(/(축사|안으로).*(들어|가자|가줘|가볼|보러)/.test(s))return 'enter_barn';
  if(/(양|닭|방목).*(내보내|풀어|밖으로|방목해)/.test(s))return 'release';
  if(/(양|닭|축사|닭장).*(모아|몰아|넣어|데려|재워)|모아줘/.test(s))return 'gather';
  if(/^(목장(을)?|양들?(을)?|축사(를)?|주변(을)?)?(한번)?(둘러봐|살펴봐|순찰해|순찰부탁|순찰$)/.test(s))return 'inspect';
  return 'none';
}
export function localShepherdReply(text,state,receipt=''){
  if(receipt)return receipt;
  const topic=liveIntent(text);if(topic)return guideFacts(state)[topic];
  if(/안녕|반가|너는 누구|네 이름/.test(text))return '반가워요. 전 양을 돌보는 하루예요. 저랑 잠깐 같이 걸어요.';
  if(/숙소|오두막|전망대|발코니/.test(text))return `축사 뒤편 이층집이 제 숙소예요. 목장을 한눈에 담고 싶을 땐 이층 발코니가 좋아요. ${state.shepherdInLodge?'저도 안에서 쉬고 있어요.':'저는 지금 목장을 돌보고 있어요.'}`;
  if(/상태|몇\s*마리|마릿수|날씨|몇\s*시/.test(text))return `지금은 ${state.time}, ${state.weather}이에요. 양 ${state.total}마리 중 ${state.inside}마리가 축사에, 닭 ${state.chickens}마리 중 ${state.chickensInside}마리가 옆 닭장에 있어요.${state.night?' 해가 져서 개들이 나머지 동물들도 안으로 안내하고 있어요.':''}`;
  if(/쓰다듬|친해|내양|이름/.test(text))return '양을 자주 쓰다듬고 건초를 건네면 목장주님을 알아봐요. 내 양 메뉴에서 이름도 붙여줄 수 있어요.';
  if(/닭장|닭/.test(text))return `닭장은 큰 양들의 축사 바로 옆에 있어요. 지금 닭 ${state.chickens}마리 중 ${state.chickensInside}마리가 안에서 쉬고 있어요. 안으로 들어갈 때면 개들이 길을 잡아 줘요.`;
  if(/축사/.test(text))return '큰 축사는 목장 왼쪽에 있어요. “축사로 가자”라고 하시면 문까지 걸어가서 안을 둘러볼 수 있어요.';
  return '그 이야기는 제가 지금 답하기 어렵네요. 여기서 보이는 양이나 축사 이야기는 들려드릴 수 있어요.';
}
export function setupShepherdChat({snapshot,execute,onOpen=()=>{},onClose=()=>{},requestOpen=()=>{},canTalk=()=>true,fetcher=globalThis.fetch?.bind(globalThis)}){
  const $=id=>document.getElementById(id),panel=$('shepherd-chat'),log=$('shepherd-messages');let connected=false,busy=false,requestId=0;
  const history=[];let current=null;
  const feedback=$('haru-feedback');
  function mode(text){$('shepherd-mode').textContent=text;}
  function append(role,text){
    const p=document.createElement('p');p.className=role==='user'?'chat-user':'chat-boy';p.textContent=text;log.append(p);while(log.children.length>24)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;
    history.push({role:role==='user'?'user':'assistant',content:String(text).slice(0,1000)});while(history.length>12)history.shift();
  }
  const api=globalThis.location?.origin==='https://kimsrain3-rgb.github.io'
    ? 'https://wind-sheep-meadow.kimsrain3.chatgpt.site/api/shepherd'
    : '/api/shepherd';
  async function check(){try{const r=await fetcher(api+'/status');const data=await r.json();connected=r.ok&&data.connected===true;}catch{connected=false;}mode(connected?'AI 목동 · 하루':'목장 안내 모드 · AI 연결 전');}
  function open(){if(!canTalk()){requestOpen();return;}panel.hidden=false;document.body.classList.add('chat-open');$('shepherd-talk').hidden=true;onOpen();if(!history.length)append('assistant','반가워요, 전 하루예요. 양들 보러 오셨어요? 제 곁에서 잠깐 쉬었다 가셔도 좋아요.');void check();}
  function close(){onClose();panel.hidden=true;document.body.classList.remove('chat-open');$('shepherd-talk').hidden=false;$('shepherd-talk').focus();}
  async function send(text){
    if(!canTalk()){close();return;}
    text=String(text).trim().slice(0,500);if(!text||busy)return;
    busy=true;const id=++requestId;$('shepherd-send').disabled=true;append('user',text);$('shepherd-input').value='';
    const intent=parseShepherdIntent(text),receipt=['gather','release','enter_barn','enter_lodge','leave_barn','inspect'].includes(intent)?execute(intent):'';
    current={text,event:Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('')};
    feedback.hidden=true;
    mode('하루가 생각하고 있어요…');
    try{
      const response=await fetcher(api,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({guide:true,event:current.event,messages:history.slice(-8),state:snapshot(),receipt}),signal:AbortSignal.timeout(18000)});
      const data=await response.json();if(!response.ok||typeof data.reply!=='string')throw Error('AI response unavailable');
      if(id===requestId){append('assistant',data.reply);feedback.hidden=data.saved===true||!!receipt;connected=true;}
    }catch{if(id===requestId){append('assistant',localShepherdReply(text,snapshot(),receipt)+' (지금은 대화 서버에 연결할 수 없어 질문이 저장되지 않았어요.)');feedback.hidden=!!receipt;connected=false;}}
    finally{busy=false;$('shepherd-send').disabled=false;mode(connected?'AI 목동 · 하루':'목장 안내 모드 · AI 연결 전');}
  }
  feedback.onclick=async()=>{
    if(busy||!current||!canTalk())return;
    busy=true;feedback.disabled=true;$('shepherd-send').disabled=true;
    try{
      const response=await fetcher(api,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({guide:true,feedback:true,event:current.event,messages:[{role:'user',content:current.text}],state:snapshot()}),signal:AbortSignal.timeout(18000)});
      if(!response.ok)throw Error('unavailable');
      const data=await response.json();append('assistant',data.reply);feedback.hidden=data.saved===true;
    }catch{append('assistant','지금은 수첩에 저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.');}
    finally{feedback.disabled=false;$('shepherd-send').disabled=false;busy=false;}
  };
  $('shepherd-talk').onclick=open;$('shepherd-minimize').onclick=close;
  $('shepherd-form').onsubmit=e=>{e.preventDefault();void send($('shepherd-input').value);};
  panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')close();});
  panel.querySelectorAll('[data-shepherd-prompt]').forEach(button=>button.onclick=()=>void send(button.dataset.shepherdPrompt));
  void check();return {open,close};
}
