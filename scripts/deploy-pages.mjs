import { spawnSync } from 'node:child_process';
import process from 'node:process';

const projectName = 'smarttoolkit';
const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const build = spawnSync('npm.cmd', ['run', 'build'], {
  stdio: 'inherit',
  shell: isWindows,
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const deployArgs = [
  'wrangler',
  'pages',
  'deploy',
  'dist',
  '--project-name',
  projectName,
  '--commit-dirty=true',
];

const deploy = spawnSync(npxCmd, deployArgs, {
  stdio: 'inherit',
  shell: isWindows,
});

process.exit(deploy.status ?? 1);
