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
