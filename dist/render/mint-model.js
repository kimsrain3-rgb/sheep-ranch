// Lazily load the model only for visitors trying the 3D appearance.
let painter;
let loading;
export function ensureMintModel() {
  loading ??= import('./mint-model-scene.js').then(m=>m.createModelPainter())
    .then(draw=>{ painter=draw; return true; })
    .catch(error=>{ console.warn('Mint avatar preview unavailable',error); return false; });
  return loading;
}
export function mintModelReady() { return !!painter; }
export function drawMintModel(context,feet,state) {
  if (!feet) return false;
  if (!painter) { ensureMintModel(); return false; }
  painter(context,feet,state);
  return true;
}
