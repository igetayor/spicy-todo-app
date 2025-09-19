#!/usr/bin/env node
/**
 * Enhanced test runner for Spicy Todo Frontend
 * Provides comprehensive test execution with detailed reporting
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      coverage: true,
      watch: false,
      updateSnapshot: false,
      ...options
    };
  }

  async runTests(testPattern = '', additionalArgs = []) {
    console.log('🧪 Running Spicy Todo Frontend Tests');
    console.log('=' .repeat(50));

    const args = ['test', '--passWithNoTests'];
    
    // Add coverage if requested
    if (this.options.coverage) {
      args.push('--coverage', '--watchAll=false');
    }
    
    // Add watch mode if requested
    if (this.options.watch) {
      args.push('--watch');
    }
    
    // Add update snapshot if requested
    if (this.options.updateSnapshot) {
      args.push('--updateSnapshot');
    }
    
    // Add test pattern if provided
    if (testPattern) {
      args.push('--testNamePattern', testPattern);
    }
    
    // Add additional arguments
    args.push(...additionalArgs);

    console.log(`Running: npm ${args.join(' ')}`);
    console.log('-'.repeat(50));

    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', args, {
        stdio: 'inherit',
        shell: true
      });

      testProcess.on('close', (code) => {
        console.log('-'.repeat(50));
        if (code === 0) {
          console.log('✅ All tests passed!');
          this.displayCoverageReport();
        } else {
          console.log(`❌ Tests failed with exit code: ${code}`);
        }
        resolve(code);
      });

      testProcess.on('error', (error) => {
        console.error('❌ Error running tests:', error.message);
        reject(error);
      });
    });
  }

  async runTestSuite(suite) {
    const suites = {
      'unit': '--testPathPattern=__tests__',
      'integration': '--testPathPattern=integration',
      'components': '--testPathPattern=components/__tests__',
      'services': '--testPathPattern=services/__tests__',
      'utils': '--testPathPattern=utils/__tests__',
      'all': ''
    };

    if (!suites[suite]) {
      console.error(`❌ Unknown test suite: ${suite}`);
      console.log(`Available suites: ${Object.keys(suites).join(', ')}`);
      return 1;
    }

    const args = suites[suite] ? [suites[suite]] : [];
    return this.runTests('', args);
  }

  async runSpecificTest(testName) {
    console.log(`🎯 Running specific test: ${testName}`);
    return this.runTests(testName);
  }

  async runTestsWithCoverage() {
    console.log('📊 Running tests with coverage analysis');
    return this.runTests('', ['--coverage', '--watchAll=false']);
  }

  async runTestsInWatchMode() {
    console.log('👀 Running tests in watch mode');
    this.options.watch = true;
    return this.runTests();
  }

  async updateSnapshots() {
    console.log('📸 Updating test snapshots');
    return this.runTests('', ['--updateSnapshot']);
  }

  displayCoverageReport() {
    const coverageDir = path.join(process.cwd(), 'coverage');
    
    if (fs.existsSync(coverageDir)) {
      const lcovPath = path.join(coverageDir, 'lcov-report', 'index.html');
      
      if (fs.existsSync(lcovPath)) {
        console.log('\n📈 Coverage Report Generated:');
        console.log(`   HTML Report: file://${lcovPath}`);
        
        // Try to read coverage summary
        const summaryPath = path.join(coverageDir, 'coverage-summary.json');
        if (fs.existsSync(summaryPath)) {
          try {
            const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
            const totals = summary.total;
            
            console.log('\n📊 Coverage Summary:');
            console.log(`   Lines: ${totals.lines.pct}% (${totals.lines.covered}/${totals.lines.total})`);
            console.log(`   Functions: ${totals.functions.pct}% (${totals.functions.covered}/${totals.functions.total})`);
            console.log(`   Branches: ${totals.branches.pct}% (${totals.branches.covered}/${totals.branches.total})`);
            console.log(`   Statements: ${totals.statements.pct}% (${totals.statements.covered}/${totals.statements.total})`);
          } catch (error) {
            console.log('   Could not parse coverage summary');
          }
        }
      }
    }
  }

  async checkTestEnvironment() {
    console.log('🔍 Checking test environment...');
    
    const checks = [
      {
        name: 'Node.js version',
        check: () => {
          const version = process.version;
          const major = parseInt(version.slice(1).split('.')[0]);
          return { success: major >= 14, message: `Node.js ${version}` };
        }
      },
      {
        name: 'npm package.json',
        check: () => {
          const packagePath = path.join(process.cwd(), 'package.json');
          return { 
            success: fs.existsSync(packagePath), 
            message: fs.existsSync(packagePath) ? 'Found package.json' : 'package.json not found' 
          };
        }
      },
      {
        name: 'Jest configuration',
        check: () => {
          const jestConfig = path.join(process.cwd(), 'jest.config.js');
          return { 
            success: fs.existsSync(jestConfig), 
            message: fs.existsSync(jestConfig) ? 'Found jest.config.js' : 'jest.config.js not found' 
          };
        }
      },
      {
        name: 'Test dependencies',
        check: async () => {
          return new Promise((resolve) => {
            exec('npm list @testing-library/react @testing-library/jest-dom', (error, stdout) => {
              resolve({
                success: !error,
                message: error ? 'Testing dependencies missing' : 'Testing dependencies installed'
              });
            });
          });
        }
      },
      {
        name: 'Test files',
        check: () => {
          const testDirs = [
            'src/__tests__',
            'src/components/__tests__',
            'src/services/__tests__',
            'src/utils/__tests__'
          ];
          
          const existingDirs = testDirs.filter(dir => fs.existsSync(path.join(process.cwd(), dir)));
          return {
            success: existingDirs.length > 0,
            message: `${existingDirs.length}/${testDirs.length} test directories found`
          };
        }
      }
    ];

    let allPassed = true;
    
    for (const check of checks) {
      try {
        const result = await check.check();
        console.log(`   ${result.success ? '✅' : '❌'} ${check.name}: ${result.message}`);
        if (!result.success) allPassed = false;
      } catch (error) {
        console.log(`   ❌ ${check.name}: Error - ${error.message}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('\n✅ Test environment is properly set up');
    } else {
      console.log('\n❌ Test environment has issues');
    }

    return allPassed;
  }

  async generateTestReport() {
    console.log('📋 Generating comprehensive test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      testSuites: {}
    };

    // Run different test suites and collect results
    const suites = ['components', 'services', 'utils', 'integration'];
    
    for (const suite of suites) {
      console.log(`\n🧪 Running ${suite} tests...`);
      const exitCode = await this.runTestSuite(suite);
      report.testSuites[suite] = {
        passed: exitCode === 0,
        exitCode
      };
    }

    // Generate coverage report
    console.log('\n📊 Generating coverage report...');
    await this.runTestsWithCoverage();

    // Save report
    const reportPath = path.join(process.cwd(), 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Test report saved to: ${reportPath}`);
    
    return report;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  if (args.length === 0) {
    // Default: run all tests with coverage
    return await runner.runTestsWithCoverage();
  }

  const command = args[0];

  switch (command) {
    case '--suite':
      const suite = args[1];
      if (!suite) {
        console.error('❌ Please specify a test suite');
        console.log('Available suites: unit, integration, components, services, utils, all');
        return 1;
      }
      return await runner.runTestSuite(suite);

    case '--test':
      const testName = args[1];
      if (!testName) {
        console.error('❌ Please specify a test name pattern');
        return 1;
      }
      return await runner.runSpecificTest(testName);

    case '--watch':
      return await runner.runTestsInWatchMode();

    case '--update-snapshots':
      return await runner.updateSnapshots();

    case '--coverage':
      return await runner.runTestsWithCoverage();

    case '--check-env':
      const envOk = await runner.checkTestEnvironment();
      return envOk ? 0 : 1;

    case '--report':
      await runner.generateTestReport();
      return 0;

    case '--help':
      console.log(`
🧪 Spicy Todo Frontend Test Runner

Usage: node test-runner.js [command] [options]

Commands:
  (no args)           Run all tests with coverage
  --suite <name>      Run specific test suite (unit, integration, components, services, utils, all)
  --test <pattern>    Run tests matching pattern
  --watch             Run tests in watch mode
  --update-snapshots  Update test snapshots
  --coverage          Run tests with coverage analysis
  --check-env         Check test environment setup
  --report            Generate comprehensive test report
  --help              Show this help message

Examples:
  node test-runner.js --suite components
  node test-runner.js --test "TodoForm"
  node test-runner.js --watch
  node test-runner.js --report
      `);
      return 0;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run "node test-runner.js --help" for usage information');
      return 1;
  }
}

// Run if called directly
if (require.main === module) {
  main().then(code => process.exit(code));
}

module.exports = TestRunner;
