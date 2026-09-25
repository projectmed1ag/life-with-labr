import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile,writeFile,stat,unlink} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import sharp from 'sharp';
import {openStore} from './store.mjs';
import {verifyPassword,token,digest,hashPassword} from './auth.mjs';
import {HttpError,validId} from './validation.mjs';
import {renderSite} from '../build.mjs';

const ROOT=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
export async function createApplication({dataDir=path.join(ROOT,'.cms-data'),adminOrigin='http://127.0.0.1:4180',development=false,seed,renderer=renderSite}={}) {
  if(!development && !adminOrigin.startsWith('https://')) throw new Error('Production admin requires HTTPS.');
  const assetDirectory=path.join(ROOT,'dist/assets');
  seed??={litters:JSON.parse(await readFile(path.join(ROOT,'src/data/litters.json'))),gallery:JSON.parse(await readFile(path.join(ROOT,'src/data/gallery.json')))};
  const store=openStore(dataDir,{seed,assetDirectory});
  let pages=await renderer(store.published()),queue=Promise.resolve(),hashing=0,uploading=false;
  const dummyPassword=await hashPassword(token());
  const cookieName=development?'lwl_session':'__Host-lwl_session';
  const cookie=(value,age)=>`${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${development?'':'; Secure'}`;
  const fail=(status,message)=>{throw new HttpError(status,message);};
  const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const body=async(req,max=1024*1024)=>{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>max)fail(413,'Файл слишком большой. Максимум — 12 МБ.');chunks.push(chunk);}return Buffer.concat(chunks);};
  const jsonBody=async req=>{if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'Ожидается JSON.');try{return JSON.parse((await body(req)).toString());}catch(error){if(error instanceof HttpError)throw error;fail(400,'Не удалось прочитать данные.');}};
  const session=req=>{
    const raw=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
    return raw&&/^[a-f0-9]{64}$/.test(raw)?store.db.prepare('SELECT * FROM sessions WHERE token=? AND expires>?').get(digest(raw),Date.now()):null;
  };
  const file=async(req,res,filename)=>{
    const info=await stat(filename).catch(()=>null);if(!info?.isFile())fail(404,'Страница не найдена.');
    const headers={'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':filename.includes('upload-')?'public, max-age=31536000, immutable':'public, max-age=300','Accept-Ranges':'bytes'};
    let start=0,end=info.size-1,status=200;
    if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!match)fail(416,'Недопустимый диапазон.');start=+match[1];end=match[2]?Math.min(+match[2],end):end;if(start>end)fail(416,'Недопустимый диапазон.');headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;status=206;}
    res.writeHead(status,{...headers,'Content-Length':Math.max(0,end-start+1)});
    if(req.method==='HEAD'||!info.size)res.end();else createReadStream(filename,{start,end}).on('error',()=>res.destroy()).pipe(res);
  };
  const serialize=work=>{const pending=queue.then(work);queue=pending.catch(()=>{});return pending;};
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
    const isAdmin=development||req.headers.host===new URL(adminOrigin).host;
    try{
      const url=new URL(req.url,'http://localhost'),route=decodeURIComponent(url.pathname);
      if(route==='/healthz')return json(res,200,{ok:true});
      if(route.startsWith('/api/')){
        if(!isAdmin)fail(404,'Страница не найдена.');
        if(!['GET','HEAD'].includes(req.method) && req.headers.origin!==adminOrigin)fail(403,'Обновите страницу и повторите действие.');
        if(route==='/api/login' && req.method==='POST'){
          const input=await jsonBody(req),now=Date.now();
          const ip=development?req.socket.remoteAddress:req.headers['x-real-ip']||req.socket.remoteAddress;
          const key=digest(String(ip));
          const attempt=store.db.prepare('SELECT * FROM attempts WHERE key=?').get(key);
          if(attempt?.until>now && attempt.count>=8)fail(429,'Слишком много попыток. Попробуйте через 15 минут.');
          if(hashing>=2)fail(429,'Вход занят. Повторите через несколько секунд.');
          store.db.prepare('INSERT INTO attempts VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count,until=excluded.until').run(key,attempt?.until>now?attempt.count+1:1,attempt?.until>now?attempt.until:now+900000);
          const user=typeof input.username==='string'?store.db.prepare('SELECT * FROM users WHERE username=?').get(input.username):null;
          hashing++;let valid;try{valid=await verifyPassword(input.password,user?.password||dummyPassword);}finally{hashing--;}
          if(!valid||!user)fail(401,'Неверный логин или пароль.');
          store.db.prepare('DELETE FROM attempts WHERE key=?').run(key);
          const raw=token(),csrf=token();
          store.db.prepare('DELETE FROM sessions WHERE expires<?').run(now);
          store.db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(digest(raw),user.username,csrf,now+43200000);
          res.setHeader('Set-Cookie',cookie(raw,43200));return json(res,200,{username:user.username,csrf});
        }
        const current=session(req);if(!current)fail(401,'Войдите в админку.');
        if(!['GET','HEAD'].includes(req.method)&&req.headers['x-csrf-token']!==current.csrf)fail(403,'Сессия обновилась. Перезагрузите страницу.');
        if(route==='/api/session'&&req.method==='GET')return json(res,200,{username:current.username,csrf:current.csrf});
        if(route==='/api/logout'&&req.method==='POST'){store.db.prepare('DELETE FROM sessions WHERE token=?').run(current.token);res.setHeader('Set-Cookie',cookie('',0));return json(res,200,{ok:true});}
        if(route==='/api/content'&&req.method==='GET')return json(res,200,{records:store.all()});
        if(route==='/api/upload'&&req.method==='POST'){
          if(uploading)fail(429,'Дождитесь завершения загрузки фотографии.');
          uploading=true;let target;
          try{
            const bytes=await body(req,12*1024*1024);
            const input=sharp(bytes,{limitInputPixels:40_000_000,failOn:'error'}),meta=await input.metadata();
            if(!['jpeg','png','webp'].includes(meta.format)||meta.pages>1)fail(400,'Выберите обычное фото JPG, PNG или WebP.');
            const src=`upload-${token().slice(0,32)}.webp`;target=path.join(dataDir,'uploads',src);
            const result=await input.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:86}).toFile(target);
            const photo={src,width:result.width,height:result.height,alt:''};store.addMedia(photo);return json(res,201,photo);
          }catch(error){if(target)await unlink(target).catch(()=>{});if(error instanceof HttpError)throw error;fail(400,'Не удалось прочитать фото. Выберите JPG, PNG или WebP до 12 МБ.');}finally{uploading=false;}
        }
        const match=/^\/api\/content\/(litters|gallery)\/([a-z0-9-]+)$/.exec(route);
        if(match&&req.method==='PUT'){
          const input=await jsonBody(req),[,kind,id]=match;if(!validId(id))fail(400,'Некорректный адрес.');
          if(kind==='gallery' && (id!=='gallery' || !['draft','publish'].includes(input.action)))fail(400,'Галерея единая. Обновите страницу, чтобы редактировать фотографии.');
          if(!Number.isInteger(input.version)||input.version<0)fail(400,'Обновите запись.');
          return await serialize(async()=>{
            // Render first: failed publication leaves both the live pages and stored record intact.
            let nextPages;
            if(['publish','unpublish','archive'].includes(input.action)){
              const {validateContent}=await import('./validation.mjs');
              const data=validateContent(kind,{...input.data,id},{publish:input.action==='publish',mediaExists:store.mediaExists});
              const next=store.published();next[kind]=next[kind].filter(item=>item.id!==id);if(input.action==='publish')next[kind].unshift(data);
              next.gallery.sort((a,b)=>(b.date||'').localeCompare(a.date||''));nextPages=await renderer(next);
            }
            const record=store.save(kind,id,input.data,input.version,input.action);
            if(nextPages)pages=nextPages;
            return json(res,200,{record});
          });
        }
        fail(404,'Неизвестный запрос.');
      }
      if(!['GET','HEAD'].includes(req.method))fail(405,'Метод не поддерживается.');
      if(route.startsWith('/assets/')){
        const name=route.slice(8);if(!/^(?:fonts\/)?[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(name))fail(404,'Файл не найден.');
        return await file(req,res,path.join(name.startsWith('upload-')?path.join(dataDir,'uploads'):assetDirectory,name));
      }
      if(isAdmin && ((!development&&route==='/')||route==='/admin/'||route.startsWith('/admin/'))){
        res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
        res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Cache-Control','no-store');
        const name=route==='/'||route==='/admin/'?'index.html':route.slice(7);
        if(!['index.html','admin.js','admin.css','photo-editor.js','photo-geometry.js'].includes(name))fail(404,'Страница не найдена.');
        const content=await readFile(path.join(ROOT,'cms/public',name));res.writeHead(200,{'Content-Type':types[path.extname(name)]});return res.end(req.method==='HEAD'?undefined:content);
      }
      if(isAdmin&&!development && route!=='/fonts.css')fail(404,'Страница не найдена.');
      const old={'/moments/':'/gallery/','/moments.html':'/gallery/','/en/moments/':'/en/gallery/'};
      if(old[route]){res.writeHead(308,{Location:old[route]+url.search});return res.end();}
      const key=route.endsWith('/')?route+'index.html':route;
      if(pages.has(key)){res.writeHead(200,{'Content-Type':types[path.extname(key)],'Cache-Control':'no-cache'});return res.end(req.method==='HEAD'?undefined:pages.get(key));}
      if(pages.has(route+'/index.html')){res.writeHead(308,{Location:route+'/'+url.search});return res.end();}
      const closedLitter=/^\/(en\/)?puppies\/([a-z0-9-]+)(?:\/index\.html|\/)?$/.exec(route);
      if(closedLitter && store.get('litters',closedLitter[2])?.archived){res.writeHead(302,{Location:closedLitter[1]?'/en/puppies/':'/puppies/','Cache-Control':'no-store'});return res.end();}
      if(/^\/[a-zA-Z0-9-]+\.(css|js)$/.test(route)||['/favicon-64.png','/favicon.svg','/apple-touch-icon.png'].includes(route))return await file(req,res,path.join(ROOT,'dist',route));
      fail(404,'Страница не найдена.');
    }catch(error){if(res.headersSent)return res.destroy();json(res,error.status||500,{error:error.status?error.message:'Не удалось сохранить изменения. Повторите попытку.'});if(!error.status)console.error('Request failed:',error.message);}
  });
  server.requestTimeout=30000;server.headersTimeout=15000;
  const maintenance=setInterval(()=>{store.db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());store.db.prepare('DELETE FROM attempts WHERE until<?').run(Date.now());store.backup().catch(error=>console.error('Backup failed:',error.message));},6*60*60*1000);maintenance.unref();
  server.on('close',()=>{clearInterval(maintenance);store.close();});
  return {server,store};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  process.chdir(ROOT);
  const port=Number(process.env.PORT||4180),development=process.env.NODE_ENV!=='production';
  const {server}=await createApplication({dataDir:path.resolve(process.env.CMS_DATA_DIR||'.cms-data'),adminOrigin:process.env.CMS_ADMIN_ORIGIN||`http://127.0.0.1:${port}`,development});
  server.listen(port,'127.0.0.1',()=>console.log(`Life with Labr listening on ${port}`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
