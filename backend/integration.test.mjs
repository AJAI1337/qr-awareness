import {test} from 'node:test';import assert from 'node:assert/strict';import worker from './worker.mjs';import {database} from './local-db.mjs';
test('full flow: visits, duplicate entries, aggregates, protected stats, persisted draw, closure and claim recovery',async()=>{
 const DB=database(),env={DB,ALLOWED_ORIGIN:'https://ajai1337.github.io',ADMIN_TOKEN:'integration-only'};
 async function call(path,data,admin=false){const res=await worker.fetch(new Request('https://api.example'+path,{method:data?'POST':'GET',headers:{Origin:env.ALLOWED_ORIGIN,...(admin?{Authorization:'Bearer '+env.ADMIN_TOKEN}:{})},...(data?{body:JSON.stringify(data)}:{})}),env);return{status:res.status,data:await res.json()}}
 try{const sid=crypto.randomUUID(),other=crypto.randomUUID();const visit={sid,source:'entrance',ua:'Android Chrome',model:'Pixel 8'};assert.equal((await call('/visit',visit)).status,200);await call('/visit',visit);
 const entry={sid,nickname:'<img onerror=alert(1)>',team:'Mercedes',size:'M',consent:true};const first=await call('/entry',entry),again=await call('/entry',entry);assert.equal(first.status,200);assert.equal(first.data.claim,again.data.claim);
 const stats=await call('/stats',null,true);assert.equal(stats.data.visits,1);assert.equal(stats.data.entries,1);assert.equal(stats.data.models,1);assert.equal(stats.data.teams[0].label,'Mercedes');assert.equal(stats.data.recent.length,1);assert.ok(!JSON.stringify(stats.data).includes('onerror'));assert.ok(!JSON.stringify(stats.data).includes(sid));
 assert.equal((await call('/stats')).status,401);const win=await call('/draw',{},true);assert.equal(win.data.claim,first.data.claim);assert.deepEqual((await call('/draw',{},true)).data,win.data);
 await call('/visit',{...visit,sid:other});assert.equal((await call('/entry',{...entry,sid:other})).status,409);assert.equal((await call('/entry',entry)).data.claim,first.data.claim);
 }finally{DB.close()}
});
test('empty draw does not select a winner',async()=>{const DB=database();try{const r=await worker.fetch(new Request('https://api.example/draw',{method:'POST',headers:{Authorization:'Bearer test'}}),{DB,ADMIN_TOKEN:'test',ALLOWED_ORIGIN:'https://example.com'});assert.equal(r.status,409)}finally{DB.close()}});
