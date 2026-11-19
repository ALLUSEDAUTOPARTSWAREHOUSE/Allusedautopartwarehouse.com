# Fixing GitHub Actions Agent Failures (Ruleset Violation)

## Problem

GitHub Actions agents (Claude, Codex, Copilot) are failing with 403 "Access Forbidden" errors when trying to execute workflows. The underlying cause is that the repository has **branch protection rulesets that do not grant bypass permissions to these agent apps**.

### Error Messages
- **Claude agent**: `copilot: API Error: 403 Access to this endpoint is forbidden`
- **Codex agent**: `repository ruleset violation`

### Failing Jobs
- Job: "Running Claude" (issue #192)
- Path: `dynamic/agents/anthropic-code-agent`

## Solution

Repository administrators must grant bypass permissions for the GitHub agent apps in the branch rulesets.

### Steps to Fix

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click **Settings** → **Rules** → **Rulesets**

2. **For each ruleset that targets agent branches:**
   - Click on the ruleset name to edit it
   - In "Bypass permissions", add only the agent app(s) that must operate on those branches; do not add all four apps to production/default-branch rulesets
   - Use the narrowest bypass mode available and retain required reviews and status checks on protected branches

3. **Save the changes**

### Alternative: Disable Ruleset for Specific Branches

If you prefer not to grant bypass permissions, you can:
- Configure the ruleset to **not apply to specific branches** that are used by agents
- Typically these are branches like `claude/*`, `copilot/*`, `codex/*`

## References

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)
- [Granting Bypass Permissions](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository#granting-bypass-permissions-for-your-branch-or-tag-ruleset)

## Testing

After granting bypass permissions:
1. Trigger a new agent workflow by opening a new issue that requires agent assistance
2. The agent should now be able to execute without 403 errors
3. The agent can successfully push changes and create PRs

## Status

- **Issue**: #192 (duplicate - marked for closure)
- **Related Issues**: #187, #191
- **Related PRs**: #190, #193, #194
