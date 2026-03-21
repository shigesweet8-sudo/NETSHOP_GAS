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


def extract_changed_files(diff_text: str) -> list[str]:
    changed_files = []
    for line in diff_text.splitlines():
        if line.startswith('+++ b/'):
            path = line[6:].strip()
            if path != '/dev/null' and path not in changed_files:
                changed_files.append(path)
    return changed_files


def classify_review(content: str, changed_files: list[str]) -> dict:
    content = content.lstrip('\ufeff')
    implementation_files = [p for p in changed_files if p.endswith(IMPLEMENTATION_SUFFIXES)]
    meta_only = bool(changed_files) and all(pathlib.Path(p).name in META_ONLY_NAMES for p in changed_files)
    severity_match = re.search(r'^SEVERITY:\s*(SAFE|WARNING|HIGH|CRITICAL)\s*$', content, re.MULTILINE | re.IGNORECASE)
    severity = severity_match.group(1).upper() if severity_match else ''
    has_critical = severity == 'CRITICAL'
    has_high = severity == 'HIGH'

    if not changed_files:
        status = 'PIPELINE_NG'
        merge = 'マージNG'
        reason = '差分ファイルを検出できませんでした。diff 生成または実装処理を確認してください。'
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
        'has_high_or_critical': has_critical or has_high,
        'top_severity': severity,
    }


def build_retry_issue(issue_title: str, review_content: str, changed_files: list[str], classification: dict) -> str:
    changed_files_text = ', '.join(changed_files[:5]) if changed_files else '(none)'
    if len(changed_files) > 5:
        changed_files_text += f' (+{len(changed_files) - 5} more)'

    lines = [
        f"re: {issue_title or '(no title)'}",
        '',
        '## 背景',
        '前回の実装はレビューでマージNGになりました。以下の指摘を解消する再実装が必要です。',
        '',
        '## 前回の結果',
        f"- NG種別: {classification['status']}",
        f"- 実装判定: {'実装あり' if classification['implementation_present'] else '実装なし'}",
        f"- 変更ファイル: {changed_files_text}",
        '',
        '## 対応してほしいこと',
        '- レビュー指摘を解消する',
        '- 実装ファイルに実コード差分を入れる',
        '- md/json のみの変更で終わらせない',
        '',
        '## レビュー詳細',
        review_content.strip(),
        '',
        '## 完了条件',
        '- HIGH / CRITICAL 指摘が解消されること',
        '- 実装ファイル差分が存在すること',
        '- 再レビューでマージOK相当になること',
    ]
    return '\n'.join(lines) + '\n'


def main() -> None:
    review_data = json.loads(pathlib.Path('review_result.json').read_text(encoding='utf-8'))
    content = review_data['choices'][0]['message']['content'].strip()
    diff_text = pathlib.Path(os.environ['DIFF_PATH']).read_text(encoding='utf-8')
    issue_title = os.environ.get('ISSUE_TITLE', '').strip()

    changed_files = extract_changed_files(diff_text)
    changed_files_text = ', '.join(changed_files[:5]) if changed_files else '(none)'
    if len(changed_files) > 5:
        changed_files_text += f' (+{len(changed_files) - 5} more)'

    classification = classify_review(content, changed_files)
    retry_needed = classification['status'] != 'OK'

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

