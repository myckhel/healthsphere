class ClerkAuthService:
    async def verify_session_token(self, _token: str) -> dict[str, str]:
        raise NotImplementedError("Clerk verification is not wired yet.")
