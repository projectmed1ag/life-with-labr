const clamp=value=>Math.max(0,Math.min(1,value));
export function photoCrop(width,height,{ratio=0,zoom=1,x=.5,y=.5,turns=0}={}){
  if(turns%2)[width,height]=[height,width];
  ratio=ratio||width/height;
  const cropWidth=Math.min(width,height*ratio)/Math.max(1,zoom);
  const cropHeight=cropWidth/ratio;
  return {x:(width-cropWidth)*clamp(x),y:(height-cropHeight)*clamp(y),width:cropWidth,height:cropHeight,sourceWidth:width,sourceHeight:height};
}
export function photoOutput(crop,max=2400){
  const scale=Math.min(1,max/Math.max(crop.width,crop.height));
  return {width:Math.max(1,Math.round(crop.width*scale)),height:Math.max(1,Math.round(crop.height*scale))};
}
