import {WEATHER_NAMES} from './game/weather.js?v=night-barn';
export function setupMeadowPanel({weather,bond,flock,getSelected,onMessage,onPause,onFind}){
  const $=id=>document.getElementById(id),dialog=$('meadow-panel');let candidate=null,searchVersion=0,returnFocus=null;
  const status=text=>$('weather-status').textContent=text;
  function refresh(){
    const w=weather.snapshot(),friend=flock.adults.find(a=>a.id===bond.friendId);
    $('weather-now').textContent=`${w.location||'기기 시간'} · ${w.text} · ${w.preview?'감상용 ':w.live?'':'기본 풍경 · '}${w.label}`;
    status(weather.status);
    $('bond-storage').textContent=bond.persistent?'이름과 친밀도는 이 브라우저에 저장됩니다. 다른 기기와는 아직 연결되지 않아요.':'브라우저 저장이 제한되어 이번 방문 동안만 기억할 수 있어요.';
    $('bond-current').textContent=friend?`${friend.name} · ${(bond.points[friend.id]||0)>=6?'나를 알아보는 사이':'서로 알아가는 중'}`:'자주 쓰다듬으면 먼저 다가오는 양이 생겨요.';
    $('friend-find').disabled=!friend;
    $('bond-candidate').textContent=candidate?`${candidate.name}에게 이름 붙이기`:'양을 쓰다듬은 뒤 이곳에서 이름을 붙여주세요.';
    $('sheep-new-name').disabled=!candidate;$('sheep-name-save').disabled=!candidate;
  }
  function open(){
    returnFocus=document.activeElement;candidate=getSelected()||flock.adults.find(a=>a.id===bond.friendId)||null;if(candidate?.isLamb)candidate=candidate.mother;
    $('sheep-new-name').value=candidate?.name||'';refresh();onPause(true);dialog.showModal();
  }
  dialog.addEventListener('close',()=>{onPause(false);returnFocus?.focus();});
  $('meadow-panel-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  $('my-sheep').onclick=$('time').onclick=open;
  $('name-form').onsubmit=e=>{e.preventDefault();if(bond.name(candidate,$('sheep-new-name').value,flock)){refresh();$('bond-candidate').textContent='이름을 기억했어요. 자주 만나며 친해져요.';onMessage(`${candidate.name}, 앞으로 이렇게 부를게요.`);}};
  $('friend-find').onclick=()=>{const a=flock.adults.find(a=>a.id===bond.friendId);if(a){dialog.close();onFind(a);}};
  $('weather-preview').onchange=e=>{weather.preview=e.target.value;refresh();};
  $('weather-forget').onclick=()=>{searchVersion++;weather.clear();$('weather-preview').value='live';$('city-results').replaceChildren();refresh();};
  $('city-form').onsubmit=async e=>{
    e.preventDefault();const version=++searchVersion;$('city-results').replaceChildren();status('도시를 찾고 있어요.');
    try{
      const places=await weather.search($('weather-city').value);if(version!==searchVersion)return;
      if(!places.length){status('찾는 도시가 없어요. 영문 이름으로도 검색해 보세요.');return;}
      status('아래에서 지역을 선택해 주세요.');
      for(const place of places){const button=document.createElement('button');button.type='button';button.textContent=[place.name,place.admin1,place.country].filter(Boolean).join(' · ');button.onclick=async()=>{searchVersion++;$('city-results').replaceChildren();status('날씨를 연결하고 있어요.');weather.preview='live';$('weather-preview').value='live';await weather.choose(place);refresh();};$('city-results').append(button);}
    }catch(error){if(version===searchVersion)status(error.message||'도시 검색에 연결하지 못했어요.');}
  };
  $('weather-locate').onclick=()=>{
    if(!navigator.geolocation){status('위치를 확인할 수 없어요. 도시를 검색해 주세요.');return;}
    const version=++searchVersion;status('위치 허용을 기다리고 있어요.');
    navigator.geolocation.getCurrentPosition(async position=>{
      if(version!==searchVersion)return;status('날씨를 연결하고 있어요.');
      try{weather.preview='live';$('weather-preview').value='live';await weather.choose({latitude:position.coords.latitude,longitude:position.coords.longitude,name:'내 주변'});refresh();}catch{status('위치를 연결하지 못했어요. 도시를 선택해 주세요.');}
    },()=>{if(version===searchVersion)status('위치를 확인하지 못했어요. 도시를 직접 검색할 수 있어요.');},{enableHighAccuracy:false,timeout:12000,maximumAge:3600000});
  };
  return {open,refresh};
}
