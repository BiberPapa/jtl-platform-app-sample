import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = dirname(scriptDirectory);
const command = process.argv[2];

const dotnetHome = join(packageDirectory, '.dotnet');
const nugetPackages = join(dotnetHome, 'packages');

mkdirSync(dotnetHome, { recursive: true });
mkdirSync(nugetPackages, { recursive: true });

const commandMap = {
  build: ['publish', 'HelloWorldApp.Backend.DotNet.csproj', '--configuration', 'Release', '--output', 'dist', '--no-restore'],
  dev: ['watch', '--project', 'HelloWorldApp.Backend.DotNet.csproj', 'run'],
  lint: ['format', 'HelloWorldApp.Backend.DotNet.csproj', '--verify-no-changes'],
  restore: ['restore', 'tests/HelloWorldApp.Backend.DotNet.Tests/HelloWorldApp.Backend.DotNet.Tests.csproj'],
  start: ['dist/HelloWorldApp.Backend.DotNet.dll'],
  test: ['test', 'tests/HelloWorldApp.Backend.DotNet.Tests/HelloWorldApp.Backend.DotNet.Tests.csproj', '--configuration', 'Release', '--no-restore'],
  typecheck: ['build', 'HelloWorldApp.Backend.DotNet.csproj', '--configuration', 'Release', '--no-restore', '-warnaserror'],
};

if (!command || !(command in commandMap)) {
  process.stderr.write(`Unknown dotnet command: ${command ?? '<missing>'}\n`);
  process.exit(1);
}

if (command === 'build') {
  rmSync(join(packageDirectory, 'dist'), { force: true, recursive: true });
}

const result = spawnSync('dotnet', commandMap[command], {
  cwd: packageDirectory,
  env: {
    ...process.env,
    DOTNET_CLI_HOME: dotnetHome,
    DOTNET_CLI_TELEMETRY_OPTOUT: '1',
    DOTNET_NOLOGO: '1',
    DOTNET_SKIP_FIRST_TIME_EXPERIENCE: '1',
    NUGET_PACKAGES: nugetPackages,
  },
  shell: false,
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
