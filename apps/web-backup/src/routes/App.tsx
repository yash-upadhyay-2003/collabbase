import AppShell from "@/layouts/AppShell";
import StatusBadge from "@/components/StatusBadge";

export default function App() {
  return (
    <AppShell>
      <div style={styles.stage}>
        <div style={styles.card}>
          <div style={styles.logoMark}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="var(--color-accent)" fillOpacity="0.15" />
              <rect x="8" y="8" width="9" height="9" rx="2.5" fill="var(--color-accent)" />
              <rect x="19" y="8" width="9" height="9" rx="2.5" fill="var(--color-accent)" fillOpacity="0.5" />
              <rect x="8" y="19" width="9" height="9" rx="2.5" fill="var(--color-accent)" fillOpacity="0.5" />
              <rect x="19" y="19" width="9" height="9" rx="2.5" fill="var(--color-accent)" />
            </svg>
          </div>

          <h1 style={styles.title}>CollabBase</h1>
          <p style={styles.subtitle}>
            Team task management — built for speed,<br />designed for scale.
          </p>

          <div style={styles.divider} />

          <StatusBadge />
        </div>

        <p style={styles.footer}>
          CollabBase &copy; {new Date().getFullYear()} &mdash; SaaS Platform
        </p>
      </div>
    </AppShell>
  );
}

const styles = {
  stage: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "24px",
    gap: 24,
  },
  card: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 16,
    padding: "48px 56px",
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    maxWidth: 420,
    width: "100%",
    boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
  },
  logoMark: {
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.5px",
    color: "var(--color-text-primary)",
  },
  subtitle: {
    fontSize: 14,
    color: "var(--color-text-muted)",
    textAlign: "center" as const,
    lineHeight: 1.7,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "var(--color-border)",
    margin: "4px 0",
  },
  footer: {
    fontSize: 12,
    color: "var(--color-text-muted)",
    letterSpacing: "0.02em",
  },
} as const;
