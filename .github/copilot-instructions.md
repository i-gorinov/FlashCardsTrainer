---
applyTo: "**/*"
---

# Documentation Maintenance Requirements

Documentation is part of the implementation and must be maintained whenever code changes are made.

For every coding task, determine whether the change affects any of the following:

- Features or functionality
- User interface or user experience
- Configuration
- Installation
- Deployment
- Dependencies
- API contracts
- Data formats
- Architecture or design decisions
- Usage instructions
- Code examples
- Security-related behaviour
- Known limitations
- Troubleshooting guidance

If any of these areas are affected:

- Update README.md before considering the task complete.
- Ensure all examples match the current implementation.
- Remove obsolete or superseded documentation.
- Document any new functionality, configuration, dependencies, or behavioural changes.
- Ensure installation, deployment, configuration, and usage instructions remain accurate.

After every coding task:

1. Review README.md for accuracy and completeness.
2. Update README.md whenever required.
3. If no documentation changes are necessary, explicitly state:

   "README.md review completed - no updates required."

Documentation must never knowingly contradict the current implementation.

When implementing changes:

- Treat README.md updates as part of the definition of done.
- Prefer updating documentation in the same change as the code update.
- Flag any documentation gaps, ambiguities, or outdated content discovered during the task, even if unrelated to the requested change.
- Never assume documentation is correct without reviewing it against the implementation.

# Protected Content Files

Files under the following folder are maintained manually and are considered authoritative content:

- ai-prompts/

Rules:
- Never modify files under ai-prompts/.
- Never suggest wording improvements for files under ai-prompts/.
- Never reformat files under ai-prompts/.
- Never update files under ai-prompts/ as part of a feature implementation.
- Treat files under ai-prompts/ as read-only reference content.
- Only modify files under ai-prompts/ if the user explicitly requests a change to a specific file in that folder.

# Versioning and Changelog Maintenance

When implementing changes, always consider whether the change should update `APP_INFO.version` in `js/version.js` and `CHANGELOG.md`.

Update `APP_INFO.version` when the change is intended to be part of a user-facing release.

Use semantic versioning:
- Increment PATCH for bug fixes, small corrections, and minor user-facing fixes.
- Increment MINOR for new features, meaningful UI/UX improvements, or backward-compatible user-facing enhancements.
- Increment MAJOR only for breaking changes, major workflow changes, major redesigns, or changes that significantly alter how users interact with the app.

Whenever `APP_INFO.version` is updated, also update `CHANGELOG.md` under a matching version heading.

`CHANGELOG.md` should:
- Summarise notable user-facing changes.
- Group changes under Added, Changed, Fixed, or similar headings where appropriate.
- Avoid creating one entry for every commit.
- Avoid documenting purely internal refactoring unless it affects user-facing behaviour.
- Keep version numbers, dates, and release notes aligned with `APP_INFO.version`.

Do not bump the version for changes that are purely internal, such as formatting, comments, minor code cleanup, or refactoring with no user-facing impact, unless explicitly requested.
