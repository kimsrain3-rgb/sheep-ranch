import {windmillCountdown,windmillOpeningLabel,windmillStage} from './windmill-construction.js';

export function nestHasEggs(month){return month>=3 && month<=6;}

export function guideFacts(state,now=Date.now()){
  const month=Number(state.month)||new Date(now).getMonth()+1;
  const season=['겨울','겨울','봄','봄','봄','여름','여름','여름','가을','가을','가을','겨울'][month-1];
  const eggs=nestHasEggs(month),open=windmillStage(now)===10;
  const windmill=open?'P09 풍차가 다 지어졌어요. 발코니에 서면 우리가 걷던 풀밭이 한눈에 들어와요.':
    'P09 풍차는 아직 짓고 있어요. '+windmillCountdown(now)+' 남았어요. 한국 시간 '+windmillOpeningLabel+'에 발코니가 열려요.';
  const time=(state.time?'여긴 지금 '+state.time+'예요. ':'')+(state.night?'밤 목장을 걷고 계시네요. 축사 쪽으로 천천히 가 볼까요?':'아직 밖이 밝네요. 풀밭에서 조금 더 쉬다 가셔도 돼요.');
  const friend=state.friend?'‘'+state.friend+'’ 말이지요? 여기서 짝이 된 양이에요. 다음에 만나면 건초 한 줌 건네 봐요.':'여기서 짝이 된 양은 아직 없어요. 마음이 가는 양이 있으면 건초 한 줌부터 건네 봐요.';
  let place;
  if(state.night||state.shelterReason==='weather'){
    place=state.inside>0?'양 축사에 들러 봐요. 안에서 쉬는 녀석들을 가만히 보고 있으면 저도 덩달아 느긋해져요.':'저라면 양 축사 문가에 서 볼래요. 양들이 들어오는 길을 거기서 볼 수 있거든요.';
  }else if(eggs){
    place='연못가 풀숲으로 가 봐요. '+season+'에는 거기 둥지에 알이 있어요. 풀 사이를 가만히 들여다봐요.';
  }else{
    place=open?'P09 풍차 발코니에 올라가 봐요. 위에서 보면 방금 걷던 길도 제법 낯설어 보여요.':'오늘은 P09 풍차 쪽으로 발길을 돌려 봐요. 아직 짓는 중이라, 다 지어진 뒤엔 볼 수 없는 모습이거든요.';
  }
  return {windmill,time,friend,place,nest:eggs?'연못가 풀숲에 둥지가 하나 있어요. 살짝 들여다보면 알이 보여요.':'연못가 풀숲에 둥지는 그대로 있어요. 지금 들여다보면 속은 비어 있어요.'};
}

export function liveIntent(text){
  const s=text.replace(/\s/g,'');
  if(/풍차|P09/i.test(s)&&/완공|공사|남았|남은|며칠|개방|언제.*열|지어|올라갈/.test(s))return 'windmill';
  if(/둥지|새알/.test(s)&&/알|비어|볼수/.test(s)&&!/기러기|무슨새|누구|몇개|부화/.test(s))return 'nest';
  if(/(내|나의|제|우리)양/.test(s)&&!/출산|임신|깎|우유|먹이|몇살|나이|생일|건강/.test(s)&&/누구|이름|어떤|뭐|알려|소개/.test(s))return 'friend';
  if(/볼거리|볼게|구경할|추천.*장소|어디.*(가면|갈까|가볼|추천)|갈만한곳/.test(s))return 'place';
  if(/지금몇시|목장시간|낮.*밤|밤.*풍경|낮.*풍경|지금(은)?밤|지금(은)?낮/.test(s))return 'time';
  return '';
}
