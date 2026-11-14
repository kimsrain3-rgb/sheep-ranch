import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMPACT_UI_QUERY,isCompactViewport} from '../dist/game/layout.js';
for(const [w,h,expected] of [[390,760,true],[760,390,true],[844,320,true],[915,412,true],[1080,480,true],[700,900,true],[701,541,false],[1365,936,false],[1200,700,false]])assert.equal(isCompactViewport(w,h),expected,`${w}x${h}`);
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
assert.ok(css.includes('@media'+COMPACT_UI_QUERY));
const ui=readFileSync(new URL('../dist/mobile-ui.js',import.meta.url),'utf8');
assert.ok(ui.includes('matchMedia(COMPACT_UI_QUERY)'));
console.log('Responsive layout: portrait, rotated phone, short wide window, desktop and matching CSS/JS compact breakpoints passed.');
