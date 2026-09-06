import { spawn } from 'node:child_process';
import process from 'node:process';

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const children = [];

function start(command, args, environment = process.env, options = {}) {
  const child = spawn(command, args, {
    env: environment,
    stdio: 'inherit',
    ...options,
  });

  children.push(child);
  return child;
}

const backend = start(
  process.execPath,
  ['scripts/start-environment.js', 'development'],
  {
    ...process.env,
    NODE_ENV: 'development',
  },
);

const frontend = start(
  npmCommand,
  [
    '--prefix',
    'frontend',
    'run',
    'start',
    '--',
    '--proxy-config',
    'proxy.conf.json',
  ],
  process.env,
  isWindows ? { shell: true } : {},
);

function stop(exitCode = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  process.exit(exitCode);
}

backend.on('exit', (code) => stop(code ?? 0));
frontend.on('exit', (code) => stop(code ?? 0));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
