Open the `.github/workflows/altana_ai_factory.yml` file and modify the Codex execution section around line 112 as follows:

### Before
codex exec --sandbox workspace-write "$(cat codex_instruction.md)"

### After
codex exec --no-sandbox --sandbox workspace-write "$(cat codex_instruction.md)"
