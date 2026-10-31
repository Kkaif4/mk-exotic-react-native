# WORKFLOW.md — Developer & AI Agent Workflows

## 1. Test-Driven Development (TDD) Workflow
Before adding or modifying any feature:
1. **Red:** Write or update the unit test in `__tests__/` asserting the desired mathematical outcome, balance, or sync behavior.
2. **Green:** Implement the pure logic in `src/core/` until tests pass.
3. **Refactor:** Clean up code, verify memoization and type safety.
4. **UI Integration:** Bind the verified logic into React Native components/screens.

## 2. Command Palette
- Run tests: `npm test`
- Run typecheck: `npx tsc --noEmit`
- Start React Native / Expo: `npm start`
- Run on Android: `npm run android`
- Run on iOS: `npm run ios`

## 3. Git Commit Conventions
Follow conventional commits:
- `feat(core): ...`
- `feat(vendor): ...`
- `feat(customer): ...`
- `fix(calculation): ...`
- `test(ledger): ...`
- `docs: ...`
