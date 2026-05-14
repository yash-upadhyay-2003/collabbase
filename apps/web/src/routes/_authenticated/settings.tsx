import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { PageBody, PageHeader } from "@/components/page";
import { Avatar } from "@/components/badges";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border px-6 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <div className="md:text-right">{children}</div>
    </div>
  );
}

function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and preferences." />
      <PageBody className="max-w-2xl">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-[14px] font-semibold tracking-tight">Profile</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">Personal information and identity.</p>
          </div>
          <Row label="Name">
            <div className="flex items-center justify-end gap-2">
              {user && <Avatar name={user.name} />}
              <span className="text-[13px]">{user?.name}</span>
            </div>
          </Row>
          <Row label="Email"><span className="text-[13px]">{user?.email}</span></Row>
          <Row label="Role"><span className="text-[13px] capitalize">{user?.role}</span></Row>
        </section>

        <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-[14px] font-semibold tracking-tight">Appearance</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">Choose how CollabBase looks.</p>
          </div>
          <Row label="Theme">
            <button
              onClick={toggle}
              className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-[12.5px] font-medium capitalize hover:bg-accent"
            >
              {theme}
            </button>
          </Row>
        </section>

        <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-[14px] font-semibold tracking-tight">Session</h2>
          </div>
          <Row label="Sign out">
            <button
              onClick={logout}
              className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-[12.5px] font-medium hover:bg-accent"
            >
              Log out
            </button>
          </Row>
        </section>
      </PageBody>
    </>
  );
}
