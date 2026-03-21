import json
import os
import pathlib
import re

IMPLEMENTATION_SUFFIXES = ('.gs', '.js', '.html', '.py', '.ps1', '.yml', '.yaml')
META_ONLY_NAMES = {
    'codex_instruction.md',
    'issue_body.md',
    'issue_tasks.md',
    'openai_response.json',
    'review_result.json',
    'review_summary_ja.txt',
    'retry_issue_body.md',
    'review_status.json',
}
DOC_PATH_PREFIXES = ('docs/',)
SPEC_KEYWORDS = (
    '仕様整理',
    'ui設計',
    '画面設計',
    '業務仕様',
    '要件整理',
    '仕様固定',
    'spec',
    'docs-only',
    'doc-only',
)


UNCERTAINTY_MARKERS = (
    "???",
    "???",
    "?????",
    "???????",
    "??",
    "????",
    "??",
    "??",
    "??",
    "??????",
)


def extract_findings_by_severity(content: str, severity: str) -> list[str]:
    pattern = re.compile(
        r"^- \[" + re.escape(severity) + r"\]\s.*?(?=^\- \[(?:SAFE|WARNING|HIGH|CRITICAL)\]|^OPEN QUESTIONS:|^SUMMARY:|\Z)",
        re.MULTILINE | re.DOTALL,
    )
    return [m.group(0).strip() for m in pattern.finditer(content)]


def findings_are_only_uncertain(findings: list[str]) -> bool:
    if not findings:
        return False
    normalized = [f.lower() for f in findings]
    return all(any(marker in f for marker in UNCERTAINTY_MARKERS) for f in normalized)


def extract_changed_files(diff_text: str) -> list[str]:
    changed_files = []
    for line in diff_text.splitlines():
        if line.startswith('+++ b/'):
            path = line[6:].strip()
            if path != '/dev/null' and path not in changed_files:
                changed_files.append(path)
    return changed_files


def is_spec_issue(issue_title: str, issue_body: str, changed_files: list[str]) -> bool:
    normalized_text = f'{issue_title}\n{issue_body}'.lower()
    has_spec_keyword = any(keyword in normalized_text for keyword in SPEC_KEYWORDS)
    non_meta_files = [p for p in changed_files if pathlib.Path(p).name not in META_ONLY_NAMES]
    has_docs_changes = any(p.startswith(DOC_PATH_PREFIXES) for p in non_meta_files)
    docs_only = bool(non_meta_files) and all(p.startswith(DOC_PATH_PREFIXES) for p in non_meta_files)
    return has_spec_keyword or has_docs_changes or docs_only


def classify_review(content: str, changed_files: list[str], issue_title: str, issue_body: str) -> dict:
    content = content.lstrip('\ufeff')
    implementation_files = [p for p in changed_files if p.endswith(IMPLEMENTATION_SUFFIXES)]
    meta_only = bool(changed_files) and all(pathlib.Path(p).name in META_ONLY_NAMES for p in changed_files)
    spec_issue = is_spec_issue(issue_title, issue_body, changed_files)
    non_meta_files = [p for p in changed_files if pathlib.Path(p).name not in META_ONLY_NAMES]
    docs_only = bool(non_meta_files) and all(p.startswith(DOC_PATH_PREFIXES) for p in non_meta_files)
    severity_match = re.search(r'^SEVERITY:\s*(SAFE|WARNING|HIGH|CRITICAL)\s*$', content, re.MULTILINE | re.IGNORECASE)
    severity = severity_match.group(1).upper() if severity_match else ''
    high_findings = extract_findings_by_severity(content, 'HIGH')
    critical_findings = extract_findings_by_severity(content, 'CRITICAL')
    uncertain_high_or_critical = findings_are_only_uncertain(high_findings + critical_findings)
    has_critical = severity == 'CRITICAL' and not uncertain_high_or_critical
    has_high = severity == 'HIGH' and not uncertain_high_or_critical

    if not changed_files:
        status = 'PIPELINE_NG'
        merge = 'マージNG'
        reason = '差分ファイルを検出できませんでした。diff 生成または実装処理を確認してください。'
    elif spec_issue and docs_only and not (has_critical or has_high):
        status = 'SPEC_OK'
        merge = 'マージOK'
        reason = '仕様整理 / docs-only Issue と判定され、重大な指摘もありません。'
    elif not implementation_files or meta_only:
        status = 'IMPLEMENTATION_NG'
        merge = 'マージNG'
        reason = '実装ファイル差分がなく、メタファイル変更のみです。実装が完了していません。'
    elif has_critical or has_high:
        status = 'QUALITY_NG'
        merge = 'マージNG'
        reason = '実装はありますが、HIGH/CRITICAL 指摘が残っているため再修正が必要です。'
    else:
        status = 'OK'
        merge = 'マージOK'
        reason = '実装ファイル差分があり、重大な指摘は検出されませんでした。'

    return {
        'status': status,
        'merge_decision': merge,
        'reason': reason,
        'implementation_present': bool(implementation_files),
        'implementation_files': implementation_files,
        'meta_only': meta_only,
        'docs_only': docs_only,
        'issue_type': 'spec' if spec_issue else 'implementation',
        'has_high_or_critical': has_critical or has_high,
        'top_severity': severity,
        'uncertain_high_or_critical': uncertain_high_or_critical,
    }


def build_retry_issue(issue_title: str, review_content: str, changed_files: list[str], classification: dict) -> str:
    changed_files_text = ', '.join(changed_files[:5]) if changed_files else '(none)'
    if len(changed_files) > 5:
        changed_files_text += f' (+{len(changed_files) - 5} more)'

    completion_lines = [
        '- HIGH / CRITICAL 指摘が解消されること',
        '- 再レビューでマージOK相当になること',
    ]
    if classification['issue_type'] == 'spec':
        completion_lines.insert(1, '- 仕様ドキュメント差分が存在すること')
    else:
        completion_lines.insert(1, '- 実装ファイル差分が存在すること')

    lines = [
        f"re: {issue_title or '(no title)'}",
        '',
        '## 背景',
        '前回の実装はレビューでマージNGになりました。以下の指摘を解消する再実装が必要です。',
        '',
        '## 前回の結果',
        f"- NG種別: {classification['status']}",
        f"- Issue種別: {'仕様整理' if classification['issue_type'] == 'spec' else '実装'}",
        f"- 実装判定: {'実装あり' if classification['implementation_present'] else '実装なし'}",
        f"- 変更ファイル: {changed_files_text}",
        '',
        '## 対応してほしいこと',
        '- レビュー指摘を解消する',
        '- Issue種別に合った差分を入れる',
        '- md/json のみの変更で終わらせない',
        '',
        '## レビュー詳細',
        review_content.strip(),
        '',
        '## 完了条件',
        *completion_lines,
    ]
    return '\n'.join(lines) + '\n'


def main() -> None:
    review_data = json.loads(pathlib.Path('review_result.json').read_text(encoding='utf-8'))
    content = review_data['choices'][0]['message']['content'].strip()
    diff_text = pathlib.Path(os.environ['DIFF_PATH']).read_text(encoding='utf-8')
    issue_title = os.environ.get('ISSUE_TITLE', '').strip()
    issue_body_path = pathlib.Path('issue_body.md')
    issue_body = issue_body_path.read_text(encoding='utf-8') if issue_body_path.exists() else ''

    changed_files = extract_changed_files(diff_text)
    changed_files_text = ', '.join(changed_files[:5]) if changed_files else '(none)'
    if len(changed_files) > 5:
        changed_files_text += f' (+{len(changed_files) - 5} more)'

    classification = classify_review(content, changed_files, issue_title, issue_body)
    retry_needed = classification['status'] not in {'OK', 'SPEC_OK'}

    status_payload = {
        'issue_title': issue_title,
        'changed_files': changed_files,
        **classification,
        'retry_issue_path': 'retry_issue_body.md' if retry_needed else '',
    }
    pathlib.Path('review_status.json').write_text(json.dumps(status_payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    if retry_needed:
        retry_body = build_retry_issue(issue_title, content, changed_files, classification)
        pathlib.Path('retry_issue_body.md').write_text(retry_body, encoding='utf-8')

    lines = [
        'ALTANA AI FACTORY レビュー',
        '',
        'Issue',
        issue_title or '(no title)',
        '',
        'Issue種別',
        '仕様整理' if classification['issue_type'] == 'spec' else '実装',
        '',
        '変更ファイル',
        changed_files_text,
        '',
        '実装判定',
        '実装あり' if classification['implementation_present'] else '実装なし',
        '',
        'マージ判定',
        classification['merge_decision'],
        '',
        'NG種別',
        classification['status'],
        '',
        '判定理由',
        classification['reason'],
        '',
        'レビュー結果',
        content,
    ]
    if retry_needed:
        lines.extend(['', '再投稿ドラフト', 'retry_issue_body.md を確認してください'])

    summary = '\n'.join(lines)
    pathlib.Path('review_summary_ja.txt').write_text(summary + '\n', encoding='utf-8')
    print(summary)


if __name__ == '__main__':
    main()
