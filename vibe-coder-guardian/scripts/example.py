#!/usr/bin/env python3
"""
Vibe Coder Guardian — Scripts

No external scripts required. This skill is a behavioral framework that changes
how Claude writes and reviews code. It uses Claude's built-in tools:

- Read (to read existing code before modifying)
- Grep (to trace dependencies and imports)
- Glob (to find related files)
- Bash (to run existing tests and verify changes)
- Edit/Write (to implement changes with guardrails applied)

All guardrails are applied automatically during normal coding interactions.
"""
