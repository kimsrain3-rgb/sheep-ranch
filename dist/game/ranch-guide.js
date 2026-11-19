import {windmillCountdown,windmillOpeningLabel,windmillStage} from './windmill-construction.js';

export function nestHasEggs(month){return month>=3 && month<=6;}

export function guideFacts(state,now=Date.now()){
  const month=Number(state.month)||new Date(now).getMonth()+1;
  const season=['겨울','겨울','봄','봄','봄','여름','여름','여름','가을','가을','가을','겨울'][month-1];
  const eggs=nestHasEggs(month),open=windmillStage(now)===10;
  const windmill=open?'P09 풍차가 완공됐어요. 발코니에 올라 목장을 둘러볼 수 있어요.':
    'P09 풍차는 공사 중이에요. '+windmillCountdown(now)+' 남았고, 한국 시간 '+windmillOpeningLabel+'에 발코니가 열려요.';
  const time='목장주님이 고른 목장 시간은 '+(state.time||'확인 중')+'예요. '+(state.night?'밤하늘 아래 동물들이 안에서 쉬러 가요.':'밝은 하늘 아래 목장을 산책할 수 있어요.');
  const friend=state.friend?'이 브라우저에서 목장주님과 짝이 된 양은 '+state.friend+'예요.':'이 브라우저에는 아직 짝이 된 양이 없어요.';
  const place=state.night||state.shelterReason==='weather'?'양 축사에 가 보세요. '+(Number(state.inside)>0?'안에서 쉬는 양들을 볼 수 있어요.':'문 앞에서 동물들이 들어오는 모습을 기다려 보세요.'):
    eggs?'연못가 풀숲으로 가 보세요. 둥지에 알이 있는 계절이에요.':
    open?'P09 풍차 발코니에 올라 보세요. 목장 전체가 보여요.':'P09 풍차 공사 현장에 가 보세요. 지금 짓고 있는 전망대를 볼 수 있어요.';
  return {windmill,time,friend,place:season+' 목장이에요. '+place,nest:eggs?'연못가 풀숲 둥지에 알이 있어요.':'지금은 연못가 풀숲 둥지가 비어 있어요.'};
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
