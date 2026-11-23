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

// The west platform door and step are centered at local coach x = -2.55.
export const TRAM_BOARDING_WALK=1.25;
export const TRAM_BOARDING_HOLD=1;
export function tramBoardingPose(start,elapsed){
  const doorX=TRAM_STOP.x-2.55;
  const points=[
    [0,start.x,start.z,TRAM_PLATFORM.height],
    [.38,doorX,TRAM_STOP.z+1.49,TRAM_PLATFORM.height],
    [.82,doorX,TRAM_STOP.z+1.17,.60],
    [TRAM_BOARDING_WALK,doorX,TRAM_STOP.z+.80,.797]
  ];
  for(let i=1;i<points.length;i++){
    const [t0,x0,z0,h0]=points[i-1],[t1,x1,z1,h1]=points[i];
    if(elapsed<=t1){
      const f=Math.max(0,(elapsed-t0)/(t1-t0));
      const rise=f*f*(3-2*f);
      return {x:x0+(x1-x0)*f,z:z0+(z1-z0)*f,height:h0+(h1-h0)*rise,walking:elapsed<t1||i<3};
    }
  }
  return {x:doorX,z:TRAM_STOP.z+.80,height:.797,walking:false};
}
