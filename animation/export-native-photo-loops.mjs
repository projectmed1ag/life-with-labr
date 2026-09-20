import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve, dirname, basename} from 'node:path';

const [portrait,hero,ffmpeg='ffmpeg']=process.argv.slice(2);
if(!portrait||!hero)throw Error('Usage: node animation/export-native-photo-loops.mjs portrait.mp4 hero.mp4 [ffmpeg]');
const fps=24,forwardFrames=193;
const run=args=>{
  const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)throw Error(`FFmpeg exited with ${result.status}`);
};
const folder=mkdtempSync(join(tmpdir(),'labr-native-loops-'));
try{
  for(const [name,source] of [['portrait',portrait],['hero',hero]]){
    const forward=join(folder,`${name}.mkv`);
    // Retain the entire native eight-second movement at its generated speed.
    run(['-i',source,'-vf',`trim=end_frame=${forwardFrames},setpts=N/(${fps}*TB)`,
      '-an','-c:v','ffv1','-r',String(fps),'-fps_mode','cfr',forward]);
    const filter='[0:v]split=2[f][reverse];'
      +`[reverse]trim=start_frame=1:end_frame=${forwardFrames-1},reverse,setpts=N/(${fps}*TB)[b];`
      +`[f][b]concat=n=2:v=1:a=0,settb=1/${fps},setpts=N,format=yuv420p[out]`;
    // Do not repeat endpoint frames: the wrap is one adjacent frame of motion.
    run(['-i',forward,'-filter_complex',filter,'-map','[out]','-an','-map_metadata','-1',
      '-r',String(fps),'-fps_mode','cfr','-c:v','libx264','-preset','slow','-crf','18',
      '-bf','0','-g',String(fps),'-keyint_min',String(fps),'-sc_threshold','0',
      '-movflags','+faststart',`dist/assets/puppy-${name}-loop-v4.mp4`]);
  }
}finally{
  if(dirname(resolve(folder))!==resolve(tmpdir())||!basename(folder).startsWith('labr-native-loops-'))throw Error('Unexpected temporary path');
  rmSync(folder,{recursive:true,force:true});
}
console.log('Exported full eight-second generated actions, played forward and backward at native speed: 16-second loops.');
