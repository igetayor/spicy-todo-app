#!/usr/bin/env python3
"""
Test runner script for the Spicy Todo API
"""

import subprocess
import sys
import os
from pathlib import Path


def run_tests():
    """Run all tests with coverage"""
    print("🧪 Running Spicy Todo API Tests...")
    print("=" * 50)
    
    # Change to the API directory
    api_dir = Path(__file__).parent
    os.chdir(api_dir)
    
    try:
        # Run pytest with coverage
        cmd = [
            sys.executable, "-m", "pytest",
            "tests/",
            "--verbose",
            "--cov=.",
            "--cov-report=html",
            "--cov-report=term-missing",
            "--cov-report=xml",
            "--cov-fail-under=80",
            "--tb=short"
        ]
        
        print(f"Running: {' '.join(cmd)}")
        print()
        
        result = subprocess.run(cmd, capture_output=False)
        
        if result.returncode == 0:
            print("\n" + "=" * 50)
            print("🎉 All tests passed!")
            print("📊 Coverage report generated in htmlcov/index.html")
            print("📄 Coverage XML report generated in coverage.xml")
        else:
            print("\n" + "=" * 50)
            print("❌ Some tests failed!")
            sys.exit(1)
            
    except FileNotFoundError:
        print("❌ pytest not found. Please install test dependencies:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        sys.exit(1)


def run_specific_test(test_pattern):
    """Run specific tests matching pattern"""
    print(f"🧪 Running tests matching: {test_pattern}")
    print("=" * 50)
    
    api_dir = Path(__file__).parent
    os.chdir(api_dir)
    
    try:
        cmd = [
            sys.executable, "-m", "pytest",
            f"tests/{test_pattern}",
            "--verbose",
            "--tb=short"
        ]
        
        print(f"Running: {' '.join(cmd)}")
        print()
        
        result = subprocess.run(cmd, capture_output=False)
        
        if result.returncode == 0:
            print("\n" + "=" * 50)
            print("🎉 Tests passed!")
        else:
            print("\n" + "=" * 50)
            print("❌ Tests failed!")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        sys.exit(1)


def run_coverage_only():
    """Run tests with coverage only (no HTML report)"""
    print("🧪 Running tests with coverage...")
    print("=" * 50)
    
    api_dir = Path(__file__).parent
    os.chdir(api_dir)
    
    try:
        cmd = [
            sys.executable, "-m", "pytest",
            "tests/",
            "--cov=.",
            "--cov-report=term-missing",
            "--cov-fail-under=80",
            "--tb=short"
        ]
        
        result = subprocess.run(cmd, capture_output=False)
        
        if result.returncode == 0:
            print("\n" + "=" * 50)
            print("🎉 All tests passed!")
        else:
            print("\n" + "=" * 50)
            print("❌ Some tests failed!")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--coverage-only":
            run_coverage_only()
        elif sys.argv[1] == "--help":
            print("Usage:")
            print("  python run_tests.py                    # Run all tests with full coverage")
            print("  python run_tests.py --coverage-only     # Run tests with terminal coverage only")
            print("  python run_tests.py test_pattern        # Run specific tests")
            print("  python run_tests.py --help              # Show this help")
        else:
            run_specific_test(sys.argv[1])
    else:
        run_tests()
