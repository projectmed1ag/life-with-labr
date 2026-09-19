import {spawnSync} from 'node:child_process';
const [source,ffmpeg='ffmpeg']=process.argv.slice(2);
if(!source)throw new Error('Usage: node animation/export-puppy-toy.mjs input.mp4 [ffmpeg]');
const run=args=>{const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw Error(`FFmpeg exited with ${r.status}`);};
// The half-second overlap joins matching seated poses without reversing motion.
const filter='[0:v]trim=end_frame=193,fps=24,settb=AVTB,split=2[main][head];'
  +'[head]trim=end_frame=13,setpts=PTS-STARTPTS,fps=24,settb=AVTB[opening];'
  +'[main][opening]xfade=transition=fade:duration=0.5:offset=7.5,'
  +'trim=start_frame=13:end_frame=193,setpts=PTS-STARTPTS,'
  +'colorkey=0x00FF00:0.34:0.10,despill=type=green:mix=0.7,crop=480:480:144:24,scale=400:400,format=rgba[out]';
run(['-i',source,'-filter_complex',filter,'-map','[out]','-an','-c:v','libwebp_anim','-q:v','78','-loop','0','dist/assets/puppy-toy-v1.webp']);
run(['-ss',String(13/24),'-i',source,'-vf','colorkey=0x00FF00:0.34:0.10,despill=type=green:mix=0.7,crop=480:480:144:24,scale=400:400,format=rgba','-frames:v','1','-c:v','libwebp','-quality','90','dist/assets/puppy-toy-still-v1.webp']);
console.log('Exported transparent puppy toy animation and still');
