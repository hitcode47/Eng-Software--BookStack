import ast
import os
import sys
import trace
import unittest


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP_FILE = os.path.join(ROOT, "app1.py")

if ROOT not in sys.path:
    sys.path.insert(0, ROOT)


def executable_statement_lines(filename):
    with open(filename, "r", encoding="utf-8") as source_file:
        tree = ast.parse(source_file.read(), filename=filename)

    ignored = (
        ast.Import,
        ast.ImportFrom,
        ast.FunctionDef,
        ast.AsyncFunctionDef,
        ast.ClassDef,
    )
    lines = {
        node.lineno
        for node in ast.walk(tree)
        if isinstance(node, ast.stmt) and not isinstance(node, ignored)
    }
    return lines


def main():
    tracer = trace.Trace(count=True, trace=False, ignoredirs=[sys.prefix, sys.exec_prefix])
    runner = unittest.TextTestRunner(verbosity=2)

    def run_tests():
        loader = unittest.TestLoader()
        suite = loader.discover(os.path.dirname(__file__), pattern="test_*.py")
        return runner.run(suite)

    result = tracer.runfunc(run_tests)

    counts = tracer.results().counts
    executable = executable_statement_lines(APP_FILE)
    executed = {
        line
        for (filename, line), count in counts.items()
        if os.path.abspath(filename) == APP_FILE and count > 0
    }

    covered = len(executable & executed)
    total = len(executable)
    percent = (covered / total * 100) if total else 100.0
    missing = sorted(executable - executed)

    print()
    print("Coverage summary")
    print(f"  app1.py statements: {covered}/{total} ({percent:.2f}%)")
    if missing:
        preview = ", ".join(str(line) for line in missing[:40])
        suffix = " ..." if len(missing) > 40 else ""
        print(f"  missing statement lines: {preview}{suffix}")

    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
