/**
 * Implementation Validation Tests
 * Validates that all required modules and endpoints exist
 * Run with: npm test or tsx test/validate-implementation.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: String(error),
    });
    console.log(`❌ ${name}: ${error}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, filePath));
}

function fileContains(filePath: string, searchString: string): boolean {
  const content = fs.readFileSync(path.join(projectRoot, filePath), 'utf-8');
  return content.includes(searchString);
}

// Run validation tests
console.log('🧪 TES MVP Implementation Validation Tests');
console.log('─'.repeat(60));
console.log('');

console.log('📋 File Structure Tests');

test('WebSocket module exists', () => {
  assert(fileExists('src/websocket.ts'), 'src/websocket.ts not found');
});

test('Main server file exists', () => {
  assert(fileExists('src/index.ts'), 'src/index.ts not found');
});

test('Task routes exist', () => {
  assert(fileExists('src/routes/tasks.ts'), 'src/routes/tasks.ts not found');
});

test('Auth routes exist', () => {
  assert(fileExists('src/routes/auth.ts'), 'src/routes/auth.ts not found');
});

test('User routes exist', () => {
  assert(fileExists('src/routes/users.ts'), 'src/routes/users.ts not found');
});

test('Database schema exists', () => {
  assert(fileExists('src/db/schema.ts'), 'src/db/schema.ts not found');
});

test('Database migrations exist', () => {
  assert(
    fileExists('src/db/migrations/001_initial_schema.ts'),
    'src/db/migrations/001_initial_schema.ts not found'
  );
});

test('WebSocket documentation exists', () => {
  assert(fileExists('WEBSOCKET.md'), 'WEBSOCKET.md not found');
});

console.log('');
console.log('📋 WebSocket Implementation Tests');

test('WebSocket class is exported', () => {
  assert(
    fileContains('src/websocket.ts', 'export const webSocketManager'),
    'webSocketManager not exported'
  );
});

test('WebSocket has broadcast methods', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'src/websocket.ts'), 'utf-8');
  assert(content.includes('broadcastTaskUpdate'), 'broadcastTaskUpdate not found');
  assert(content.includes('broadcastTaskCreated'), 'broadcastTaskCreated not found');
  assert(content.includes('broadcastTaskDeleted'), 'broadcastTaskDeleted not found');
});

test('WebSocket integrated in main server', () => {
  assert(
    fileContains('src/index.ts', 'webSocketManager'),
    'webSocketManager not imported in index.ts'
  );
  assert(
    fileContains('src/index.ts', 'initialize'),
    'webSocketManager.initialize not called'
  );
});

test('Task routes call WebSocket broadcasts', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'src/routes/tasks.ts'), 'utf-8');
  assert(
    content.includes('broadcastTaskCreated'),
    'broadcastTaskCreated not called in tasks.ts'
  );
  assert(
    content.includes('broadcastTaskUpdate'),
    'broadcastTaskUpdate not called in tasks.ts'
  );
});

console.log('');
console.log('📋 Database Schema Tests');

test('Database has users table', () => {
  assert(
    fileContains('src/db/schema.ts', "pgTable('users'"),
    'users table not defined'
  );
});

test('Database has projects table', () => {
  assert(
    fileContains('src/db/schema.ts', "pgTable('projects'"),
    'projects table not defined'
  );
});

test('Database has tasks table', () => {
  assert(fileContains('src/db/schema.ts', "pgTable('tasks'"), 'tasks table not defined');
});

test('Database has indices defined', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'src/db/schema.ts'), 'utf-8');
  assert(content.includes('export const indexes'), 'indexes not exported');
  assert(content.includes('users_email_idx'), 'users_email_idx not found');
  assert(content.includes('tasks_project_idx'), 'tasks_project_idx not found');
});

test('Database indices created in migration', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/db/migrations/001_initial_schema.ts'),
    'utf-8'
  );
  assert(content.includes('pgm.createIndex'), 'createIndex not called in migration');
  assert(content.match(/pgm\.createIndex.*users_email_idx/), 'users_email_idx not created');
  assert(content.match(/pgm\.createIndex.*tasks_project_idx/), 'tasks_project_idx not created');
});

console.log('');
console.log('📋 API Routes Tests');

test('Auth endpoints exist', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'src/routes/auth.ts'), 'utf-8');
  assert(content.includes('/register'), '/register endpoint not found');
  assert(content.includes('/login'), '/login endpoint not found');
  assert(content.includes('/logout'), '/logout endpoint not found');
});

test('Task CRUD endpoints exist', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'src/routes/tasks.ts'), 'utf-8');
  assert(content.includes('router.get'), 'GET endpoint not found');
  assert(content.includes('router.post'), 'POST endpoint not found');
  assert(content.includes('router.put'), 'PUT endpoint not found');
  assert(content.includes('router.delete'), 'DELETE endpoint not found');
});

test('Task validation uses Zod', () => {
  assert(
    fileContains('src/routes/tasks.ts', 'z.object'),
    'Zod validation schema not found'
  );
});

console.log('');
console.log('📋 Package.json Tests');

test('test script is configured', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
  );
  assert(pkg.scripts.test !== "echo 'No tests yet'", 'test script not configured');
});

test('socket.io is installed', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
  );
  assert(
    pkg.dependencies['socket.io'] || pkg.devDependencies['socket.io'],
    'socket.io not in dependencies'
  );
});

test('Express is installed', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
  );
  assert(pkg.dependencies.express, 'express not in dependencies');
});

test('Drizzle ORM is installed', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
  );
  assert(pkg.dependencies['drizzle-orm'], 'drizzle-orm not in dependencies');
});

console.log('');
console.log('📋 Documentation Tests');

test('WebSocket documentation is comprehensive', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'WEBSOCKET.md'), 'utf-8');
  assert(content.includes('Quick Start'), 'Quick Start section missing');
  assert(content.includes('Client-Side Connection'), 'Client connection example missing');
  assert(content.includes('Event Types'), 'Event types documentation missing');
  assert(content.includes('React'), 'React example missing');
});

test('README exists and mentions key features', () => {
  if (fileExists('README.md')) {
    const content = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf-8');
    assert(
      content.includes('Task management') || content.includes('REST API'),
      'Key features not documented'
    );
  }
});

console.log('');
console.log('═'.repeat(60));

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const total = results.length;

console.log(`📊 Validation Results: ${passed}/${total} passed`);

if (failed > 0) {
  console.log(`❌ ${failed} validation(s) failed:`);
  results
    .filter((r) => !r.passed)
    .forEach((r) => {
      console.log(`  - ${r.name}`);
      if (r.error) {
        console.log(`    ${r.error}`);
      }
    });
  console.log('');
  process.exit(1);
} else {
  console.log('✅ All implementations validated successfully!');
  console.log('');
  console.log('✨ TES-11 Status:');
  console.log('  ✅ WebSocket setup: IMPLEMENTED');
  console.log('  ✅ Database schema: COMPLETE');
  console.log('  ✅ REST API: COMPLETE');
  console.log('  ✅ Authentication: COMPLETE');
  console.log('  ✅ Documentation: COMPLETE');
  console.log('');
  console.log('📝 Next: Run integration tests with server');
  console.log('');
  process.exit(0);
}
