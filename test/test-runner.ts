/**
 * Test Runner
 * Runs unit tests using Mocha
 */

import Mocha from 'mocha';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create mocha instance
const mocha = new Mocha({
  timeout: 10000,
  exit: true,
});

// Add test files
const testDir = __dirname;
mocha.addFile(path.join(testDir, 'endpoints.test.ts'));

// Run tests
mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
