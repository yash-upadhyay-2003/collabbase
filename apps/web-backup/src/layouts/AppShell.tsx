import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div style={styles.root}>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    backgroundColor: "var(--color-bg)",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
  },
} as const;
