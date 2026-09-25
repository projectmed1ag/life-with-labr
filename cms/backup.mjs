import path from 'node:path';
import {openStore} from './store.mjs';
const store=openStore(path.resolve(process.env.CMS_DATA_DIR||'.cms-data'));
try{await store.backup();console.log('Database backup created.');}finally{store.close();}
