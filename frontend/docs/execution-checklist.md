# Frontend execution checklist

## Foundation

1. Install core libraries for routing, query, forms, validation, styling, and utilities.
2. Configure Vite with Tailwind and source aliasing.
3. Replace the starter app with providers, routes, and a shared layout.
4. Add a small shared UI layer before building feature screens.

## Patient-first implementation

1. Build intake forms with React Hook Form and Zod.
2. Build appointment screens with TanStack Query.
3. Add reminder and follow-up messaging flows.
4. Wire Clerk after route surfaces are stable.

## Staff-ready implementation

1. Add route guards and role-aware navigation.
2. Add triage review screens.
3. Add records and consultation surfaces.
4. Add dense data tools such as tables only when those workflows arrive.

## Validation

1. Run lint.
2. Run typecheck.
3. Run build.
4. Verify loading, error, and empty states on slow network.
5. Confirm sensitive form drafts do not persist into local storage.
6. Confirm route structure matches the documented architecture.