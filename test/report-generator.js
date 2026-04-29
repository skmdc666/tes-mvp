#!/usr/bin/env node

/**
 * Test Report Generator
 * Generates comprehensive test reports and metrics
 */

const fs = require('fs');
const path = require('path');

class TestReportGenerator {
  constructor() {
    this.reports = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        successRate: 0
      },
      categories: {},
      failures: [],
      trends: {},
      recommendations: []
    };
  }

  // Add test result
  addTestResult(test) {
    this.reports.summary.totalTests++;

    if (test.status === 'passed') {
      this.reports.summary.passed++;
    } else if (test.status === 'failed') {
      this.reports.summary.failed++;
      this.reports.failures.push(test);
    } else if (test.status === 'skipped') {
      this.reports.summary.skipped++;
    }

    // Update category statistics
    if (!this.reports.categories[test.category]) {
      this.reports.categories[test.category] = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      };
    }

    const category = this.reports.categories[test.category];
    category.total++;
    if (test.status === 'passed') category.passed++;
    else if (test.status === 'failed') category.failed++;
    else if (test.status === 'skipped') category.skipped++;
  }

  // Calculate success rate
  calculateMetrics() {
    this.reports.summary.successRate =
      this.reports.summary.totalTests > 0
        ? (this.reports.summary.passed / this.reports.summary.totalTests) * 100
        : 0;
    this.reports.summary.duration = this.reports.summary.duration || 0; // Will be set when generating report
  }

  // Generate recommendations
  generateRecommendations() {
    const recommendations = [];

    // Check for high failure rates
    for (const [category, stats] of Object.entries(this.reports.categories)) {
      if (stats.total > 0) {
        const failureRate = (stats.failed / stats.total) * 100;
        if (failureRate > 20) {
          recommendations.push({
            type: 'high_failure_rate',
            category,
            message: `${category} has ${failureRate.toFixed(1)}% failure rate. Consider investigating.`,
            priority: 'high'
          });
        }
      }
    }

    // Check for performance issues
    if (this.reports.summary.duration > 30000) { // 30 seconds
      recommendations.push({
        type: 'performance',
        message: 'Test execution is slow. Consider optimizing test performance.',
        priority: 'medium'
      });
    }

    // Check for test coverage
    const totalCategories = Object.keys(this.reports.categories).length;
    if (totalCategories < 5) {
      recommendations.push({
        type: 'coverage',
        message: 'Test coverage could be improved. Add tests for more categories.',
        priority: 'medium'
      });
    }

    this.reports.recommendations = recommendations;
  }

  // Generate HTML report
  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TES MVP Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 10px; }
        h2 { color: #666; margin-top: 30px; margin-bottom: 15px; font-size: 1.5em; }
        .header-info { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #666; font-size: 0.9em; text-transform: uppercase; }
        .summary-card .value { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .summary-card.passed .value { color: #28a745; }
        .summary-card.failed .value { color: #dc3545; }
        .summary-card.skipped .value { color: #ffc107; }
        .summary-card.total .value { color: #007bff; }
        .progress-bar { width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745 0%, #20c997 100%); transition: width 0.3s ease; }
        .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .category-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; }
        .category-card h4 { margin: 0 0 15px 0; color: #333; }
        .test-list { list-style: none; padding: 0; margin: 0; }
        .test-item { padding: 10px; border-radius: 4px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; }
        .test-item.passed { background: #d4edda; }
        .test-item.failed { background: #f8d7da; }
        .test-item.skipped { background: #fff3cd; }
        .test-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .test-status.passed { background: #28a745; color: white; }
        .test-status.failed { background: #dc3545; color: white; }
        .test-status.skipped { background: #ffc107; color: black; }
        .recommendations { background: #f8f9fa; border-radius: 6px; padding: 20px; }
        .recommendation { padding: 15px; border-left: 4px solid #007bff; margin-bottom: 15px; background: white; border-radius: 0 6px 6px 0; }
        .recommendation.high { border-left-color: #dc3545; }
        .recommendation.medium { border-left-color: #ffc107; }
        .recommendation.low { border-left-color: #28a745; }
        .recommendation h4 { margin: 0 0 5px 0; color: #333; }
        .recommendation p { margin: 0; color: #666; font-size: 0.9em; }
        .failure { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin-bottom: 15px; }
        .failure h4 { margin: 0 0 10px 0; color: #721c24; }
        .failure pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 0.85em; }
        @media print { .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>TES MVP Test Report</h1>

        <div class="header-info">
            <strong>Generated:</strong> ${this.reports.timestamp}
            <br>
            <strong>Test Duration:</strong> ${(this.reports.summary.duration / 1000).toFixed(2)} seconds
        </div>

        <h2>Test Summary</h2>
        <div class="summary">
            <div class="summary-card total">
                <h3>Total Tests</h3>
                <div class="value">${this.reports.summary.totalTests}</div>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <div class="value">${this.reports.summary.passed}</div>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <div class="value">${this.reports.summary.failed}</div>
            </div>
            <div class="summary-card skipped">
                <h3>Skipped</h3>
                <div class="value">${this.reports.summary.skipped}</div>
            </div>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.reports.summary.successRate}%"></div>
        </div>
        <p style="text-align: center; margin: 10px 0;">
            Success Rate: <strong>${this.reports.summary.successRate.toFixed(1)}%</strong>
        </p>

        <h2>Test Categories</h2>
        <div class="category-grid">
            ${Object.entries(this.reports.categories).map(([category, stats]) => `
                <div class="category-card">
                    <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                    <div style="display: flex; justify-content: space-around; margin: 15px 0;">
                        <span style="text-align: center;">
                            <strong style="color: #28a745;">${stats.passed}</strong><br>
                            <small>Passed</small>
                        </span>
                        <span style="text-align: center;">
                            <strong style="color: #dc3545;">${stats.failed}</strong><br>
                            <small>Failed</small>
                        </span>
                        <span style="text-align: center;">
                            <strong style="color: #ffc107;">${stats.skipped}</strong><br>
                            <small>Skipped</small>
                        </span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(stats.passed / stats.total * 100)}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        ${this.reports.failures.length > 0 ? `
        <h2>Failed Tests</h2>
        ${this.reports.failures.map(failure => `
            <div class="failure">
                <h4>${failure.name}</h4>
                <p><strong>Category:</strong> ${failure.category}</p>
                <p><strong>Error:</strong> ${failure.error}</p>
                <pre>${failure.stack || 'No stack trace available'}</pre>
            </div>
        `).join('')}
        ` : ''}

        ${this.reports.recommendations.length > 0 ? `
        <h2>Recommendations</h2>
        <div class="recommendations">
            ${this.reports.recommendations.map(rec => `
                <div class="recommendation ${rec.priority}">
                    <h4>${rec.type.replace(/_/g, ' ').toUpperCase()}</h4>
                    <p>${rec.message}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`;

    return html;
  }

  // Generate JSON report
  generateJSONReport() {
    return JSON.stringify(this.reports, null, 2);
  }

  // Save reports to files
  saveReports(outputDir = 'test-results') {
    const reportsDir = path.join(__dirname, '..', outputDir);

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save HTML report
    const htmlContent = this.generateHTMLReport();
    const htmlPath = path.join(reportsDir, `test-report-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlContent);

    // Save JSON report
    const jsonContent = this.generateJSONReport();
    const jsonPath = path.join(reportsDir, `test-report-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, jsonContent);

    console.log(`📊 Test reports saved to:`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   JSON: ${jsonPath}`);

    return { html: htmlPath, json: jsonPath };
  }
}

// Example usage
if (require.main === module) {
  const generator = new TestReportGenerator();

  // Mock test results
  const mockTests = [
    { name: 'Health check', category: 'api', status: 'passed' },
    { name: 'Create task', category: 'tasks', status: 'passed' },
    { name: 'Update task', category: 'tasks', status: 'failed', error: 'Validation failed' },
    { name: 'Delete task', category: 'tasks', status: 'passed' },
    { name: 'Get projects', category: 'projects', status: 'passed' },
    { name: 'Rate limiting', category: 'security', status: 'passed' },
    { name: 'Concurrent updates', category: 'performance', status: 'failed', error: 'Timeout' },
    { name: 'Error handling', category: 'error-handling', status: 'skipped' }
  ];

  // Add test results
  mockTests.forEach(test => generator.addTestResult(test));

  // Calculate metrics
  generator.calculateMetrics();
  generator.generateRecommendations();

  // Save reports
  generator.saveReports();
}

module.exports = TestReportGenerator;