# Git Commit with Quality Checks

This skill should be used when the user wants to commit changes, push to GitHub, or asks to "save my work" or "commit this".

## What This Skill Does

Commits and pushes changes to GitHub with quality gates:

1. Runs lint and typecheck (parallel)
2. Shows what changed
3. Drafts a meaningful commit message
4. Stages and commits
5. Asks before pushing

## Trigger Phrases

- "commit this"
- "commit my changes"
- "push to GitHub"
- "save my work"
- "git commit"
- "commit and push"

## Workflow

### Step 1: Quality Checks (Parallel)
```bash
npm run typecheck
npm run lint
```
**If either fails**: STOP and fix errors first.

### Step 2: Review Changes
```bash
git status
git diff
```

### Step 3: Draft Commit Message

Format:
- First line: Concise summary (50 chars max), present tense
- Blank line
- Bullet points explaining WHY (not what)
- Focus on user impact

Example:
```
feat(scoring): Add offline queue retry logic

- Improves reliability when network is unstable at venues
- Prevents score data loss during connectivity drops
- Users see immediate feedback with optimistic updates
```

### Step 4: Stage and Commit
```bash
git add .
git commit -m "$(cat <<'EOF'
[commit message]

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 5: Push (Ask First)
Ask: "Ready to push to GitHub? (yes/no)"

If yes:
```bash
git push
```

## Important Rules

- NEVER skip quality checks
- NEVER commit if checks fail
- ALWAYS ask before pushing
- Use HEREDOC for commit messages
- Focus on "why" not "what"
