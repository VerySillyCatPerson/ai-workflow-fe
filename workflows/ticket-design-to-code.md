---
description: Reconcile ticket requirements, linked design intent, and the existing codebase. Use when implementation depends on both ticket and design context.
---

# Ticket and design to code

1. Retrieve ticket requirements, acceptance criteria, relevant discussion, and links.
2. Retrieve the linked design's components, variables, layout, and annotations.
3. Inspect repository architecture, constraints, and existing components.
4. Map the design to reusable project components and plan the implementation.
5. Surface conflicts before making a choice. Security, accessibility, and
   repository constraints take precedence; then explicit requirements, design
   intent, existing conventions, and finally inference.
6. Implement, then run tests, lint, typecheck, and other configured validation.
7. Validate both acceptance criteria and design intent.
8. Report discrepancies, assumptions, and deviations.

If a ticket says “Continue”, a design says “Submit”, and the product convention
says “Next”, report the discrepancy instead of arbitrarily choosing one.
