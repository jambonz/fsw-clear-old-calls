#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2));
const dryRun = 'dry-run' in argv;
const pwd = argv.password || 'ClueCon';
const {execSync} = require('child_process');
const now = Date.now();

const calls = execSync(`sudo /usr/local/freeswitch/bin/fs_cli -p ${pwd} -x "show calls"`, {encoding: 'utf8'})
  .split('\n')
  .filter((line) => line.match(/^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{8}/))
  .map((line) => {
    const arr = line.split(',');
    const dt = new Date(arr[2]);
    const duration = (now - dt.getTime()) / 1000;
    return {
      uuid: arr[0],
      time: arr[2],
      duration
    }
  })
  .filter((c) => c.duration > 60 * 60 * 3);

console.log(`clearing ${calls.length} old calls longer than 3 hours`);
for (const call of calls) {
  const cmd = `sudo /usr/local/freeswitch/bin/fs_cli -p ${pwd} -x "uuid_kill ${call.uuid}"`;
  if (dryRun) console.log(cmd);
  else {
    console.log(cmd);
    const out = execSync(cmd, {encoding: 'utf8'});
    console.log(out);
  }
}


