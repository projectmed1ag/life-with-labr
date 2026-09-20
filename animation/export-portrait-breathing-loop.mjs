import {spawnSync} from 'node:child_process';

const [source,ffmpeg='ffmpeg']=process.argv.slice(2);
if(!source)throw Error('Usage: node animation/export-portrait-breathing-loop.mjs portrait-breathing.mp4 [ffmpeg]');

const fps=24,frames=193;
// Gentle panting and rhythmic chest movement work in either direction.
// Each endpoint appears once, so neither direction change adds a held frame.
const filter=`[0:v]trim=end_frame=${frames},setpts=N/(${fps}*TB),split=2[f][r];`
  +`[r]trim=start_frame=1:end_frame=${frames-1},reverse,setpts=N/(${fps}*TB)[b];`
  +`[f][b]concat=n=2:v=1:a=0,settb=1/${fps},setpts=N,format=yuv420p[out]`;
const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',source,
  '-filter_complex',filter,'-map','[out]','-an','-map_metadata','-1',
  '-r',String(fps),'-fps_mode','cfr','-c:v','libx264','-preset','slow','-crf','16',
  '-bf','0','-g',String(fps),'-keyint_min',String(fps),'-sc_threshold','0',
  '-movflags','+faststart','dist/assets/puppy-portrait-loop-v5.mp4'],{stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)throw Error(`FFmpeg exited with ${result.status}`);
console.log('Exported portrait breathing: eight seconds forward and eight seconds backward, 24 fps.');
