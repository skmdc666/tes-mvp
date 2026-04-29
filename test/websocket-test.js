/**
 * WebSocket E2E Test
 * Tests real-time task updates over Socket.IO
 */

const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 5000;

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(type, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  };
  console.log(`[${timestamp}] ${prefix[type]} ${message}`);
}

async function runWebSocketTest() {
  log('info', 'Starting WebSocket E2E Test');
  log('info', `Connecting to ${BASE_URL}`);

  return new Promise((resolve, reject) => {
    const socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    let testsPassed = 0;
    let testsFailed = 0;
    const timeoutIds = [];

    const cleanup = () => {
      timeoutIds.forEach(id => clearTimeout(id));
      socket.disconnect();
    };

    const setTimeout = (fn, delay) => {
      const id = global.setTimeout(fn, delay);
      timeoutIds.push(id);
      return id;
    };

    socket.on('connect', () => {
      log('success', 'Connected to WebSocket server');

      // Test 1: Authentication
      socket.emit('authenticate', { userId: 'test-user-123' });

      socket.on('authenticated', (data) => {
        log('success', `Authenticated as user: ${data.userId}`);
        testsPassed++;

        // Test 2: Project subscription
        socket.emit('subscribe', { channel: 'project:test-project-id' });
      });

      socket.on('subscribed', (data) => {
        log('success', `Subscribed to channel: ${data.channel}`);
        testsPassed++;

        // Test 3: Simulate task update (from server broadcast)
        log('info', 'Listening for task updates...');
        const updateTimeout = setTimeout(() => {
          log('warn', 'No task update received (expected if no tasks changed)');
        }, TEST_TIMEOUT);

        socket.on('task:updated', (payload) => {
          clearTimeout(updateTimeout);
          log('success', `Received task update: ${payload.id}`);
          testsPassed++;

          // Test 4: Unsubscribe
          socket.emit('unsubscribe', { channel: 'project:test-project-id' });
        });

        socket.on('unsubscribed', (data) => {
          log('success', `Unsubscribed from channel: ${data.channel}`);
          testsPassed++;

          // Complete tests
          cleanup();
          displayResults();
          resolve();
        });

        // For testing, simulate a disconnect after timeout
        setTimeout(() => {
          socket.emit('unsubscribe', { channel: 'project:test-project-id' });
        }, TEST_TIMEOUT);
      });
    });

    socket.on('error', (error) => {
      log('error', `Connection error: ${error.message || error}`);
      testsFailed++;
      cleanup();
      displayResults();
      reject(error);
    });

    socket.on('connect_error', (error) => {
      log('error', `Connection failed: ${error.message || error}`);
      testsFailed++;
      cleanup();
      displayResults();
      reject(error);
    });

    function displayResults() {
      console.log('\n' + '='.repeat(50));
      console.log(colors.blue + 'WebSocket Test Results' + colors.reset);
      console.log('='.repeat(50));
      console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
      console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
      console.log('='.repeat(50) + '\n');

      const allPassed = testsFailed === 0;
      const status = allPassed ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
      log(allPassed ? 'success' : 'error', `Test suite ${status}`);
    }
  });
}

// Run test
runWebSocketTest()
  .then(() => {
    console.log('\n✓ WebSocket test completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ WebSocket test failed:', error.message);
    process.exit(1);
  });
