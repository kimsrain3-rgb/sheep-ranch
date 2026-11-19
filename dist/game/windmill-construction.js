const day=24*60*60*1000;
export const windmillStart=Date.parse('2026-11-19T19:33:49+09:00');
export const windmillOpening=windmillStart+10*day;
export const windmillOpeningLabel=new Intl.DateTimeFormat('ko-KR',{
  timeZone:'Asia/Seoul',month:'long',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true
}).format(windmillOpening);
export function windmillCountdown(now=Date.now()){
  const remaining=windmillOpening-now;
  if(remaining<=0)return '완공';
  if(remaining>=day)return `완공까지 ${Math.ceil(remaining/day)}일`;
  if(remaining<60000)return '완공까지 1분 미만';
  const minutes=Math.ceil(remaining/60000),hours=Math.floor(minutes/60);
  const parts=[];
  if(hours)parts.push(hours+'시간');
  if(minutes%60)parts.push(minutes%60+'분');
  return '완공까지 '+parts.join(' ');
}
const phases=['터 잡기','석재 기초 쌓기','아래층 벽 쌓기','출입문 설치','중간층 벽 쌓기','창문 설치','상층부 올리기','발코니와 난간 설치','풍차 지붕 올리기','날개 설치와 점검','발코니 개방'];

export function windmillStage(now=Date.now()){
  return Math.max(0,Math.min(10,Math.floor((now-windmillStart)/day)));
}
export function windmillStatus(stage){
  return stage===10?phases[10]:`공사 ${stage+1}일차 · ${phases[stage]}`;
}
