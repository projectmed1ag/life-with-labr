import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve, dirname, basename} from 'node:path';
const [portrait, hero, ffmpeg='ffmpeg']=process.argv.slice(2);
if(!portrait||!hero)throw new Error('Usage: node animation/export-photo-loops.mjs portrait.mp4 hero.mp4 [ffmpeg]');
const run=args=>{const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw Error(`FFmpeg exited with ${r.status}`);};
// Keep only the actual head turn: the generated clips hold their poses for
// most of their duration. Context frames let optical flow interpolate both
// ends without padding. Interpolate once, then reverse those exact frames.
const folder=mkdtempSync(join(tmpdir(),'labr-photo-loops-'));
try {
  for(const {source,name,start,end,speed,first,count} of [
    {source:portrait,name:'puppy-portrait',start:6,end:27,speed:3.2,first:8,count:65},
    {source:hero,name:'puppy-hero',start:14,end:38,speed:3,first:8,count:72}
  ]){
    const forward=join(folder,`${name}.mkv`);
    run(['-i',source,'-vf',
      `trim=start_frame=${start}:end_frame=${end},setpts=${speed}*(PTS-STARTPTS),`
      +'minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none,'
      +`trim=start_frame=${first}:end_frame=${first+count},setpts=N/(30*TB)`,
      '-an','-c:v','ffv1',forward]);
    const filter='[0:v]split=2[f][back];'
      +`[back]trim=start_frame=1:end_frame=${count-1},reverse,setpts=N/(30*TB)[b];`
      +'[f][b]concat=n=2:v=1:a=0,settb=1/30,setpts=N,format=yuv420p[out]';
    run(['-i',forward,'-filter_complex',filter,'-map','[out]','-an',
      '-r','30','-fps_mode','cfr','-c:v','libx264','-preset','slow','-crf','19','-bf','0','-g','30',
      '-keyint_min','30','-sc_threshold','0','-movflags','+faststart',
      `dist/assets/${name}-loop-v2.mp4`]);
  }
} finally {
  if(dirname(resolve(folder))!==resolve(tmpdir()) || !basename(folder).startsWith('labr-photo-loops-')) {
    throw new Error('Refusing to remove a directory outside the export temporary folder.');
  }
  rmSync(folder,{recursive:true,force:true});
}
console.log('Exported continuous 30 fps forward/reverse photo loops without held frames.');
