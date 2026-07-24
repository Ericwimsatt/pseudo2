# Handling Test Failures

When a verification or test fails during a SheepDog task, follow this process:

1. **Read the failure output** — examine the full error message, stack trace, and any diff output
2. **Diagnose the root cause** — determine whether the failure is in:
   - **Task code** — the implementation being built is incorrect
   - **Verification script** — the test itself has a bug or is too strict
3. **Fix task code** if the implementation is wrong
4. **Fix the verification script** if the test is incorrect — verification scripts are not infallible; adjust them when they contain bugs, incorrect assumptions, or overly brittle assertions
5. **Re-run** the verification to confirm the fix
