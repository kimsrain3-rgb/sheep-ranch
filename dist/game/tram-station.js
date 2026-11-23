export const TRAM_DESTINATIONS=Object.freeze(['북극','사막','정글']);

export const TRAM_STATION=Object.freeze({
  x:66,z:50,walkableFloors:0,width:2.76,depth:3.25,wallThickness:.15,benchDepth:.49,
  entrance:Object.freeze({x:66,z:47.98}),
  waitingSpot:Object.freeze({x:66,z:49.45})
});

export const TRAM_STOP=Object.freeze({
  x:68.6,z:46,width:7.23,depth:2.50,walkableFloors:0,
  entrance:TRAM_STATION.entrance
});
export const TRAM_PLATFORM=Object.freeze({x:65.6,z:47.98,width:10.5,depth:1.28,height:.144});
export const STATION_FLOOR_TOP=.097;
export function stationWalkingHeight(x,z){
  const p=TRAM_PLATFORM,s=TRAM_STATION;
  if(Math.abs(x-p.x)<=p.width/2 && Math.abs(z-p.z)<=p.depth/2)return p.height;
  if(Math.abs(x-s.x)<=s.width/2 && Math.abs(z-s.z)<=s.depth/2)return STATION_FLOOR_TOP;
  return 0;
}
export const TRACK_CURVE=Object.freeze({x:89.3,z:47.6});
export const TRACK_GAUGE=1.12;
export const RAIL_TOP=.19;
