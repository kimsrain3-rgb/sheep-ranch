export const TRAM_DESTINATIONS=Object.freeze(['북극','사막','정글']);

export const TRAM_STATION=Object.freeze({
  x:66,z:50,walkableFloors:0,width:2.76,depth:3.25,wallThickness:.15,benchDepth:.49,
  entrance:Object.freeze({x:66,z:47.98}),
  waitingSpot:Object.freeze({x:66,z:49.45})
});

export const TRAM_STOP=Object.freeze({
  x:68.6,z:46,width:6.15,depth:2.04,walkableFloors:0,
  entrance:TRAM_STATION.entrance
});
export const TRACK_CURVE=Object.freeze({x:89.3,z:47.6});
export const TRACK_GAUGE=1.12;
export const RAIL_TOP=.19;
