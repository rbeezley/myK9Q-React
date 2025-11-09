You are helping me commit and push changes to GitHub. Follow this workflow exactly:

## Step 1: Verify Build Quality
Run these commands in parallel:
- `npm run typecheck` - Ensure no TypeScript errors
- `npm run lint` - Ensure no ESLint errors

If either fails, STOP and fix the errors before proceeding.

## Step 2: Review Changes
Run `git status` and `git diff` to show me what changed.

## Step 3: Draft Commit Message
Analyze the changes and draft a commit message following this format:
- First line: Concise summary (50 chars max) in present tense
- Blank line
- Bullet points explaining WHY the changes were made (not WHAT changed)
- Focus on user impact and technical reasoning
- End with: 🤖 Generated with [Claude Code](https://claude.com/claude-code)
- End with: Co-Authored-By: Claude <noreply@anthropic.com>

## Step 4: Stage and Commit
Run these commands sequentially:
1. `git add .` - Stage all changes
2. `git commit -m "$(cat <<'EOF'
   [Your drafted commit message here]
   EOF
   )"` - Commit with the message
3. `git status` - Verify commit succeeded

## Step 5: Push to GitHub
Ask me: "Ready to push to GitHub? (yes/no)"

If I say yes:
- Run `git push` to push to the remote repository
- Confirm success with the output

## Important Rules:
- NEVER skip the typecheck and lint steps
- NEVER commit if tests fail
- ALWAYS use HEREDOC format for commit messages
- ALWAYS ask before pushing
- Keep commit messages focused on the "why" not the "what"

Start by running the build quality checks.