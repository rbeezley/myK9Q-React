# myK9Q Validation Suite

This skill should be used when the user asks to "validate", "check the build", "run all checks", "verify the app is ready", or wants to ensure code quality before deployment.

## What This Skill Does

Runs a comprehensive validation of the myK9Q dog show scoring application:

1. **Code Quality (Linting)** - `npm run lint`
2. **Type Safety** - `npm run typecheck`
3. **Unit Tests** - `npm test`
4. **Production Build** - `npm run build`

## Trigger Phrases

- "validate the app"
- "run validation"
- "check if everything works"
- "verify the build"
- "pre-deployment checks"
- "is the app ready to deploy?"

## Validation Workflow

### Phase 1: Linting
```bash
npm run lint
```
**Success**: 0 errors, 0 warnings

### Phase 2: TypeScript
```bash
npm run typecheck
```
**Success**: No type errors

### Phase 3: Tests
```bash
npm test
```
**Success**: All tests pass

### Phase 4: Build
```bash
npm run build
```
**Success**: Build completes, bundle sizes acceptable

## Success Criteria

- All lint checks pass
- No TypeScript errors
- All tests pass
- Production build succeeds
- Bundle size < 500KB gzipped

## If Something Fails

Stop at the first failure. Report what failed and offer to help fix it before continuing.
