param(
    [Parameter(Mandatory = $true)]
    [string]$Step
)

switch ($Step) {
    "create-work-branch" {
        git config user.name "github-actions[bot]"
        git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
        $branchName = "feature/issue-$env:ISSUE_NUMBER"
        git checkout -b $branchName
        git push origin $branchName
        break
    }
    "configure-ai-git-author" {
        git config user.name "ALTANA-AI-BOT"
        git config user.email "ai@altana.dev"
        break
    }
    "install-codex-cli" {
        npm install -g @openai/codex
        break
    }
    "run-codex-implementation" {
        Set-Location $env:GITHUB_WORKSPACE
        $instruction = Get-Content codex_instruction.md -Raw
        codex exec --sandbox danger-full-access $instruction
        break
    }
    "generate-implementation-diff" {
        git add -A
        $diffPath = Join-Path $env:RUNNER_TEMP "implementation.diff"
        git diff --cached --binary --no-color | Out-File -FilePath $diffPath -Encoding utf8NoBOM
        "diff_path=$diffPath" | Out-File -FilePath $env:GITHUB_OUTPUT -Append -Encoding utf8NoBOM
        break
    }
    default {
        throw "Unknown step: $Step"
    }
}
