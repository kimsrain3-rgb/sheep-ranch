export const presets = [
  {id:'straw', name:'밀짚모자', hair:'brown', outfit:'ochre'},
  {id:'bun', name:'묶은 머리', hair:'auburn', outfit:'sage'},
  {id:'glasses', name:'둥근 안경', hair:'silver', outfit:'navy'},
  {id:'curls', name:'짧은 곱슬', hair:'black', outfit:'clay'}
];
export const hairColors = {
  brown:['밤색','#6d5744'], auburn:['적갈색','#975e47'],
  silver:['은회색','#bcbab0'], black:['흑갈색','#443b37']
};
export const outfitColors = {
  ochre:['밀짚색','#d5ae5e','#c39c51','#d9b569'],
  sage:['풀잎색','#87a287','#627e68','#a3b799'],
  navy:['남색','#53677e','#3b5068','#8995a0'],
  clay:['벽돌색','#bd806a','#975f50','#cea18b']
};
export const appearanceKey = 'wind-sheep-meadow.visitor-look.v1';
export function resolveAppearance(value) {
  const preset = presets.find(p => p.id === value?.id) || presets[0];
  const hair = Object.hasOwn(hairColors, value?.hair) ? value.hair : preset.hair;
  const outfit = Object.hasOwn(outfitColors, value?.outfit) ? value.outfit : preset.outfit;
  const [,coat,shade,sleeve] = outfitColors[outfit];
  return {id:preset.id,hair,outfit,hairColor:hairColors[hair][1],coat,shade,sleeve};
}
function readAppearance() {
  try { return resolveAppearance(JSON.parse(localStorage.getItem(appearanceKey))); }
  catch { return resolveAppearance(); }
}
let active = readAppearance();
export function currentAppearance() { return active; }
export function applyAppearance(value) {
  active = resolveAppearance(value);
  const {id,hair,outfit} = active;
  try { localStorage.setItem(appearanceKey, JSON.stringify({id,hair,outfit})); return true; }
  catch { return false; }
}
