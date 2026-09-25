import test from 'node:test';
import assert from 'node:assert/strict';
import {photoCrop,photoOutput} from '../public/photo-geometry.js';

test('Photo crops remain inside the source for portrait, landscape and rotated photos',()=>{
  for(const [width,height] of [[4032,3024],[3024,4032],[800,800],[320,200]]){
    for(const ratio of [0,.75,1,1.5])for(const turns of [0,1,2,3])for(const zoom of [1,2,3])for(const x of [0,.5,1]){
      const crop=photoCrop(width,height,{ratio,turns,zoom,x,y:1-x});
      assert(crop.x>=0&&crop.y>=0);
      assert(crop.x+crop.width<=crop.sourceWidth+1e-8);
      assert(crop.y+crop.height<=crop.sourceHeight+1e-8);
      if(ratio)assert(Math.abs(crop.width/crop.height-ratio)<1e-8);
      const output=photoOutput(crop);
      assert(Math.max(output.width,output.height)<=2400);
      assert(output.width<=Math.ceil(crop.width)&&output.height<=Math.ceil(crop.height));
    }
  }
});
test('Whole-photo mode preserves all pixels and crop export never enlarges small photos',()=>{
  assert.deepEqual(photoCrop(4000,3000),{x:0,y:0,width:4000,height:3000,sourceWidth:4000,sourceHeight:3000});
  assert.deepEqual(photoOutput(photoCrop(4000,3000,{turns:1})),{width:1800,height:2400});
  assert.deepEqual(photoOutput(photoCrop(4000,3000,{ratio:.75})),{width:1800,height:2400});
  assert.deepEqual(photoOutput(photoCrop(640,480)),{width:640,height:480});
  const left=photoCrop(2400,1600,{ratio:.75,x:0}),right=photoCrop(2400,1600,{ratio:.75,x:1});
  assert.equal(left.x,0);assert.equal(right.x,1200);
});
