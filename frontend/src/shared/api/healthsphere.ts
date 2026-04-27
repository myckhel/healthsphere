export type ActorRole = "patient" | "staff" | "clinician" | "admin";
export type ConsultationStatus = "ready" | "in_progress" | "completed";
export type ReviewStatus = "pending" | "needs_review" | "approved";
export type ConsultationNextAction =
  | "follow-up-booking"
  | "nurse-handoff"
  | "referral"
  | "discharge";

export type ServiceProbe = {
  status: string;
  service: string;
  version: string;
};

export type ConsultationPatientSnapshot = {
  patientId: string;
  fullName: string;
  externalId: string | null;
  dateOfBirth: string | null;
  sexAtBirth: string | null;
  phoneNumber: string | null;
  consentStatus: string;
  presentingComplaint: string | null;
  urgencyLevel: string | null;
  recommendedQueue: string | null;
  symptoms: string[];
};

export type ConsultationRetrievedContext = {
  recordId: string;
  chunkId: string;
  title: string;
  recordType: string;
  reviewStatus: string;
  snippet: string;
  similarityScore: number;
  recencyScore: number;
  combinedScore: number;
  createdAt: string;
};

export type ConsultationDraftAssessmentPackage = {
  source: "agent" | "fallback";
  generatedAt: string;
  reviewStatus: string;
  complaintSummary: string;
  subjective: string;
  assessment: string;
  plan: string;
  followUpQuestions: string[];
  nextActionSuggestion: ConsultationNextAction | null;
};

export type ConsultationClinicianReview = {
  isFinalized: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
};

export type ConsultationNoteDraft = {
  historyOfPresentIllness: string;
  redFlags: string;
  examFindings: string;
  assessment: string;
  carePlan: string;
  followUpInstructions: string;
};

export type PatientListItem = {
  id: string;
  clinicId: string | null;
  externalId: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  sexAtBirth: string | null;
  phoneNumber: string | null;
  consentStatus: string;
};

export type CreatePatientInput = {
  clinicId?: string | null;
  externalId?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  sexAtBirth?: string | null;
  phoneNumber?: string | null;
  consentStatus: string;
  notes?: string | null;
};

export type TriageCase = {
  id: string;
  clinicId: string | null;
  patientId: string | null;
  source: string;
  status: string;
  urgencyLevel: string;
  presentingComplaint: string;
  recommendedQueue: string | null;
  reviewStatus: string;
};

export type CreateTriageCaseInput = {
  clinicId?: string | null;
  patientId?: string | null;
  source?: string;
  urgencyLevel?: string;
  presentingComplaint: string;
  symptoms: string[];
  recommendedQueue?: string | null;
  recommendedAction?: string | null;
  modelOutput?: Record<string, unknown> | null;
  reviewStatus?: string;
};

export type TriageQueueItem = {
  triageCaseId: string;
  patientId: string | null;
  patientName: string;
  urgencyLevel: string;
  visitReason: string;
  recommendedQueue: string | null;
  status: string;
  waitMinutes: number;
  queuedAt: string;
};

export type ConsultationDetail = {
  id: string;
  clinicId: string | null;
  patientId: string;
  triageCaseId: string | null;
  status: ConsultationStatus;
  clinicianId: string;
  clinicianName: string | null;
  nextAction: ConsultationNextAction | null;
  startedAt: string | null;
  completedAt: string | null;
  draftNote: ConsultationNoteDraft | null;
  patientSnapshot: ConsultationPatientSnapshot | null;
  retrievedContext: ConsultationRetrievedContext[];
  draftAssessmentPackage: ConsultationDraftAssessmentPackage | null;
  clinicianReview: ConsultationClinicianReview;
};

export type CreateConsultationInput = {
  clinicId?: string | null;
  patientId: string;
  triageCaseId?: string | null;
  clinicianName?: string | null;
  status?: ConsultationStatus;
  draftNote?: Partial<ConsultationNoteDraft> | null;
};

export type UpdateConsultationInput = {
  clinicianName?: string | null;
  status?: ConsultationStatus;
  nextAction?: ConsultationNextAction | null;
  draftNote?: Partial<ConsultationNoteDraft> | null;
  finalAssessmentReviewed?: boolean | null;
};

export type RecordDetail = {
  id: string;
  clinicId: string | null;
  patientId: string;
  title: string;
  recordType: string;
  source: string;
  reviewStatus: ReviewStatus | string;
  reviewedBy: string | null;
  rawText: string | null;
  structuredData: Record<string, unknown> | null;
  provenance: Record<string, unknown> | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateRecordInput = {
  clinicId?: string | null;
  patientId: string;
  title: string;
  recordType: string;
  source?: string;
  rawText?: string | null;
  structuredData?: Record<string, unknown> | null;
  provenance?: Record<string, unknown> | null;
  reviewStatus?: string;
};

type ErrorEnvelope = {
  code: string;
  message: string;
  request_id?: string | null;
  details?: unknown;
};

type ValidationErrorDetail = {
  loc?: Array<string | number>;
  msg?: string;
};

export type ApiErrorKind =
  | "duplicate_patient_external_id"
  | "invalid_clinic_scope"
  | "missing_clinic_scope"
  | "out_of_clinic_scope"
  | "cross_scope_missing"
  | "validation"
  | "generic";

export type ApiErrorDescriptor = {
  kind: ApiErrorKind;
  message: string;
  details: string[];
  requestId: string | null;
  status: number | null;
};

type BackendPatient = {
  id: string;
  clinic_id: string | null;
  external_id: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  sex_at_birth: string | null;
  phone_number: string | null;
  consent_status: string;
};

type BackendPatientLookupResponse = {
  patient: BackendPatient | null;
};

type BackendTriageCase = {
  id: string;
  clinic_id: string | null;
  patient_id: string | null;
  source: string;
  status: string;
  urgency_level: string;
  presenting_complaint: string;
  recommended_queue: string | null;
  review_status: string;
};

type BackendQueueItem = {
  triage_case_id: string;
  patient_id: string | null;
  patient_name: string;
  urgency_level: string;
  visit_reason: string;
  recommended_queue: string | null;
  status: string;
  wait_minutes: number;
  queued_at: string;
};

type BackendConsultation = {
  id: string;
  clinic_id: string | null;
  patient_id: string;
  triage_case_id: string | null;
  status: ConsultationStatus;
  clinician_id: string;
  clinician_name: string | null;
  next_action: ConsultationNextAction | null;
  started_at: string | null;
  completed_at: string | null;
  draft_note: Record<string, unknown> | null;
  patient_snapshot?: BackendConsultationPatientSnapshot | null;
  retrieved_context?: BackendConsultationRetrievedContext[] | null;
  draft_assessment_package?: BackendConsultationDraftAssessmentPackage | null;
  clinician_review?: BackendConsultationClinicianReview | null;
};

type BackendConsultationPatientSnapshot = {
  patient_id: string;
  full_name: string;
  external_id: string | null;
  date_of_birth: string | null;
  sex_at_birth: string | null;
  phone_number: string | null;
  consent_status: string;
  presenting_complaint: string | null;
  urgency_level: string | null;
  recommended_queue: string | null;
  symptoms: string[];
};

type BackendConsultationRetrievedContext = {
  record_id: string;
  chunk_id: string;
  title: string;
  record_type: string;
  review_status: string;
  snippet: string;
  similarity_score: number;
  recency_score: number;
  combined_score: number;
  created_at: string;
};

type BackendConsultationDraftAssessmentPackage = {
  source: "agent" | "fallback";
  generated_at: string;
  review_status: string;
  complaint_summary: string;
  subjective: string;
  assessment: string;
  plan: string;
  follow_up_questions: string[];
  next_action_suggestion: ConsultationNextAction | null;
};

type BackendConsultationClinicianReview = {
  is_finalized: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

type BackendRecord = {
  id: string;
  clinic_id: string | null;
  patient_id: string;
  title: string;
  record_type: string;
  source: string;
  review_status: string;
  reviewed_by: string | null;
  raw_text: string | null;
  structured_data: Record<string, unknown> | null;
  provenance: Record<string, unknown> | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type BackendServiceProbe = {
  status: string;
  service: string;
  version: string;
};

const DEFAULT_CLINIC_ID = "11111111-1111-1111-1111-111111111111";

export const appConfig = {
  apiBaseUrl:
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    "http://localhost:8000/api/v1",
  actorId:
    (import.meta.env.VITE_ACTOR_ID as string | undefined) ??
    "frontend-staff-01",
  actorRole: ((import.meta.env.VITE_ACTOR_ROLE as string | undefined) ??
    "staff") as ActorRole,
  clinicId:
    (import.meta.env.VITE_CLINIC_ID as string | undefined) ?? DEFAULT_CLINIC_ID,
};

type ActorOverride = {
  actorId?: string;
  actorRole?: ActorRole;
  clinicId?: string | null;
};

type RequestOptions = {
  actor?: ActorOverride;
};

// Keep frontend behavior aligned with the current backend contract.
// Unsupported backend routes such as appointments and record upload must stay
// clearly non-interactive in the UI until the backend stops returning 501.

export class ApiError extends Error {
  code: string;
  status: number;
  requestId: string | null;
  details: unknown;

  constructor(status: number, payload: ErrorEnvelope) {
    super(payload.message);
    this.name = "ApiError";
    this.code = payload.code;
    this.status = status;
    this.requestId = payload.request_id ?? null;
    this.details = payload.details ?? null;
  }
}

function isValidationErrorDetailArray(
  value: unknown,
): value is ValidationErrorDetail[] {
  return Array.isArray(value);
}

function normalizeValidationPath(detail: ValidationErrorDetail) {
  const path = (detail.loc ?? [])
    .filter((segment) => segment !== "body")
    .map((segment) => String(segment))
    .join(".");

  return path || "request";
}

export function getApiValidationDetails(error: unknown) {
  if (!(error instanceof ApiError) || error.code !== "validation_error") {
    return [];
  }

  if (!isValidationErrorDetailArray(error.details)) {
    return [];
  }

  return error.details
    .map((detail) => {
      const message = typeof detail.msg === "string" ? detail.msg : null;
      if (!message) {
        return null;
      }

      return `${normalizeValidationPath(detail)}: ${message}`;
    })
    .filter((detail): detail is string => Boolean(detail));
}

export function describeApiError(
  error: unknown,
  fallback = "Something went wrong.",
): ApiErrorDescriptor {
  if (error instanceof ApiError) {
    const validationDetails = getApiValidationDetails(error);

    if (
      error.status === 409 &&
      /external ID already exists in the current clinic scope/i.test(
        error.message,
      )
    ) {
      return {
        kind: "duplicate_patient_external_id",
        message:
          "That patient ID is already in use in this clinic. Open the existing record or enter a different patient ID.",
        details: [
          "Duplicate IDs are checked within the current clinic scope only.",
        ],
        requestId: error.requestId,
        status: error.status,
      };
    }

    if (
      error.status === 400 &&
      /Invalid clinic scope in actor context/i.test(error.message)
    ) {
      return {
        kind: "invalid_clinic_scope",
        message:
          "The clinic context on this request is invalid. Refresh the app or correct the configured clinic ID before trying again.",
        details: [],
        requestId: error.requestId,
        status: error.status,
      };
    }

    if (
      error.status === 403 &&
      /Clinic scope is required for this route/i.test(error.message)
    ) {
      return {
        kind: "missing_clinic_scope",
        message:
          "This action needs an active clinic scope before it can continue.",
        details: ["Open the app in the correct clinic workspace and retry."],
        requestId: error.requestId,
        status: error.status,
      };
    }

    if (
      error.status === 403 &&
      /outside the assigned clinic scope/i.test(error.message)
    ) {
      return {
        kind: "out_of_clinic_scope",
        message:
          "This write is outside the current clinic scope. Switch to the assigned clinic before saving changes.",
        details: [],
        requestId: error.requestId,
        status: error.status,
      };
    }

    if (error.status === 404 && /current clinic scope/i.test(error.message)) {
      return {
        kind: "cross_scope_missing",
        message: "That item is not available in the current clinic scope.",
        details: [
          "Open the patient, triage case, consultation, or record from this clinic's own list or queue.",
        ],
        requestId: error.requestId,
        status: error.status,
      };
    }

    if (error.code === "validation_error") {
      return {
        kind: "validation",
        message:
          "Some details need correction before this request can be saved.",
        details: validationDetails,
        requestId: error.requestId,
        status: error.status,
      };
    }

    return {
      kind: "generic",
      message: error.message,
      details: [],
      requestId: error.requestId,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      kind: "generic",
      message: error.message,
      details: [],
      requestId: null,
      status: null,
    };
  }

  return {
    kind: "generic",
    message: fallback,
    details: [],
    requestId: null,
    status: null,
  };
}

function buildUrl(path: string, params?: Record<string, string | undefined>) {
  const url = new URL(path, `${appConfig.apiBaseUrl.replace(/\/$/, "")}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

function buildHeaders(headers?: HeadersInit, options?: RequestOptions) {
  const requestHeaders = new Headers(headers);
  const actorId = options?.actor?.actorId ?? appConfig.actorId;
  const actorRole = options?.actor?.actorRole ?? appConfig.actorRole;
  const clinicId =
    options?.actor && "clinicId" in options.actor
      ? options.actor.clinicId
      : appConfig.clinicId;

  requestHeaders.set("Content-Type", "application/json");
  requestHeaders.set("X-HealthSphere-Actor-Id", actorId);
  requestHeaders.set("X-HealthSphere-Actor-Role", actorRole);
  if (clinicId) {
    requestHeaders.set("X-HealthSphere-Clinic-Id", clinicId);
  } else {
    requestHeaders.delete("X-HealthSphere-Clinic-Id");
  }
  return requestHeaders;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  params?: Record<string, string | undefined>,
  options?: RequestOptions,
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    ...init,
    headers: buildHeaders(init?.headers, options),
  });

  if (!response.ok) {
    const payload = (await response
      .json()
      .catch(() => null)) as ErrorEnvelope | null;
    throw new ApiError(
      response.status,
      payload ?? {
        code: "unknown_error",
        message: "The request failed.",
      },
    );
  }

  return (await response.json()) as T;
}

function normalizeDraftNote(
  input: Record<string, unknown> | null,
): ConsultationNoteDraft | null {
  if (!input) {
    return null;
  }

  return {
    historyOfPresentIllness:
      typeof input.historyOfPresentIllness === "string"
        ? input.historyOfPresentIllness
        : "",
    redFlags: typeof input.redFlags === "string" ? input.redFlags : "",
    examFindings:
      typeof input.examFindings === "string" ? input.examFindings : "",
    assessment: typeof input.assessment === "string" ? input.assessment : "",
    carePlan: typeof input.carePlan === "string" ? input.carePlan : "",
    followUpInstructions:
      typeof input.followUpInstructions === "string"
        ? input.followUpInstructions
        : "",
  };
}

function normalizePatient(input: BackendPatient): PatientListItem {
  return {
    id: input.id,
    clinicId: input.clinic_id,
    externalId: input.external_id,
    firstName: input.first_name,
    lastName: input.last_name,
    dateOfBirth: input.date_of_birth,
    sexAtBirth: input.sex_at_birth,
    phoneNumber: input.phone_number,
    consentStatus: input.consent_status,
  };
}

function normalizeTriageCase(input: BackendTriageCase): TriageCase {
  return {
    id: input.id,
    clinicId: input.clinic_id,
    patientId: input.patient_id,
    source: input.source,
    status: input.status,
    urgencyLevel: input.urgency_level,
    presentingComplaint: input.presenting_complaint,
    recommendedQueue: input.recommended_queue,
    reviewStatus: input.review_status,
  };
}

function normalizeQueueItem(input: BackendQueueItem): TriageQueueItem {
  return {
    triageCaseId: input.triage_case_id,
    patientId: input.patient_id,
    patientName: input.patient_name,
    urgencyLevel: input.urgency_level,
    visitReason: input.visit_reason,
    recommendedQueue: input.recommended_queue,
    status: input.status,
    waitMinutes: input.wait_minutes,
    queuedAt: input.queued_at,
  };
}

function normalizeConsultation(input: BackendConsultation): ConsultationDetail {
  return {
    id: input.id,
    clinicId: input.clinic_id,
    patientId: input.patient_id,
    triageCaseId: input.triage_case_id,
    status: input.status,
    clinicianId: input.clinician_id,
    clinicianName: input.clinician_name,
    nextAction: input.next_action,
    startedAt: input.started_at,
    completedAt: input.completed_at,
    draftNote: normalizeDraftNote(input.draft_note),
    patientSnapshot: normalizeConsultationPatientSnapshot(
      input.patient_snapshot ?? null,
    ),
    retrievedContext: (input.retrieved_context ?? []).map(
      normalizeConsultationRetrievedContext,
    ),
    draftAssessmentPackage: normalizeDraftAssessmentPackage(
      input.draft_assessment_package ?? null,
    ),
    clinicianReview: normalizeConsultationClinicianReview(
      input.clinician_review ?? null,
    ),
  };
}

function normalizeConsultationPatientSnapshot(
  input: BackendConsultationPatientSnapshot | null,
): ConsultationPatientSnapshot | null {
  if (!input) {
    return null;
  }

  return {
    patientId: input.patient_id,
    fullName: input.full_name,
    externalId: input.external_id,
    dateOfBirth: input.date_of_birth,
    sexAtBirth: input.sex_at_birth,
    phoneNumber: input.phone_number,
    consentStatus: input.consent_status,
    presentingComplaint: input.presenting_complaint,
    urgencyLevel: input.urgency_level,
    recommendedQueue: input.recommended_queue,
    symptoms: input.symptoms ?? [],
  };
}

function normalizeConsultationRetrievedContext(
  input: BackendConsultationRetrievedContext,
): ConsultationRetrievedContext {
  return {
    recordId: input.record_id,
    chunkId: input.chunk_id,
    title: input.title,
    recordType: input.record_type,
    reviewStatus: input.review_status,
    snippet: input.snippet,
    similarityScore: input.similarity_score,
    recencyScore: input.recency_score,
    combinedScore: input.combined_score,
    createdAt: input.created_at,
  };
}

function normalizeDraftAssessmentPackage(
  input: BackendConsultationDraftAssessmentPackage | null,
): ConsultationDraftAssessmentPackage | null {
  if (!input) {
    return null;
  }

  return {
    source: input.source,
    generatedAt: input.generated_at,
    reviewStatus: input.review_status,
    complaintSummary: input.complaint_summary,
    subjective: input.subjective,
    assessment: input.assessment,
    plan: input.plan,
    followUpQuestions: input.follow_up_questions ?? [],
    nextActionSuggestion: input.next_action_suggestion,
  };
}

function normalizeConsultationClinicianReview(
  input: BackendConsultationClinicianReview | null,
): ConsultationClinicianReview {
  return {
    isFinalized: input?.is_finalized ?? false,
    reviewedBy: input?.reviewed_by ?? null,
    reviewedAt: input?.reviewed_at ?? null,
  };
}

function normalizeRecord(input: BackendRecord): RecordDetail {
  return {
    id: input.id,
    clinicId: input.clinic_id,
    patientId: input.patient_id,
    title: input.title,
    recordType: input.record_type,
    source: input.source,
    reviewStatus: input.review_status,
    reviewedBy: input.reviewed_by,
    rawText: input.raw_text,
    structuredData: input.structured_data,
    provenance: input.provenance,
    reviewedAt: input.reviewed_at,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
  };
}

function withClinicId<T extends { clinicId?: string | null }>(input: T) {
  return {
    ...input,
    clinicId: input.clinicId ?? appConfig.clinicId,
  };
}

export const queryKeys = {
  health: ["health"] as const,
  readiness: ["readiness"] as const,
  patients: (search = "") => ["patients", search] as const,
  triageCases: ["triage-cases"] as const,
  triageQueue: ["triage-queue"] as const,
  consultations: (patientId?: string, status?: ConsultationStatus) =>
    ["consultations", patientId ?? "all", status ?? "all"] as const,
  consultation: (consultationId: string) =>
    ["consultation", consultationId] as const,
  records: (patientId?: string, reviewStatus?: string) =>
    ["records", patientId ?? "all", reviewStatus ?? "all"] as const,
  record: (recordId: string) => ["record", recordId] as const,
};

export function formatPatientName(
  patient: Pick<PatientListItem, "firstName" | "lastName">,
) {
  return `${patient.firstName} ${patient.lastName}`.trim();
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
) {
  return describeApiError(error, fallback).message;
}

export function createEmptyConsultationDraft(): ConsultationNoteDraft {
  return {
    historyOfPresentIllness: "",
    redFlags: "",
    examFindings: "",
    assessment: "",
    carePlan: "",
    followUpInstructions: "",
  };
}

export async function getHealthStatus() {
  return requestJson<BackendServiceProbe>("health");
}

export async function getReadinessStatus() {
  return requestJson<BackendServiceProbe>("ready");
}

export async function listPatients(search?: string) {
  const data = await requestJson<BackendPatient[]>("patients", undefined, {
    q: search?.trim() || undefined,
  });
  return data.map(normalizePatient);
}

export async function lookupPatientByExternalId(
  externalId: string,
  options?: RequestOptions,
) {
  const data = await requestJson<BackendPatientLookupResponse>(
    "patients/lookup",
    undefined,
    {
      external_id: externalId.trim(),
    },
    options,
  );
  return data.patient ? normalizePatient(data.patient) : null;
}

export async function createPatient(input: CreatePatientInput) {
  const payload = withClinicId(input);
  const data = await requestJson<BackendPatient>("patients", {
    method: "POST",
    body: JSON.stringify({
      clinic_id: payload.clinicId,
      external_id: payload.externalId ?? null,
      first_name: payload.firstName,
      last_name: payload.lastName,
      date_of_birth: payload.dateOfBirth ?? null,
      sex_at_birth: payload.sexAtBirth ?? null,
      phone_number: payload.phoneNumber ?? null,
      consent_status: payload.consentStatus,
      notes: payload.notes ?? null,
    }),
  });
  return normalizePatient(data);
}

export async function listTriageCases() {
  const data = await requestJson<BackendTriageCase[]>("triage/cases");
  return data.map(normalizeTriageCase);
}

export async function listTriageQueue() {
  const data = await requestJson<BackendQueueItem[]>("triage/queue");
  return data.map(normalizeQueueItem);
}

export async function createTriageCase(input: CreateTriageCaseInput) {
  const payload = withClinicId(input);
  const data = await requestJson<BackendTriageCase>("triage/cases", {
    method: "POST",
    body: JSON.stringify({
      clinic_id: payload.clinicId,
      patient_id: payload.patientId ?? null,
      source: payload.source ?? "intake",
      urgency_level: payload.urgencyLevel ?? "routine",
      presenting_complaint: payload.presentingComplaint,
      symptoms: payload.symptoms,
      recommended_queue: payload.recommendedQueue ?? null,
      recommended_action: payload.recommendedAction ?? null,
      model_output: payload.modelOutput ?? null,
      review_status: payload.reviewStatus ?? "pending",
    }),
  });
  return normalizeTriageCase(data);
}

export async function listConsultations(
  patientId?: string,
  status?: ConsultationStatus,
) {
  const data = await requestJson<BackendConsultation[]>(
    "consultations",
    undefined,
    {
      patient_id: patientId,
      status,
    },
  );
  return data.map(normalizeConsultation);
}

export async function getConsultation(consultationId: string) {
  const data = await requestJson<BackendConsultation>(
    `consultations/${consultationId}`,
  );
  return normalizeConsultation(data);
}

export async function createConsultation(input: CreateConsultationInput) {
  const payload = withClinicId(input);
  const data = await requestJson<BackendConsultation>("consultations", {
    method: "POST",
    body: JSON.stringify({
      clinic_id: payload.clinicId,
      patient_id: payload.patientId,
      triage_case_id: payload.triageCaseId ?? null,
      clinician_name: payload.clinicianName ?? null,
      status: payload.status ?? "ready",
      draft_note: payload.draftNote ?? null,
    }),
  });
  return normalizeConsultation(data);
}

export async function updateConsultation(
  consultationId: string,
  input: UpdateConsultationInput,
) {
  const data = await requestJson<BackendConsultation>(
    `consultations/${consultationId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        clinician_name: input.clinicianName,
        status: input.status,
        next_action: input.nextAction,
        draft_note: input.draftNote,
        final_assessment_reviewed: input.finalAssessmentReviewed,
      }),
    },
  );
  return normalizeConsultation(data);
}

export async function regenerateConsultationDraftAssessment(
  consultationId: string,
) {
  const data = await requestJson<BackendConsultation>(
    `consultations/${consultationId}/draft-assessment/regenerate`,
    {
      method: "POST",
    },
  );
  return normalizeConsultation(data);
}

export async function listRecords(
  patientId?: string,
  reviewStatus?: ReviewStatus | string,
) {
  const data = await requestJson<BackendRecord[]>("records", undefined, {
    patient_id: patientId,
    review_status: reviewStatus,
  });
  return data.map(normalizeRecord);
}

export async function getRecord(recordId: string) {
  const data = await requestJson<BackendRecord>(`records/${recordId}`);
  return normalizeRecord(data);
}

export async function createRecord(input: CreateRecordInput) {
  const payload = withClinicId(input);
  const data = await requestJson<BackendRecord>("records", {
    method: "POST",
    body: JSON.stringify({
      clinic_id: payload.clinicId,
      patient_id: payload.patientId,
      title: payload.title,
      record_type: payload.recordType,
      source: payload.source ?? "manual",
      raw_text: payload.rawText ?? null,
      structured_data: payload.structuredData ?? null,
      provenance: payload.provenance ?? null,
      review_status: payload.reviewStatus ?? "pending",
    }),
  });
  return normalizeRecord(data);
}

export async function reviewRecord(recordId: string, reviewStatus: string) {
  const data = await requestJson<BackendRecord>(`records/${recordId}/review`, {
    method: "PATCH",
    body: JSON.stringify({ review_status: reviewStatus }),
  });
  return normalizeRecord(data);
}
