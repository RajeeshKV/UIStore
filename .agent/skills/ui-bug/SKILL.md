# UI Bug Fix Skill

Use this workflow for frontend bugs.

## Workflow

1. Identify the exact user action that fails.
2. Locate the UI entry point.
3. Trace only the relevant component, hook, service, and API call.
4. Determine the root cause before editing.
5. Fix the smallest responsible area.
6. Preserve existing behavior outside the bug.
7. Validate the affected flow.
8. Run targeted checks.
9. Report the root cause, fix, and validation.

## Avoid

- Whole-repository scans
- Unrelated refactoring
- Hiding errors
- Replacing working architecture
- Creating duplicate services/components
