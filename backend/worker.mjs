export function classify(ua,model){const os=/android/i.test(ua)?'Android':/iPhone|iPad/i.test(ua)?'iOS':/Windows/i.test(ua)?'Windows':/Macintosh/i.test(ua)?'macOS':'Other';const browser=/Edg|EdgiOS|EdgA/.test(ua)?'Edge':/Firefox|FxiOS/.test(ua)?'Firefox':/Chrome|CriOS/.test(ua)?'Chrome':/Safari/.test(ua)?'Safari':'Other';return `${os} · ${browser} · ${model==='Unavailable'?'model unavailable':model}`}
const sidOK=s=>typeof s==='string'&&/^[a-f0-9-]{36}$/i.test(s);
export default {async fetch(req,env){
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':env.ALLOWED_ORIGIN,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Vary':'Origin'};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 const path=new URL(req.url).pathname;
 try{
 if(['/stats','/draw'].includes(path)){
  if(!env.ADMIN_TOKEN||req.headers.get('Authorization')!=='Bearer '+env.ADMIN_TOKEN)return reply({error:'Incorrect dashboard password.'},401);
  if(path==='/stats'&&req.method==='GET'){
   const [v,e,m,rows,sources,teams,sizes,timeline,recent,winner]=await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS n FROM visits'),env.DB.prepare('SELECT COUNT(*) AS n FROM entries'),env.DB.prepare("SELECT COUNT(*) AS n FROM visits WHERE model != 'Unavailable'"),env.DB.prepare('SELECT ua, model, COUNT(*) AS count FROM visits GROUP BY ua, model'),env.DB.prepare('SELECT source AS label, COUNT(*) AS count FROM visits GROUP BY source ORDER BY count DESC'),env.DB.prepare('SELECT team AS label, COUNT(*) AS count FROM entries GROUP BY team ORDER BY count DESC'),env.DB.prepare('SELECT size AS label, COUNT(*) AS count FROM entries GROUP BY size ORDER BY count DESC'),env.DB.prepare("SELECT strftime('%Y-%m-%dT%H:%M:00Z', created_at) AS minute, COUNT(*) AS count FROM visits GROUP BY minute ORDER BY minute DESC LIMIT 60"),env.DB.prepare('SELECT ua,model,source,created_at FROM visits ORDER BY created_at DESC,rowid DESC LIMIT 12'),env.DB.prepare('SELECT claim FROM winner WHERE id=1')]);
   const groups=new Map();for(const r of rows.results){const label=classify(r.ua,r.model);groups.set(label,(groups.get(label)||0)+r.count)}
   return reply({visits:v.results[0].n,entries:e.results[0].n,models:m.results[0].n,devices:[...groups].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count),sources:sources.results,teams:teams.results,sizes:sizes.results,timeline:timeline.results.reverse(),recent:recent.results.map(r=>({device:classify(r.ua,r.model),source:r.source,time:r.created_at})),winner:winner.results[0]?.claim||null});
  }
  if(path==='/draw'&&req.method==='POST'){
   // One persisted winner: refreshing or clicking twice cannot quietly redraw.
   await env.DB.prepare('INSERT OR IGNORE INTO winner(id,claim) SELECT 1,claim FROM entries ORDER BY RANDOM() LIMIT 1').run();
   const row=await env.DB.prepare('SELECT claim FROM winner WHERE id=1').first();return row?reply(row):reply({error:'No entries yet.'},409);
  }
 }
 if(req.method!=='POST'||!['/visit','/entry'].includes(path))return reply({error:'Not found'},404);
 if(req.headers.get('Origin')!==env.ALLOWED_ORIGIN)return reply({error:'Origin not allowed'},403);
 if(Number(req.headers.get('Content-Length')||0)>4096)return reply({error:'Request too large'},413);
 const raw=await req.text();if(raw.length>4096)return reply({error:'Request too large'},413);
 let d;try{d=JSON.parse(raw)}catch{return reply({error:'Invalid JSON'},400)}
 if(!d||!sidOK(d.sid))return reply({error:'Invalid session'},400);
 if(path==='/visit'){
  if(typeof d.source!=='string'||! /^[a-zA-Z0-9_-]{1,40}$/.test(d.source)||typeof d.ua!=='string'||d.ua.length>500||typeof d.model!=='string'||d.model.length>100)return reply({error:'Invalid visit'},400);
  await env.DB.prepare('INSERT OR IGNORE INTO visits(sid,source,ua,model) VALUES(?,?,?,?)').bind(d.sid,d.source,d.ua,d.model.trim()||'Unavailable').run();return reply({ok:true});
 }
 const teams=['Mercedes','Ferrari','McLaren','Red Bull','Other / no preference'],sizes=['XS','S','M','L','XL','XXL'];
 if(d.consent!==true||typeof d.nickname!=='string'||d.nickname.length>30||!teams.includes(d.team)||!sizes.includes(d.size))return reply({error:'Please complete the form and consent checkbox.'},400);
 if(!await env.DB.prepare('SELECT sid FROM visits WHERE sid=?').bind(d.sid).first())return reply({error:'Visit not registered. Reload and try again.'},409);
 const existing=await env.DB.prepare('SELECT claim FROM entries WHERE sid=?').bind(d.sid).first();
 if(existing)return reply(existing);
 if(await env.DB.prepare('SELECT id FROM winner WHERE id=1').first())return reply({error:'The draw has closed.'},409);
 const claim=crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase();
 await env.DB.prepare('INSERT OR IGNORE INTO entries(sid,nickname,team,size,claim) SELECT ?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM winner WHERE id=1)').bind(d.sid,d.nickname.trim(),d.team,d.size,claim).run();
 const entry=await env.DB.prepare('SELECT claim FROM entries WHERE sid=?').bind(d.sid).first();
 return entry?reply(entry):reply({error:'The draw has closed.'},409);
 }catch{return reply({error:'Service unavailable. Please try again shortly.'},500)}
}};
