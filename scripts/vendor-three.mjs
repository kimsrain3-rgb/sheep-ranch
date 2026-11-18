import {mkdir,copyFile} from 'node:fs/promises';
const target=new URL('../dist/vendor/three/',import.meta.url);
await mkdir(target,{recursive:true});
for(const [source,name] of [['build/three.module.min.js','three.module.js'],['build/three.core.min.js','three.core.min.js'],['LICENSE','LICENSE.txt']])await copyFile(new URL('../node_modules/three/'+source,import.meta.url),new URL(name,target));
console.log('Vendored Three.js 0.180.0 with its MIT license.');
