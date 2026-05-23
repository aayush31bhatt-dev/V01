# Safe Execution Notes

The product should not have a hard stop button for autonomous work. It should expose a safe pause request.

## Safe Checkpoints

Future execution workers should pause only after:

- A file write batch completes.
- A dependency install completes.
- A build/test command completes.
- A git diff snapshot is captured.
- A generated prompt finishes and its output is recorded.

## Required Future Guards

- Every file mutation creates a history entry.
- Every dependency install records package names and versions.
- Every command has a timeout and output limit.
- Every run has a workspace root and cannot write outside it.
- Every pause request is acknowledged with the next checkpoint name.

