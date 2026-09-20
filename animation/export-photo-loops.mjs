import {spawnSync} from 'node:child_process';
const [portrait, hero, ffmpeg='ffmpeg']=process.argv.slice(2);
if(!portrait||!hero)throw new Error('Usage: node animation/export-photo-loops.mjs portrait.mp4 hero.mp4 [ffmpeg]');
const run=args=>{const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw Error(`FFmpeg exited with ${r.status}`);};
// Use one calm head movement and its exact reverse. Both directions have
// identical timing, and only neighboring frames meet at the loop boundary.
for(const [source,name] of [[portrait,'puppy-portrait'],[hero,'puppy-hero']]){
  const filter='[0:v]trim=end_frame=65,setpts=PTS-STARTPTS,split=2[forward][back];'
    +'[forward]setpts=1.5*PTS,fps=24,tpad=stop_mode=clone:stop_duration=0.167[f];'
    +'[back]trim=start_frame=1:end_frame=64,reverse,setpts=1.5*(PTS-STARTPTS),fps=24,tpad=stop_mode=clone:stop_duration=0.167[b];'
    +'[f][b]concat=n=2:v=1:a=0,fps=24,format=yuv420p[out]';
  run(['-i',source,'-filter_complex',filter,'-map','[out]','-an','-c:v','libx264','-preset','slow','-crf','21','-movflags','+faststart',`dist/assets/${name}-loop-v1.mp4`]);
}
console.log('Exported symmetric photo loops with matching forward/reverse timing.');
