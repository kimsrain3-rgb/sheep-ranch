import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import path from 'node:path';

export function previewNotebook(directory=path.resolve('.sites-runtime')){
  mkdirSync(directory,{recursive:true});
  const db=new DatabaseSync(path.join(directory,'haru.sqlite'));
  if(db.prepare('PRAGMA user_version').get().user_version===0){
    const schema=readFileSync(new URL('../drizzle/0000_haru.sql',import.meta.url),'utf8');
    db.exec('BEGIN;'+schema+'PRAGMA user_version=1;COMMIT;');
  }
  function prepare(sql,args=[]){
    const stmt=db.prepare(sql);
    return {bind:(...values)=>prepare(sql,values),first:()=>stmt.get(...args),all:()=>({results:stmt.all(...args)}),run:()=>stmt.run(...args)};
  }
  return {prepare,batch(queries){
    db.exec('BEGIN');
    try{for(const query of queries)query.run();db.exec('COMMIT');}
    catch(error){db.exec('ROLLBACK');throw error;}
  }};
}
