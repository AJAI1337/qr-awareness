import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export function database(filename=':memory:'){
 const db=new DatabaseSync(filename);db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 function prepare(sql){let args=[];return{bind(...values){args=values;return this},async run(){return db.prepare(sql).run(...args)},async first(){return db.prepare(sql).get(...args)||null},async all(){return{results:db.prepare(sql).all(...args)}}}}
 return{prepare,async batch(statements){db.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.all());db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}},close(){db.close()}};
}
