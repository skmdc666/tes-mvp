# Testing Guide for TES MVP

This guide explains how to run various types of tests for the TES MVP application.

## Test Suite Overview

The test suite includes multiple types of tests:

1. **Basic API Tests** - Validate core functionality
2. **Stress Tests** - Performance and load testing
3. **Integration Tests** - Full workflow testing
4. **Error Handling Tests** - Validate error scenarios

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running (for integration tests)
- npm dependencies installed

## Running Tests

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

Or use Docker:

```bash
npm run start:dev
```

### 3. Basic API Tests

Run the basic API endpoint tests:

```bash
npm run test:basic
```

This tests:
- Health check endpoint
- Task CRUD operations
- Basic error handling
- Authentication requirements

### 4. Stress Tests

Run performance and stress tests:

```bash
npm run test:stress
```

This includes:
- Concurrent request testing
- Large payload handling
- Rate limiting validation
- Error scenario testing

### 5. Integration Tests

Run comprehensive integration tests:

```bash
npm run test:integration
```

This requires a separate test database and includes:
- Database operations
- Full workflows
- Validation scenarios
- Security tests

### 6. Complete Test Suite

Run all tests:

```bash
npm run test:all
```

### 7. Watch Mode

Run tests in watch mode for development:

```bash
npm run test:watch
```

## Test Environment Setup

### Test Database Configuration

For integration tests, you'll need a separate test database:

```bash
# Create test database
createdb tes_mvp_test

# Run migrations for test database
npm run db:migrate

# Seed test data
npm run db:seed
```

### Test Configuration

Tests can be configured by setting environment variables:

```bash
export TEST_DATABASE_URL="postgresql://tes_user:tes_password@localhost:5432/tes_mvp_test"
export TEST_PORT=3002
export TEST_HOST=localhost
```

## Test Files Structure

```
test/
├── README.md                    # This guide
├── api-test.js                  # Basic API endpoint tests
├── stress-test.js              # Performance and stress tests
├── integration.test.ts        # Comprehensive integration tests
├── setup-test-env.js           # Test environment setup
└── fixtures/                  # Test data fixtures
    ├── users.json
    ├── projects.json
    └── tasks.json
```

## Test Categories

### Health Check Tests

- Verify server is running
- Check response format
- Validate response time

### Task Management Tests

- Create tasks
- Read tasks (single and all)
- Update tasks
- Delete tasks
- Add comments
- Validation errors

### Error Handling Tests

- Missing authentication headers
- Invalid IDs
- Malformed data
- Not found scenarios
- Rate limiting
- Server errors

### Performance Tests

- Concurrent request handling
- Response time validation
- Memory usage
- Throughput

### Security Tests

- Input validation
- SQL injection protection
- XSS prevention
- Error message sanitization

## Test Results

### Basic API Tests

```
🧪 Testing: Health check endpoint
───────────────────────────────────
✅ PASSED

🧪 Testing: Get all tasks
───────────────────────────────────
✅ PASSED

🧪 Testing: Get specific task
───────────────────────────────────
✅ PASSED

...

📊 Test Results
───────────────────────────────────
✅ Passed: 10
❌ Failed: 0
📈 Total: 10
```

### Stress Tests

```
🔥 Starting Stress Test Suite
───────────────────────────────────
🏃‍♂️ Performance Test
───────────────────────────────────
Testing with 100 concurrent requests...

🚨 Error Handling Test
───────────────────────────────────
Testing malformed JSON...
Testing large payload...

⚡ Concurrent Updates Test
───────────────────────────────────
Concurrent Update Results:
- Successful updates: 8
- Conflicts: 2
- Other errors: 0

📊 Final Results Summary
───────────────────────────────────
Total Test Duration: 45.23s
Total Requests: 1000
Success Rate: 98.50%
Average Response Time: 45.32ms
```

### Integration Tests

Tests report detailed assertions and error information:

```
  ✓ should create a new task
  ✓ should get all tasks
  ✓ should get a specific task
  ✓ should update a task
  ✓ should add a comment to a task
  ✓ should delete a task
  ✓ should return 404 for deleted task

  12 passing (2s)

✅ Test Suite Complete
```

## Troubleshooting

### Common Issues

1. **Server not running**
   - Ensure the dev server is running on port 3001
   - Check if the port is available

2. **Database connection issues**
   - Verify PostgreSQL is running
   - Check database URL configuration
   - Ensure proper permissions

3. **Test failures**
   - Review test output for specific errors
   - Check server logs for additional information
   - Verify test data is properly seeded

### Debug Mode

Run tests with debug output:

```bash
DEBUG=* npm run test:basic
```

### Continuous Integration

For CI/CD, add these to your workflow:

```yaml
- name: Run tests
  run: |
    npm run test:setup
    npm run test:all
```

## Best Practices

1. **Test Independence**: Each test should run independently
2. **Clean Up**: Remove test data after tests
3. **Environment Isolation**: Use separate test databases
4. **Error Scenarios**: Test both happy path and error cases
5. **Performance**: Include performance benchmarks
6. **Security**: Test security-related features thoroughly

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Include both positive and negative test cases
3. Use descriptive test names
4. Add test data fixtures if needed
5. Update this guide with new test types