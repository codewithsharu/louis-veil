const child = require('child_process');
const cp = child.spawnSync('node', ['server.js'], { encoding: 'utf-8' });
console.log("=== STDOUT ===");
console.log(cp.stdout);
console.log("=== STDERR ===");
console.log(cp.stderr);
