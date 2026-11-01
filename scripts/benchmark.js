const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const temp = path.join(os.tmpdir(), `edustream-bench-${process.pid}.json`);
const seed = { users: [], classrooms: [], grades: [] };
for (let i = 0; i < 1000; i++) seed.classrooms.push({ room_id: String(i), title: `Room ${i}`, instructor_id: 'instructor-1' });
fs.writeFileSync(temp, JSON.stringify(seed));

const script = `
const fs=require('fs');
const file=process.env.EDUSTREAM_DATA_FILE;
const iterations=200;
const start=process.hrtime.bigint();
let store=null;
for(let i=0;i<iterations;i++){
  if(process.env.MODE==='cached' && store){ void store.classrooms.length; }
  else { store=JSON.parse(fs.readFileSync(file,'utf8')); }
}
const ms=Number(process.hrtime.bigint()-start)/1e6;
console.log(ms.toFixed(2));
`;

function run(mode) {
  return Number(execFileSync(process.execPath, ['-e', script], {
    env: { ...process.env, EDUSTREAM_DATA_FILE: temp, MODE: mode },
    encoding: 'utf8'
  }).trim());
}

const baseline = run('baseline');
const optimized = run('cached');
const improvement = baseline ? ((baseline - optimized) / baseline) * 100 : 0;
console.log(`Baseline repeated disk reads: ${baseline.toFixed(2)} ms / 200 operations`);
console.log(`Cached in-memory reads: ${optimized.toFixed(2)} ms / 200 operations`);
console.log(`Observed improvement in this benchmark: ${improvement.toFixed(1)}%`);
try { fs.unlinkSync(temp); } catch {}
