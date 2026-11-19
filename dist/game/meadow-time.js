import {browserStorage} from './persistence.js?v=night-barn';
const STORAGE_KEY='meadow.time.v1';
export function parseMeadowTime(value){
  if(typeof value!=='string'||!/^\d{2}:\d{2}$/.test(value))return null;
  const [hour,minute]=value.split(':').map(Number);
  return hour<24&&minute<60?hour*60+minute:null;
}
export class MeadowTime{
  constructor({storage=browserStorage()}={}){
    this.storage=storage;this.minutes=12*60;this.persistent=!!storage;
    try{
      const saved=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');
      if(saved?.version===1&&Number.isInteger(saved.minutes)&&saved.minutes>=0&&saved.minutes<1440)this.minutes=saved.minutes;
    }catch{this.persistent=false;}
  }
  get value(){return String(Math.floor(this.minutes/60)).padStart(2,'0')+':'+String(this.minutes%60).padStart(2,'0');}
  set(value){
    const minutes=parseMeadowTime(value);if(minutes===null)return false;
    this.minutes=minutes;
    try{this.storage?.setItem(STORAGE_KEY,JSON.stringify({version:1,minutes}));}catch{this.persistent=false;}
    return true;
  }
  apply(weather){
    const hour=Math.floor(this.minutes/60),minute=this.minutes%60;
    const night=this.minutes<360||this.minutes>=1140;
    const dusk=this.minutes>=1020&&this.minutes<1140||this.minutes>=300&&this.minutes<420;
    const period=night?'밤':this.minutes<600?'아침':dusk?'노을':'낮';
    return {...weather,hour,minute,night,dusk,timeChosen:true,timeValue:this.value,period,text:`${hour<12?'오전':'오후'} ${hour%12||12}:${String(minute).padStart(2,'0')}`};
  }
}
