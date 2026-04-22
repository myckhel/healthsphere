# Frontend stack recommendation

## Keep

- React 19
- TypeScript
- Vite

These are already in place and are a good fit for a small, explicit frontend foundation.

## Add now

### React Router

Use for layouts, route surfaces, and future auth guards.

### TanStack Query

Use for all server-owned data and request lifecycle behavior.

### React Hook Form and Zod

Use for typed forms and local validation.

### Tailwind CSS

Use for the styling foundation and shared design tokens.

### Zustand

Use only for narrow cross-app client state. Do not use it as the primary application data layer.

### Utilities

- clsx
- tailwind-merge
- class-variance-authority
- date-fns
- lucide-react

## Defer until needed

### Clerk

Required by project direction, but it should come after the app shell and route structure are in place.

### TanStack Table

Useful for staff-heavy dense data views, but unnecessary for the first patient-first wave.

### i18next

Add when multilingual requirements are confirmed for the first release.

### PWA or offline libraries

Low-bandwidth resilience matters now, but service worker complexity should wait until a concrete workflow proves the need.

## Avoid

- Redux as the default state solution
- large UI frameworks that impose generic admin styling
- duplicated server state in multiple client stores
- local storage persistence of sensitive data by default