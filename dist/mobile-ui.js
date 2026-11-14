import {COMPACT_UI_QUERY} from './game/layout.js';
const $=id=>document.getElementById(id);
const toggle=$('mobile-menu-toggle'),overlay=$('mobile-menu'),sheet=$('mobile-sheet');
const media=matchMedia(COMPACT_UI_QUERY);
const groups=[['mobile-menu-help',['help']],['mobile-menu-camera',['camera-controls']],['mobile-menu-rest',['sit','hammock','time']],['mobile-menu-care',['milk','hay','barn-enter','lodge-enter','my-sheep']],['mobile-menu-stats',[]]];
const stats=document.querySelector('.stats');
const items=groups.flatMap(([target,ids])=>ids.map(id=>({node:$(id),target:$(target)})));
items.push({node:stats,target:$('mobile-menu-stats')});
for(const item of items){item.home=document.createComment('menu home');item.node.before(item.home);}
let returnFocus;
function close(restoreFocus=true){overlay.hidden=true;toggle.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');if(restoreFocus&&returnFocus?.isConnected)returnFocus.focus();}
function layout(){close(false);for(const item of items){if(media.matches)item.target.append(item.node);else item.home.after(item.node);}}
toggle.onclick=()=>{if(!overlay.hidden){close();return;}returnFocus=document.activeElement;overlay.hidden=false;toggle.setAttribute('aria-expanded','true');document.body.classList.add('menu-open');$('mobile-menu-close').focus();};
$('mobile-menu-close').onclick=close;
overlay.addEventListener('click',e=>{if(e.target===overlay)close();const action=e.target.closest('button');if(action&&['sit','hammock','camera-home','help','milk','hay','my-sheep','time','barn-enter','lodge-enter'].includes(action.id))close(action.id!=='help');});
overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}if(e.key==='Tab'){const buttons=[...sheet.querySelectorAll('button:not(:disabled)')].filter(el=>el.getClientRects().length);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
media.addEventListener('change',layout);layout();
