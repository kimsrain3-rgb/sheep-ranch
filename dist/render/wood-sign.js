// Carved Hangul strokes on the front of a wooden fascia. Each pair is a point
// on a 0–4 grid. Separate polylines keep the open counters legible at a distance.
const ring='10 30 41 43 34 14 03 01 10';
const strokes={
  ㄱ:['00 40 44'],ㄴ:['00 04 44'],ㄷ:['40 00 04 44'],
  ㄹ:['00 40 42 02 04 44'],ㅁ:['00 40 44 04 00'],
  ㅂ:['00 04 44 40','02 42'],ㅅ:['20 21 04','21 44'],ㅇ:[ring],
  ㅈ:['00 40','20 21 04','21 44'],ㅊ:['20 30','01 41','21 22 04','22 44'],
  ㅍ:['00 40','04 44','10 14','30 34'],
  ㅏ:['10 14','12 42'],ㅑ:['10 14','11 41','13 43'],ㅓ:['30 34','02 32'],
  ㅗ:['20 24','04 44'],ㅜ:['00 40','20 24'],ㅡ:['02 42'],ㅣ:['20 24'],
  ㅐ:['00 04','02 42','40 44']
};
const syllables={
  양:'ㅇㅑㅇ',들:'ㄷㅡㄹ',의:'ㅇㅢ',축:'ㅊㅜㄱ',사:'ㅅㅏ',닭:'ㄷㅏㄺ',집:'ㅈㅣㅂ',
  목:'ㅁㅗㄱ',동:'ㄷㅗㅇ',과:'ㄱㅘ',강:'ㄱㅏㅇ',아:'ㅇㅏ',지:'ㅈㅣ',
  풍:'ㅍㅜㅇ',차:'ㅊㅏ',전:'ㅈㅓㄴ',망:'ㅁㅏㅇ',대:'ㄷㅐ'
};
function component(parts,jamo,x,y,w,h){
  for(const path of strokes[jamo]){
    parts.push(path.split(' ').map(pair=>[x+Number(pair[0])*w/4,y+Number(pair[1])*h/4]));
  }
}
function carveSyllable(char){
  const [lead,vowel,tail]=syllables[char],parts=[];
  const height=tail ? .58 : .94;
  if(vowel==='ㅘ'||vowel==='ㅢ'){
    component(parts,lead,.04,0,.49,.60);
    component(parts,vowel==='ㅘ'?'ㅗ':'ㅡ',.02,.69,.56,.24);
    component(parts,vowel==='ㅘ'?'ㅏ':'ㅣ',.67,0,.28,.93);
  }else if(['ㅗ','ㅜ','ㅡ'].includes(vowel)){
    component(parts,lead,.12,0,.72,height*.56);
    component(parts,vowel,.02,height*.70,.92,height*.30);
  }else{
    component(parts,lead,.02,.04,.48,height-.07);
    component(parts,vowel,.61,0,.33,height);
  }
  if(tail==='ㄺ'){
    component(parts,'ㄹ',.03,.72,.40,.25);
    component(parts,'ㄱ',.58,.72,.34,.25);
  }else if(tail)component(parts,tail,.13,.72,.68,.25);
  return parts;
}
export function woodenSign(b,title,y,z,height,centerX=0){
  const chars=[...title],advance=char=>char===' ' ? .46 : 1.20;
  const span=chars.reduce((sum,char)=>sum+advance(char),0)*height;
  const walnut=b.palette.dark;
  const birch=b.palette.frame;
  b.box(title+' · 나무간판',centerX,y,z,span+.34,height*1.48,.13,walnut);
  let x=centerX-span/2+.08*height;
  for(const char of chars){
    if(char!==' '){
      for(const line of carveSyllable(char)){
        for(let i=1;i<line.length;i++){
          const point=([u,v])=>[x+u*height,y+(.5-v)*height,z-.077];
          b.beam('wood letter '+char,point(line[i-1]),point(line[i]),height*.095,birch);
        }
      }
    }
    x+=advance(char)*height;
  }
}
