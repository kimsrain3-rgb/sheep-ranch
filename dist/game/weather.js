import {browserStorage} from './persistence.js?v=night-barn';
// Weather owns network/time only. Rendering and animal behavior consume its snapshot.
const KOREAN_CITIES={서울:'Seoul',양주:'Yangju',의정부:'Uijeongbu',동두천:'Dongducheon',포천:'Pocheon',파주:'Paju',고양:'Goyang',남양주:'Namyangju',수원:'Suwon',성남:'Seongnam',용인:'Yongin',부천:'Bucheon',안양:'Anyang',안산:'Ansan',화성:'Hwaseong',평택:'Pyeongtaek',김포:'Gimpo',인천:'Incheon',부산:'Busan',대구:'Daegu',대전:'Daejeon',광주:'Gwangju',울산:'Ulsan',세종:'Sejong',춘천:'Chuncheon',원주:'Wonju',강릉:'Gangneung',속초:'Sokcho',청주:'Cheongju',충주:'Chungju',천안:'Cheonan',아산:'Asan',전주:'Jeonju',군산:'Gunsan',익산:'Iksan',목포:'Mokpo',여수:'Yeosu',순천:'Suncheon',포항:'Pohang',경주:'Gyeongju',구미:'Gumi',안동:'Andong',창원:'Changwon',김해:'Gimhae',진주:'Jinju',거제:'Geoje',제주:'Jeju',서귀포:'Seogwipo'};
export function citySearchTerm(name){const korean=Object.keys(KOREAN_CITIES).find(key=>name===key||name===key+'시'||name===key+'특별시'||name===key+'광역시');return {term:korean?KOREAN_CITIES[korean]:name,korean:!!korean};}
export const WEATHER_NAMES={clear:'맑음',clouds:'구름 조금',overcast:'흐림',rain:'비',snow:'눈',fog:'안개'};
export function weatherKind(code){
  if([71,73,75,77,85,86].includes(code))return 'snow';
  if((code>=51&&code<=67)||(code>=80&&code<=82)||code>=95)return 'rain';
  if(code===45||code===48)return 'fog';
  return code===0?'clear':code===1||code===2?'clouds':'overcast';
}
export function localClock(now=new Date(),timezone){
  let parts;
  try{parts=new Intl.DateTimeFormat('en-GB',{timeZone:timezone||undefined,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);}catch{parts=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);}
  const hour=Number(parts.find(p=>p.type==='hour').value),minute=Number(parts.find(p=>p.type==='minute').value);
  return {hour,minute,text:`${hour<12?'오전':'오후'} ${hour%12||12}:${String(minute).padStart(2,'0')}`,night:hour<6||hour>=19,dusk:hour>=17&&hour<19||hour>=5&&hour<7};
}
export class MeadowWeather{
  constructor({storage=browserStorage(),fetcher=globalThis.fetch?.bind(globalThis),now=()=>Date.now()}={}){
    this.storage=storage;this.fetcher=fetcher;this.now=now;this.location=null;this.current=null;this.preview='live';this.status='지역을 선택하면 실제 날씨가 반영돼요.';this.nextFetch=0;this.generation=0;this.pending=false;
    try{const saved=JSON.parse(storage?.getItem('meadow.weather.v1')||'null');if(saved&&Number.isFinite(saved.latitude)&&Number.isFinite(saved.longitude)&&Math.abs(saved.latitude)<=90&&Math.abs(saved.longitude)<=180)this.location=saved;}catch{}
  }
  async search(name){
    const query=name.trim();if(query.length<2)throw new Error('도시 이름을 두 글자 이상 적어 주세요.');
    const lookup=citySearchTerm(query),url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.search=new URLSearchParams({name:lookup.term,count:'6',language:'ko',format:'json',...(lookup.korean?{countryCode:'KR'}:{})});
    const response=await this.fetcher(url,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('도시 검색에 연결하지 못했어요.');
    return (await response.json()).results||[];
  }
  async choose(place){
    const latitude=Math.round(Number(place.latitude)*50)/50,longitude=Math.round(Number(place.longitude)*50)/50;
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw new Error('지역 좌표를 확인할 수 없어요.');
    this.location={latitude,longitude,name:String(place.name||'내 주변').slice(0,80),timezone:place.timezone};
    this.current=null;this.generation++;this.nextFetch=0;this.pending=false;
    try{this.storage?.setItem('meadow.weather.v1',JSON.stringify(this.location));}catch{}
    await this.refresh();
  }
  clear(){
    this.generation++;this.location=null;this.current=null;this.pending=false;this.nextFetch=0;this.preview='live';this.status='지역을 선택하면 실제 날씨가 반영돼요.';
    try{this.storage?.removeItem('meadow.weather.v1');}catch{}
  }
  async refresh(){
    if(!this.location||this.pending)return;
    const generation=this.generation;this.pending=true;this.status='지역 날씨를 확인하고 있어요.';
    const location=this.location;
    try{
      const url=new URL('https://api.open-meteo.com/v1/forecast');url.search=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),current:'weather_code,cloud_cover,is_day',daily:'sunrise,sunset',timeformat:'unixtime',timezone:'auto',forecast_days:'1'});
      const response=await this.fetcher(url,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('weather');
      const data=await response.json();if(!Number.isFinite(data.current?.weather_code))throw new Error('weather data');
      if(generation!==this.generation)return;
      this.current={kind:weatherKind(data.current.weather_code),cloud:data.current.cloud_cover,isDay:data.current.is_day!==0,receivedAt:this.now(),sunrise:Number(data.daily?.sunrise?.[0])*1000,sunset:Number(data.daily?.sunset?.[0])*1000};
      if(data.timezone)this.location.timezone=data.timezone;
      this.status=`${location.name} · ${WEATHER_NAMES[this.current.kind]} · 15분마다 갱신`;
      this.nextFetch=this.now()+15*60*1000;
    }catch{
      if(generation!==this.generation)return;
      this.status='날씨 연결이 지연되고 있어요. 잠시 뒤 다시 확인합니다.';this.nextFetch=this.now()+2*60*1000;
    }finally{if(generation===this.generation)this.pending=false;}
  }
  tick(){if(this.location&&this.now()>=this.nextFetch&&!this.pending)void this.refresh();}
  snapshot(){
    const clock=localClock(new Date(this.now()),this.location?.timezone),fresh=this.current&&this.now()-this.current.receivedAt<60*60*1000;
    const kind=this.preview==='live'?(fresh?this.current.kind:'clear'):this.preview;
    return {...clock,kind,wet:kind==='rain'||kind==='snow',cloud:kind==='clear'?.1:kind==='clouds'?.45:.9,live:this.preview==='live'&&!!fresh,preview:this.preview!=='live',location:this.location?.name||'',label:WEATHER_NAMES[kind],sunrise:this.current?.sunrise,sunset:this.current?.sunset,night:fresh&&Number.isFinite(this.current.sunrise)&&Number.isFinite(this.current.sunset)?this.now()<this.current.sunrise||this.now()>=this.current.sunset:this.preview==='live'&&fresh?!this.current.isDay:clock.night};
  }
}
