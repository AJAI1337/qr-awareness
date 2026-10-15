import {test} from 'node:test';import assert from 'node:assert/strict';import worker from './worker.mjs';import {database} from './local-db.mjs';
test('mandatory names, private attendee data, and shipping restricted to winning session',async()=>{
 const DB=database(),env={DB,ALLOWED_ORIGIN:'https://ajai1337.github.io',ADMIN_TOKEN:'test'};
 async function call(path,data,admin=false){const r=await worker.fetch(new Request('https://api.example'+path,{method:data?'POST':'GET',headers:{Origin:env.ALLOWED_ORIGIN,...(admin?{Authorization:'Bearer test'}:{})},...(data?{body:JSON.stringify(data)}:{})}),env);return{status:r.status,data:await r.json()}}
 try{const sid=crypto.randomUUID(),other=crypto.randomUUID();for(const s of [sid,other])await call('/visit',{sid:s,source:'test',ua:'iPhone Safari',model:'Unavailable'});
 assert.equal((await call('/entry',{sid,name:'  ',size:'M',consent:true})).status,400);
 const entry=await call('/entry',{sid,name:'Test Entrant',size:'M',consent:true});assert.equal(entry.status,200);
 const stats=await call('/stats',null,true);assert.equal(stats.data.notFilled,1);assert.ok(!JSON.stringify(stats.data).includes('Test Entrant'));
 assert.equal((await call('/attendees')).status,401);const privateRows=await call('/attendees',null,true);assert.equal(privateRows.data.attendees.find(x=>x.completed).name,'Test Entrant');assert.equal(privateRows.data.attendees.find(x=>!x.completed).name,null);
 const delivery={sid,claim:entry.data.claim,recipient:'Test Entrant',address:'TEST ADDRESS ONLY',city:'Test City',region:'Test State',postcode:'00000',country:'Test Country',consent:true};
 assert.equal((await call('/shipping',delivery)).status,403);await call('/draw',{},true);
 assert.equal((await call('/shipping',{...delivery,sid:other})).status,403);assert.equal((await call('/shipping',delivery)).status,200);assert.equal((await call('/fulfilment')).status,401);assert.equal((await call('/fulfilment',null,true)).data.shipping.address,'TEST ADDRESS ONLY');
 }finally{DB.close()}
});
