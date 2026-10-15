export function csvCell(value){
 let text=value==null?'':String(value);
 if(/^[\s\uFEFF]*[=+\-@]/.test(text))text="'"+text;
 return '"'+text.replaceAll('"','""')+'"';
}
export function eventCSV(rows){
 const columns=['visit_time','source','name','size','completed','model','user_agent','entry_time'];
 return '\uFEFF'+[columns.map(csvCell).join(','),...rows.map(row=>columns.map(key=>csvCell(row[key])).join(','))].join('\r\n');
}
