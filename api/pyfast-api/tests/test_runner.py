#!/usr/bin/env python3
"""
Enhanced test runner for Spicy Todo API
Provides comprehensive test execution with detailed reporting
"""

import sys
import os
import subprocess
import argparse
import time
from pathlib import Path

def run_tests(
    test_path=None,
    verbose=False,
    coverage=True,
    html_report=True,
    parallel=False,
    markers=None,
    fail_fast=False,
    performance=False,
    security=False,
    integration=False
):
    """
    Run tests with various options and configurations
    """
    
    # Base pytest command
    cmd = ['python', '-m', 'pytest']
    
    # Add test path or default to tests directory
    if test_path:
        cmd.append(test_path)
    else:
        cmd.append('tests/')
    
    # Add verbosity
    if verbose:
        cmd.append('-v')
    else:
        cmd.append('-q')
    
    # Add coverage
    if coverage:
        cmd.extend([
            '--cov=.',
            '--cov-report=term-missing',
            '--cov-report=xml:coverage.xml'
        ])
        
        if html_report:
            cmd.append('--cov-report=html:htmlcov')
    
    # Add parallel execution
    if parallel:
        cmd.extend(['-n', 'auto'])
    
    # Add markers
    if markers:
        cmd.extend(['-m', markers])
    
    # Add fail fast
    if fail_fast:
        cmd.append('-x')
    
    # Add specific test categories
    test_files = []
    if performance:
        test_files.append('tests/test_performance.py')
    if security:
        test_files.append('tests/test_security.py')
    if integration:
        test_files.append('tests/test_e2e_workflows.py')
    
    if test_files:
        cmd.extend(test_files)
    
    # Add additional options
    cmd.extend([
        '--tb=short',
        '--strict-markers',
        '--disable-warnings'
    ])
    
    print(f"Running command: {' '.join(cmd)}")
    print("-" * 60)
    
    # Run the tests
    start_time = time.time()
    result = subprocess.run(cmd, capture_output=False)
    end_time = time.time()
    
    print("-" * 60)
    print(f"Test execution completed in {end_time - start_time:.2f} seconds")
    
    return result.returncode

def run_specific_test_suite(suite_name):
    """Run specific test suites"""
    
    test_suites = {
        'unit': 'tests/test_*.py -k "not integration and not performance and not security"',
        'api': 'tests/test_api_endpoints.py',
        'models': 'tests/test_models.py',
        'database': 'tests/test_database.py',
        'middleware': 'tests/test_middleware.py',
        'logging': 'tests/test_logging_config.py',
        'performance': 'tests/test_performance.py',
        'security': 'tests/test_security.py',
        'integration': 'tests/test_e2e_workflows.py',
        'all': None
    }
    
    if suite_name not in test_suites:
        print(f"Unknown test suite: {suite_name}")
        print(f"Available suites: {', '.join(test_suites.keys())}")
        return 1
    
    if suite_name == 'all':
        return run_tests(verbose=True, coverage=True)
    else:
        return run_tests(test_path=test_suites[suite_name], verbose=True)

def check_test_environment():
    """Check if test environment is properly set up"""
    
    print("Checking test environment...")
    
    # Check if pytest is installed
    try:
        import pytest
        print(f"✓ pytest {pytest.__version__} is installed")
    except ImportError:
        print("✗ pytest is not installed")
        return False
    
    # Check if coverage is available
    try:
        import coverage
        print(f"✓ coverage {coverage.__version__} is available")
    except ImportError:
        print("✗ coverage is not installed")
        return False
    
    # Check if test files exist
    test_files = [
        'tests/test_api_endpoints.py',
        'tests/test_models.py',
        'tests/test_database.py',
        'tests/test_middleware.py',
        'tests/test_logging_config.py',
        'tests/test_performance.py',
        'tests/test_security.py',
        'tests/test_e2e_workflows.py'
    ]
    
    missing_files = []
    for test_file in test_files:
        if Path(test_file).exists():
            print(f"✓ {test_file} exists")
        else:
            print(f"✗ {test_file} is missing")
            missing_files.append(test_file)
    
    if missing_files:
        print(f"\nMissing test files: {missing_files}")
        return False
    
    print("\n✓ Test environment is properly set up")
    return True

def generate_test_report():
    """Generate comprehensive test report"""
    
    print("Generating test report...")
    
    # Run tests with coverage
    result = run_tests(verbose=True, coverage=True, html_report=True)
    
    if result == 0:
        print("\n✓ All tests passed!")
        
        # Check if coverage report was generated
        if Path('htmlcov/index.html').exists():
            print("✓ HTML coverage report generated: htmlcov/index.html")
        
        if Path('coverage.xml').exists():
            print("✓ XML coverage report generated: coverage.xml")
    else:
        print(f"\n✗ Tests failed with exit code: {result}")
    
    return result

def main():
    """Main entry point"""
    
    parser = argparse.ArgumentParser(description='Spicy Todo API Test Runner')
    parser.add_argument('--suite', choices=[
        'unit', 'api', 'models', 'database', 'middleware', 
        'logging', 'performance', 'security', 'integration', 'all'
    ], help='Run specific test suite')
    parser.add_argument('--check-env', action='store_true', help='Check test environment')
    parser.add_argument('--report', action='store_true', help='Generate comprehensive test report')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--no-coverage', action='store_true', help='Disable coverage reporting')
    parser.add_argument('--parallel', '-p', action='store_true', help='Run tests in parallel')
    parser.add_argument('--fail-fast', '-x', action='store_true', help='Stop on first failure')
    parser.add_argument('--performance', action='store_true', help='Run performance tests')
    parser.add_argument('--security', action='store_true', help='Run security tests')
    parser.add_argument('--integration', action='store_true', help='Run integration tests')
    parser.add_argument('--markers', '-m', help='Run tests with specific markers')
    
    args = parser.parse_args()
    
    # Check environment if requested
    if args.check_env:
        if not check_test_environment():
            return 1
    
    # Generate report if requested
    if args.report:
        return generate_test_report()
    
    # Run specific test suite
    if args.suite:
        return run_specific_test_suite(args.suite)
    
    # Run tests with specified options
    return run_tests(
        verbose=args.verbose,
        coverage=not args.no_coverage,
        parallel=args.parallel,
        fail_fast=args.fail_fast,
        performance=args.performance,
        security=args.security,
        integration=args.integration,
        markers=args.markers
    )

if __name__ == '__main__':
    sys.exit(main())
