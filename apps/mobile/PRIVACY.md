# ForestDream — On-Device Audio Privacy

ForestDream processes microphone input **entirely on the device** using a small on-device classifier.

- No audio is recorded to disk.
- No audio buffer leaves the native audio layer — only event objects `{kind, confidence, timestamp}` cross into JavaScript.
- No audio is ever transmitted to any server.
- Microphone permission is optional. Without it, the app still plays soundscapes; only adaptive disturbance response is disabled.

This is enforced at the boundary in `src/features/detection/SnoreDetector.native.ts` and can be audited by searching the codebase for any `fs`, `FileSystem`, or network call inside `features/detection/`.
