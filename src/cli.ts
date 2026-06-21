import { runConfig } from './commands/config.js';
import { runDoctor } from './commands/doctor.js';
import { runHook } from './commands/hook.js';
import { runInit } from './commands/init.js';
import { runTest } from './commands/test.js';
import { runUninstall } from './commands/uninstall.js';
import { createLogger } from './runtime/logger.js';

function printHelp(): void {
  process.stdout.write(`cc-notifier\n\nUsage:\n  cc-notifier init [--provider feishu|wecom|ruliu|webhook --env NAME]\n  cc-notifier uninstall\n  cc-notifier doctor\n  cc-notifier test\n  cc-notifier hook --event Stop|PermissionRequest\n  cc-notifier config\n`);
}

async function main(): Promise<number> {
  const [, , command, ...args] = process.argv;
  const logger = createLogger(args.includes('--debug'));

  switch (command) {
    case 'init':
      return runInit(args, logger);
    case 'uninstall':
      return runUninstall(args, logger);
    case 'doctor':
      return runDoctor(args, logger);
    case 'test':
      return runTest(args, logger);
    case 'hook':
      return runHook(args, logger);
    case 'config':
      return runConfig(args, logger);
    case '--help':
    case '-h':
    case undefined:
      printHelp();
      return 0;
    default:
      logger.error(`Unknown command: ${command}`);
      printHelp();
      return 1;
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    process.stderr.write(`[cc-notifier] ERROR ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
