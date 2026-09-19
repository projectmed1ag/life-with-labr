import {spawnSync} from 'node:child_process';
const [source,ffmpeg='ffmpeg']=process.argv.slice(2);
if(!source)throw new Error('Usage: node animation/export-puppy-toy.mjs input.mp4 [ffmpeg]');
const run=args=>{const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw Error(`FFmpeg exited with ${r.status}`);};
// User-requested forward/backward loop: put the duck down, then return.
// Only adjacent frames meet at both turns; endpoints are not repeated.
const filter='[0:v]trim=end_frame=61,setpts=PTS-STARTPTS,split=2[forward][back];'
  +'[back]trim=start_frame=1:end_frame=60,reverse,setpts=PTS-STARTPTS[reverse];'
  +'[forward][reverse]concat=n=2:v=1:a=0,fps=24,'
  +'colorkey=0x00FF00:0.34:0.10,despill=type=green:mix=0.7,crop=480:480:144:24,scale=400:400,format=rgba[out]';
run(['-i',source,'-filter_complex',filter,'-map','[out]','-an','-c:v','libwebp_anim','-q:v','78','-loop','0','dist/assets/puppy-toy-v2.webp']);
run(['-i',source,'-vf','colorkey=0x00FF00:0.34:0.10,despill=type=green:mix=0.7,crop=480:480:144:24,scale=400:400,format=rgba','-frames:v','1','-c:v','libwebp','-quality','90','dist/assets/puppy-toy-still-v2.webp']);
console.log('Exported transparent puppy toy animation and still');
