import {spawnSync} from 'node:child_process';
const [source,ffmpeg='ffmpeg']=process.argv.slice(2);
if(!source)throw new Error('Usage: node animation/export-menu-puppies.mjs input.mp4 [ffmpeg]');
const run=args=>{const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw Error(`FFmpeg exited with ${r.status}`);};
const key='colorkey=0x00FF00:0.34:0.10,despill=type=green:mix=0.7,crop=768:320:0:88,scale=480:200,format=rgba';
// Small paw reaches and play bows remain plausible in either direction.
// Keep adjacent frames at both turns and ease into them with a brief pause.
const loop='[0:v]trim=end_frame=65,setpts=PTS-STARTPTS,split=2[forward][back];'
  +'[forward]setpts=1.25*PTS,fps=24,tpad=stop_mode=clone:stop_duration=0.167[f];'
  +'[back]trim=start_frame=1:end_frame=64,reverse,setpts=1.25*(PTS-STARTPTS),fps=24,tpad=stop_mode=clone:stop_duration=0.167[b];'
  +`[f][b]concat=n=2:v=1:a=0,fps=24,${key}[out]`;
run(['-i',source,'-filter_complex',loop,'-map','[out]','-an','-c:v','libwebp_anim','-q:v','78','-loop','0','dist/assets/menu-puppies-v1.webp']);
run(['-i',source,'-vf',key,'-frames:v','1','-c:v','libwebp','-quality','90','dist/assets/menu-puppies-still-v1.webp']);
console.log('Exported reversible menu puppies and reduced-motion still');
