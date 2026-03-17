# ALTANA AI FACTORY ISSUE

---

## MODE

DIRECT

---

## GOAL

Check review severity の誤判定修正後の動作確認

---

## CHANGE TYPE

確認

---

## PROJECT

NETSHOP_GAS

---

## MODULE

WORKFLOW

---

## TARGET FILE

.github/workflows/altana_ai_factory.yml

---

## TASK

Check review severity がレビュー本文中の単語（critical等）で誤判定せず、
実際のリスク判定に基づいて動作するか確認する

---

## ACCEPTANCE

- workflow が最後までエラーなしで完走する
- 不要な exit code 1 が発生しない
- Slack に review summary が正常送信される

---
