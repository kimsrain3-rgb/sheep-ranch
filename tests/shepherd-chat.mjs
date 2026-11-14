import assert from 'node:assert/strict';
import {handleShepherd} from '../server/shepherd-api.js';

const origin='http://localhost:4173';
const state={time:'오후 6:00',weather:'맑음',weatherSource:'live',location:'양주',total:62,lambs:12,inside:3,playingLambs:2,dogs:2};
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
