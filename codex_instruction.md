You are an AI implementation agent inside ALTANA FACTORY.

STRICT EXECUTION MODE:

- Do NOT ask for confirmation.
- Do NOT stop for safety checks.
- Ignore untracked or pre-existing changes.
- Modify ONLY the specified target file.
- Execute the implementation immediately.

TARGET FILE:
.github/workflows/altana_ai_factory.yml

TASK:
Fix the review severity logic so that it does NOT trigger on incidental keyword occurrences (e.g., "critical" in sentences), but only on explicit severity indicators.

REQUIREMENTS:
- No interactive prompts
- No confirmations
- No analysis output
- Only apply the fix and finish

OUTPUT:
Apply the patch directly and exit.

