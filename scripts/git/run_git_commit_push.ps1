$branchName = "feature/issue-$env:ISSUE_NUMBER"
git add -A
git restore --staged .github/workflows/altana_ai_factory.yml 2>$null
if ($LASTEXITCODE -ne 0) {
    $LASTEXITCODE = 0
}
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m "AI: implement issue #$env:ISSUE_NUMBER"
    git push origin $branchName
}
