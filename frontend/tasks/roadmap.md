**Steps**
1. Phase 1 — Baseline and contract alignment
- [x] Freeze scope around backend routes that are implemented now.
- [x] Keep appointments, upload/OCR, and outreach automation as placeholders until the backend stops returning not implemented.
- [x] Add a short frontend contract note near the shared API layer or shell to prevent fake capability from creeping back in.

1. Phase 2 — Operational status from backend probes
- [x] Add shared API functions for GET /health and GET /ready in frontend/src/shared/api/healthsphere.ts.
- [x] Add a lightweight status query or hook that checks liveness and readiness without blocking route rendering.
- [x] Replace the static System status copy in frontend/src/app/layouts/app-shell.tsx with real backend-backed status.
- [x] Add passive degraded and unavailable UI states for backend-down or DB-not-ready cases.
- [ ] Verify the shell still behaves well on slow or failed network calls.

1. Phase 3 — Patient lookup and roster completion
- [x] Add patient search UI for GET /patients?q=... on frontend/src/app/screens/reception-dashboard-page.tsx.
- [x] Tie the query key to the search term while keeping the selected patient stable through refetches.
- [ ] Distinguish no search results from no patients in clinic scope.
- [x] Surface clear duplicate external ID guidance on 409 responses from POST /patients.

1. Phase 4 — Triage list coverage
- [x] Expose GET /triage/cases in a staff-facing UI, either as a reception subpanel or a dedicated route.
- [x] Reuse current card/status patterns to show complaint, urgency, review status, queue, and patient linkage.
- [x] Make clear that triage cases is the broader review list and triage queue is only the active open subset.
- [x] Add loading, empty, and clinic-scope error states.

1. Phase 5 — Consultation list and filter completion
- [x] Extend the shared API client to support the backend status filter on GET /consultations.
- [x] Add status filtering to the physician dashboard or a queue-adjacent consultation list.
- [x] Keep the current open-or-resume queue behavior intact while exposing completed and ready sessions more clearly.
- [ ] Restrict consultation status UI to the backend enum values only.

1. Phase 6 — Records list and filter completion
- [x] Extend the shared API client to support review_status filtering on GET /records.
- [x] Add record review-state filters or tabs on frontend/src/app/screens/reception-dashboard-page.tsx.
- [x] Surface reviewer, reviewed_at, provenance, and timestamps more clearly in the record detail area.
- [ ] Keep manual record entry as the only active record-ingestion path until server-side upload exists.

1. Phase 7 — Contract-aware errors and safety messaging
- [x] Centralize contract-specific error messaging in the shared API/UI layer.
- [x] Add tailored UI handling for 400 invalid clinic UUID, 403 out-of-clinic writes, 404 cross-scope fetches, 409 duplicate patient external IDs, and validation_error details.
- [ ] Keep draft-only and review-required labeling visible anywhere draft consultation notes or non-approved record states appear.

1. Phase 8 — Verification and cleanup
- [ ] Verify every implemented backend route now has either a live UI path or an explicit documented reason it is not exposed.
- [ ] Verify query invalidation still works after adding search and filter state.
- [x] Run frontend typecheck and build validation.
- [ ] Run the manual flow: create patient → create triage case → open queue → create or update consultation → create and review record.
- [ ] Update any copy that still says contract-backed features are unavailable when they are now implemented.