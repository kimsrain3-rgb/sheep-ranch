import assert from 'node:assert/strict';
import {handleShepherd} from '../server/shepherd-api.js';
import {parseShepherdIntent,setupShepherdChat} from '../dist/shepherd-chat.js';

const origin='http://localhost:4173';
const pages='https://kimsrain3-rgb.github.io';
const preflight=await handleShepherd(new Request(origin+'/api/shepherd',{method:'OPTIONS',headers:{origin:pages,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}}));
assert.equal(preflight.status,204);
assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),pages);
assert.match(preflight.headers.get('Access-Control-Allow-Headers'),/content-type/i);
const publicStatus=await handleShepherd(new Request(origin+'/api/shepherd/status',{headers:{origin:pages}}),{OPENAI_API_KEY:'test-only'});
assert.equal(publicStatus.headers.get('Access-Control-Allow-Origin'),pages);
assert.equal((await publicStatus.json()).connected,true);
const otherSite=await handleShepherd(new Request(origin+'/api/shepherd',{method:'OPTIONS',headers:{origin:'https://example.org'}}));
assert.equal(otherSite.status,403);
assert.equal(otherSite.headers.get('Access-Control-Allow-Origin'),null);
const state={time:'오후 6:00',weather:'맑음',weatherSource:'live',location:'양주',total:62,lambs:12,inside:3,chickens:10,chickensInside:4,playingLambs:2,dogs:2,dogsInLodge:1,shepherdInLodge:true};
assert.equal(parseShepherdIntent('닭도 모아줘'),'gather');
assert.equal(parseShepherdIntent('닭을 밖으로 내보내'),'release');
assert.equal(parseShepherdIntent('목동 숙소로 가자'),'enter_lodge');
const request=(message,extra={})=>new Request(origin+'/api/shepherd',{
  method:'POST',headers:{origin,'content-type':'application/json'},
  body:JSON.stringify({messages:[{role:'user',content:message}],state,...extra})
});

let calls=0;
const noFetch=()=>{calls++;throw Error('status must use game state');};
let response=await handleShepherd(request('지금 목장 상태와 양 마릿수를 알려줘'),{OPENAI_API_KEY:'test-only'},noFetch);
let data=await response.json();
assert.equal(response.status,200);
assert.equal(data.mode,'state');
assert.match(data.reply,/오후 6:00/);
assert.match(data.reply,/양주/);
assert.match(data.reply,/62마리/);
assert.match(data.reply,/어른 50마리, 새끼 12마리/);
assert.match(data.reply,/축사 안에 3마리, 밖에 59마리/);
assert.match(data.reply,/닭은 10마리 중 4마리/);
assert.match(data.reply,/숙소에는 1마리의 개가 쉬고/);
assert.match(data.reply,/저도 안에 있어요/);
assert.equal(calls,0);

response=await handleShepherd(request('날씨가 어때?',{state:{...state,weatherSource:'local',location:'',shelterReason:'night'}}),{OPENAI_API_KEY:'test-only'},noFetch);
data=await response.json();
assert.match(data.reply,/실제 지역 날씨는 연결되지 않았어요/);
assert.match(data.reply,/밤이라/);

let sent;
const fake=async(url,options)=>{
  calls++;sent={url,body:JSON.parse(options.body)};
  return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify({reply:'목장주님, 보리개와 함께 풀밭을 둘러볼게요.'})}]}]}),{status:200});
};
response=await handleShepherd(request('보리개는 무엇을 하고 있어?'),{OPENAI_API_KEY:'test-only'},fake);
data=await response.json();
assert.equal(response.status,200);
assert.equal(data.mode,'ai');
assert.match(data.reply,/보리개/);
assert.equal(calls,1);
assert.equal(sent.url,'https://api.openai.com/v1/responses');
assert.equal(sent.body.store,false);
assert.match(sent.body.instructions,/"total":62/);
assert.match(sent.body.instructions,/"dogs":2/);
assert.equal(sent.body.input[0].content,'보리개는 무엇을 하고 있어?');

response=await handleShepherd(request('보리개는 무엇을 하고 있어?'),{},fake);
assert.equal(response.status,503);
assert.equal((await response.json()).error,'AI_NOT_CONFIGURED');
console.log('Shepherd chat: exact live status, weather source, AI conversation and missing-key fallback passed.');

// Both the button and programmatic open must obey proximity, as must sending.
const elements=new Map();
function node(id){
  if(!elements.has(id))elements.set(id,{hidden:true,children:[],value:'',disabled:false,scrollHeight:0,
    classList:{add(){},remove(){}},focus(){},addEventListener(){},querySelectorAll(){return [];},
    append(child){this.children.push(child);}});
  return elements.get(id);
}
let allowed=false,approaches=0,opened=0,closed=0;
globalThis.document={getElementById:node,createElement:()=>({}),body:node('body')};
try{
  const ui=setupShepherdChat({snapshot:()=>state,execute:()=>'',canTalk:()=>allowed,
    requestOpen:()=>approaches++,onOpen:()=>opened++,onClose:()=>closed++,
    fetcher:async()=>new Response(JSON.stringify({connected:false}))});
  node('shepherd-talk').onclick();
  assert.equal(approaches,1);
  assert.equal(node('shepherd-chat').hidden,true,'distant button starts approach without showing dialogue');
  ui.open();assert.equal(approaches,2,'programmatic open has the same proximity gate');
  allowed=true;ui.open();
  assert.equal(opened,1);assert.equal(node('shepherd-chat').hidden,false);
  assert.equal(node('shepherd-talk').hidden,true);
  assert.equal(node('shepherd-messages').children.length,1);
  allowed=false;node('shepherd-input').value='안녕';node('shepherd-form').onsubmit({preventDefault(){}});
  assert.equal(closed,1);assert.equal(node('shepherd-chat').hidden,true,'losing proximity closes the panel before send');
  assert.equal(node('shepherd-messages').children.length,1,'no distant message is sent or appended');
  await new Promise(resolve=>setImmediate(resolve));
}finally{delete globalThis.document;}
console.log('Chat proximity gate: button, programmatic open and message send require a nearby face-to-face encounter.');
