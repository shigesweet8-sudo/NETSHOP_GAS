$branchName = "feature/issue-$env:ISSUE_NUMBER"
$generatedArtifacts = @(
    'codex_instruction.md',
    'issue_body.md',
    'issue_tasks.md',
    'openai_response.json',
    'review_result.json',
    'review_summary_ja.txt',
    'review_status.json',
    'retry_issue_body.md'
)

git add -A
git restore --staged .github/workflows/altana_ai_factory.yml 2>$null
foreach ($artifact in $generatedArtifacts) {
    git restore --staged -- $artifact 2>$null
    if ($LASTEXITCODE -ne 0) {
        $LASTEXITCODE = 0
    }
}
if ($LASTEXITCODE -ne 0) {
    $LASTEXITCODE = 0
}
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m "AI: implement issue #$env:ISSUE_NUMBER"
    git push origin $branchName
}
