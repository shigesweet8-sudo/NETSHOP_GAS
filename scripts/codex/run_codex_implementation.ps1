param(
    [Parameter(Mandatory = $true)]
    [string]$Step
)

$generatedArtifacts = @(
    'codex_instruction.md',
    'issue_body.md',
    'issue_tasks.md',
    'openai_response.json',
    'review_result.json',
    'review_summary_ja.txt',
    'review_status.json',
    'retry_issue_body.md',
    'reviewed_commit.txt',
    'reviewed_branch.txt'
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
        foreach ($artifact in $generatedArtifacts) {
            git restore --staged -- $artifact 2>$null
            if ($LASTEXITCODE -ne 0) {
                $LASTEXITCODE = 0
            }
        }
        $diffPath = Join-Path $env:RUNNER_TEMP "implementation.diff"
        git diff --cached --binary --no-color | Out-File -FilePath $diffPath -Encoding utf8NoBOM
        "diff_path=$diffPath" | Out-File -FilePath $env:GITHUB_OUTPUT -Append -Encoding utf8NoBOM
        break
    }
    default {
        throw "Unknown step: $Step"
    }
}
