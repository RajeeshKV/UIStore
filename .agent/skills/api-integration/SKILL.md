# API Integration Skill

Use this workflow when connecting or changing frontend API behavior.

## Workflow

1. Find the existing API client/service.
2. Find the relevant endpoint usage.
3. Inspect existing request and response types.
4. Inspect the calling component/hook.
5. Reuse existing authentication and error handling.
6. Make the smallest required API-layer and UI changes.
7. Handle loading, success, validation, and API error states.
8. Validate the affected flow.

## Rules

- Do not put raw API calls inside components when an API abstraction exists.
- Do not invent backend response shapes.
- Do not expose secrets.
- Do not modify backend code unless explicitly requested.
