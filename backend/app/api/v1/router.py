from fastapi import APIRouter

from app.api.v1 import appointments, health, patients, records, triage

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(patients.router)
api_router.include_router(appointments.router)
api_router.include_router(records.router)
api_router.include_router(triage.router)

