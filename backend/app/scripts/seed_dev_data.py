from __future__ import annotations

import asyncio

from app.core.database import get_async_session
from app.services.clinic_service import (
    DEFAULT_DEV_CLINIC_ID,
    DEFAULT_DEV_CLINIC_NAME,
    ensure_clinic,
)


async def main() -> None:
    async with get_async_session() as db:
        clinic, created = await ensure_clinic(
            db,
            clinic_id=DEFAULT_DEV_CLINIC_ID,
            name=DEFAULT_DEV_CLINIC_NAME,
        )

    status_text = "created" if created else "already present"
    print(f"{status_text}: {clinic.id} {clinic.name}")


if __name__ == "__main__":
    asyncio.run(main())