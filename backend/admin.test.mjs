import {test} from 'node:test';import assert from 'node:assert/strict';import worker from './worker.mjs';import {database} from './local-db.mjs';import {eventCSV} from '../docs/export-utils.mjs';
test('export is private and complete; reset requires explicit confirmation and clears dependent records atomically',async()=>{
 const DB=database(),env={DB,ADMIN_TOKEN:'test',ALLOWED_ORIGIN:'https://ajai1337.github.io'};
 async function call(path,data,auth=true){const r=await worker.fetch(new Request('https://api.example'+path,{method:data?'POST':'GET',headers:{Origin:env.ALLOWED_ORIGIN,...(auth?{Authorization:'Bearer test'}:{})},...(data?{body:JSON.stringify(data)}:{})}),env);return{status:r.status,data:await r.json()}}
 try{const sid=crypto.randomUUID();await call('/visit',{sid,source:'test',ua:'Test browser',model:'Test model'});const entry=await call('/entry',{sid,name:'=TEST',size:'M',consent:true});await call('/draw',{});await call('/shipping',{sid,claim:entry.data.claim,recipient:'Synthetic',address:'TEST ADDRESS',city:'TEST',region:'TEST',postcode:'000',country:'TEST',consent:true});
 assert.equal((await call('/export',null,false)).status,401);assert.equal((await call('/reset',{confirmation:'RESET EVENT'},false)).status,401);
 const exported=await call('/export');assert.equal(exported.data.rows.length,1);assert.equal(exported.data.rows[0].name,'=TEST');assert.ok(!JSON.stringify(exported.data).includes('TEST ADDRESS'));
 assert.equal((await call('/reset',{confirmation:'yes'})).status,400);assert.equal((await call('/stats')).data.entries,1);
 assert.equal((await call('/reset',{confirmation:'RESET EVENT'})).status,200);const stats=await call('/stats');assert.equal(stats.data.visits,0);assert.equal(stats.data.entries,0);assert.equal(stats.data.winner,null);assert.equal((await call('/fulfilment')).data.shipping,null);
 await call('/visit',{sid,source:'new-event',ua:'Test',model:'Unavailable'});assert.equal((await call('/entry',{sid,name:'New event',size:'L',consent:true})).status,200);
 }finally{DB.close()}
});
test('CSV preserves quotes and commas, includes empty visits, and neutralises spreadsheet formulas',()=>{const csv=eventCSV([{name:' =HYPERLINK("test")',source:'entrance, west',completed:0,user_agent:'Test "quoted" browser'}]);assert.ok(csv.includes('"\' =HYPERLINK(""test"")"'));assert.ok(csv.includes('"entrance, west"'));assert.ok(csv.includes('"Test ""quoted"" browser"'));assert.ok(csv.startsWith('\uFEFF'));});
