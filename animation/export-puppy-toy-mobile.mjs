import {spawnSync} from 'node:child_process';
const [source, ffmpeg = 'ffmpeg'] = process.argv.slice(2);
if (!source) throw new Error('Usage: node animation/export-puppy-toy-mobile.mjs input.mp4 [ffmpeg]');
// Slower mobile boomerang, with a pause after putting the toy down.
// Keep the original frames so retiming cannot distort the puppy's anatomy.
const filter = '[0:v]trim=end_frame=61,setpts=PTS-STARTPTS,split=2[forward][back];'
  + '[forward]setpts=1.6*PTS,fps=24,tpad=stop_mode=clone:stop_duration=0.75[f];'
  + '[back]trim=start_frame=1:end_frame=60,reverse,setpts=2.4*(PTS-STARTPTS),fps=24,tpad=stop_mode=clone:stop_duration=0.5[b];'
  + '[f][b]concat=n=2:v=1:a=0,fps=24,'
  + 'colorkey=0x00FF00:0.34:0.10,despill=type=green:mix=0.7,crop=480:480:144:24,scale=400:400,format=rgba[out]';
const result = spawnSync(ffmpeg, ['-hide_banner','-loglevel','error','-y','-i',source,
  '-filter_complex',filter,'-map','[out]','-an','-c:v','libwebp_anim','-q:v','78','-loop','0',
  'dist/assets/puppy-toy-mobile-v3.webp'], {stdio:'inherit'});
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`FFmpeg exited with ${result.status}`);
console.log('Exported slower transparent mobile puppy loop');
