import { Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <div className="min-h-screen text-[var(--color-ink)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8 lg:py-6">
        <aside className="w-full shrink-0 lg:w-80"></aside>

        <main className="min-w-0 flex-1 py-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
