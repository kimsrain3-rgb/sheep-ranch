import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

// Browser suites use a running game and a browser. The remaining suites run
// against the game modules independently on every Pages build.
const files=readdirSync(new URL('../tests/',import.meta.url),{withFileTypes:true})
  .filter(file=>file.isFile()&&/\.[cm]js$/.test(file.name)&&!/-browser\.[cm]js$/.test(file.name))
  .map(file=>file.name).sort();
if(!files.length)throw Error('No game tests found');
for(const file of files){
  console.log('Running tests/'+file);
  const run=spawnSync(process.execPath,['tests/'+file],{stdio:'inherit',cwd:new URL('../',import.meta.url)});
  if(run.error)throw run.error;
  if(run.status!==0)process.exit(run.status??1);
}
