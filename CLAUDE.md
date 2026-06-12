@AGENTS.md
## Planning First

* Always confirm the concept, requirements, architecture, and scope with me before building anything.
* Do not start implementation until the plan is approved.
* If requirements are unclear, ask questions instead of making assumptions.
* Present a proposed folder structure before creating files.

## Project Organization

* Organize folders logically before implementation.
* Keep files small and focused.
* Avoid large monolithic files.
* Separate concerns properly (UI, API, services, utilities, models, configuration, tests).
* Create reusable modules whenever possible.
* Avoid duplicate code.

## Development Standards

* Follow clean code principles.
* Use clear and consistent naming conventions.
* Write self-explanatory code with minimal comments.
* Add comments only when necessary to explain complex logic.
* Prioritize maintainability over shortcuts.
* Do not introduce unnecessary dependencies.

## File Creation Rules

* Never create files without explaining their purpose.
* Before generating multiple files, provide a file tree structure.
* Keep each file focused on a single responsibility.
* Prefer creating new modules over expanding existing files excessively.

## Implementation Process

1. Analyze requirements.
2. Propose architecture.
3. Propose folder structure.
4. Wait for approval.
5. Implement incrementally.
6. Explain what was created and why.
7. Suggest improvements only after the requested task is complete.

## Modification Rules

* Before modifying existing files, explain the impact.
* Show which files will be changed.
* Minimize changes to unrelated code.
* Preserve backward compatibility whenever possible.

## Documentation

* Update documentation when architecture or behavior changes.
* Maintain a clear README.
* Document important design decisions.

## Quality Control

* Check for bugs, edge cases, and security risks before completion.
* Verify imports, dependencies, and file references.
* Remove unused code.
* Ensure the project builds successfully.

## Forbidden Actions

* Do not make assumptions about requirements.
* Do not generate unnecessary files.
* Do not place unrelated logic in the same file.
* Do not refactor large sections without approval.
* Do not change project structure without approval.
* Do not use placeholder implementations unless explicitly approved.

## Preferred Response Format

For every significant task:

1. Understanding
2. Proposed Architecture
3. Proposed Folder Structure
4. Files to Create/Modify
5. Wait for Approval
6. Implementation

## Project Conventions

These are enforced by guards and documented in the README — follow them in any new tool/component without being reminded:

* **i18n:** never hardcode user-facing text. Use `const { t } = useTranslation()` and add the key to **every** locale in `app/i18n/locales/<lang>/<namespace>.ts` (tools/standards → `standards` namespace; notes dashboard → `home`). Leave brand/technical tokens and DB/user data as literals. See "Recipe — building a new tool, standard, or component with i18n" in the README.
* **Timestamps:** any timestamp compared/ordered against a DB value must be server-owned (`default now()`, trigger, or RPC) — never client `new Date()`. See "Timestamps — always server-clock".
* **Nav badges:** the dropdowns self-seed their counts; pages must not query notification/friend counts and push them down.
* **Auth in navs:** seed `user` from `getSession()` + cached profile and pass `authChecked`, to avoid the logged-out / avatar flash.
* **Before finishing any task, run `npm run check`** (timestamps + badges + i18n key parity) and fix anything it flags.
