import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const port=Number(process.env.PORT || 4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.webm':'video/webm','.mp4':'video/mp4','.webp':'image/webp','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(url.pathname);
    let file=path.resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    let info=await stat(file);
    if(info.isDirectory()){
      if(!url.pathname.endsWith('/')){res.writeHead(308,{'Location':url.pathname+'/'+url.search});res.end();return;}
      file=path.join(file,'index.html');
      info=await stat(file);
    }
    if(!info.isFile())throw Error();
    const data=await readFile(file);
    const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    if(req.headers.range){
      const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      const start=range ? (range[1] ? Number(range[1]) : Math.max(0,data.length-Number(range[2]))) : -1;
      const end=range?.[1] && range[2] ? Math.min(Number(range[2]),data.length-1) : data.length-1;
      if(!range || (!range[1]&&!range[2]) || start<0 || start>end || start>=data.length){res.writeHead(416,{'Content-Range':`bytes */${data.length}`});res.end();return;}
      res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${data.length}`});
      res.end(req.method==='HEAD' ? undefined : data.subarray(start,end+1));
    }else{
      res.writeHead(200,{...headers,'Content-Length':data.length});
      res.end(req.method==='HEAD' ? undefined : data);
    }
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
