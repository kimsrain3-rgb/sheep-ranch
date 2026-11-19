import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {guideResponse} from '../server/haru-notebook.js';

const db=new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../drizzle/0000_haru.sql',import.meta.url),'utf8'));
const env={OPENAI_API_KEY:'test-only',DB:{
  prepare(sql){
    const stmt=db.prepare(sql);
    return {all:()=>({results:stmt.all()}),bind:(...args)=>({
      first:()=>stmt.get(...args),run:()=>stmt.run(...args)
    })};
  },
  batch(statements){for(const stmt of statements)stmt.run();}
}};
const topic='기러기의 도착 시기';
const first='아들과 기러기를 보러 왔는데 오늘 올까요?';
const history=[{role:'user',content:first}];
let lastInput,spokenMessages;
function mockModel(source,reply,summary=topic){
  return async (url,options)=>{
    const payload=JSON.parse(options.body);
    if(Array.isArray(payload.input)){
      spokenMessages=payload.input;
      return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({reply})}]}]});
    }
    lastInput=JSON.parse(payload.input);
    assert.equal(payload.store,false);
    assert.ok(payload.text.format.schema.required.includes('reply'));
    return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({source,reply,summary})}]}]});
  };
}
async function ask(messages,event,model,feedback=false){
  return (await guideResponse({messages,event,feedback},{},env,model)).json();
}
const firstReply='기러기를 함께 보러 오셨군요. 오늘 올지는 저도 모르겠어요.';
const firstEvent='test-event-haru-0001';
const result=await ask(history,firstEvent,mockModel('unknown',firstReply));
assert.deepEqual(result,{reply:firstReply,saved:true,mode:'notebook'});
history.push({role:'assistant',content:result.reply},{role:'user',content:'그럼 내일은?'});
const secondReply='내일 올지도 아직 몰라요.';
const id=db.prepare('SELECT id FROM haru_topics WHERE summary=?').get(topic).id;
const secondEvent='test-event-haru-0002';
const follow=await ask(history,secondEvent,mockModel(String(id),secondReply));
assert.equal(follow.reply,secondReply);
assert.deepEqual(lastInput.history,history.slice(0,-1));
assert.equal(lastInput.topics[0].answered,false);
await ask(history,secondEvent,mockModel(String(id),secondReply));
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM haru_mentions').get().n,2);
const exact=await ask([{role:'user',content:topic}],firstEvent,mockModel(String(id),secondReply));
assert.equal(spokenMessages.at(-1).role,'user');
assert.equal(exact.reply,secondReply);
db.prepare("UPDATE haru_topics SET answer=? WHERE id=?").run('올해 도착 일정은 아직 정해지지 않았어요.',id);
const taught=await ask(history,secondEvent,mockModel(String(id),''));
assert.equal(taught.mode,'journal');
assert.match(taught.reply,/일정은 아직/);
const personal=await ask([{role:'user',content:'우리 양은 언제 새끼를 낳아?'}],'test-event-haru-0003',mockModel('unknown','언제 태어날지는 저도 아직 몰라요.'));
assert.equal(personal.saved,true);
assert.equal(spokenMessages.at(-1).role,'user');
assert.equal(personal.reply,'언제 태어날지는 저도 아직 몰라요.');
assert.ok(db.prepare('SELECT id FROM haru_topics WHERE summary=?').get('개인 양의 출산 정보'));
const feedbackReply='아, 그걸 물으셨군요. 그날 올지는 저도 몰라요.';
assert.equal((await ask(history,secondEvent,mockModel('unknown',feedbackReply),true)).reply,feedbackReply);
assert.equal(lastInput.feedback,true);
db.prepare('UPDATE haru_topics SET answer=? WHERE id=?').run('',id);
const misplaced=await ask(history,'test-event-haru-0004',mockModel('place',secondReply));
assert.equal(misplaced.mode,'notebook');
assert.equal(misplaced.reply,secondReply);
assert.deepEqual(spokenMessages,history);
const invented=await ask(history,'test-event-haru-0005',mockModel('time','내일 풍차에서 볼 수 있어요.'));
assert.equal(invented.mode,'notebook');
assert.match(invented.reply,/내일.*기러기.*몰라요/);
assert.equal(invented.saved,true);
db.close();
console.log('Haru guide: conversational unknowns, follow-ups, private sheep, silent notes, deduplication, feedback and taught answers passed.');
