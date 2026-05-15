import { useEffect, useState } from "react";

type Status = "checking" | "ok" | "unreachable";

const CONFIG: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  checking:    { label: "Checking API…",  color: "var(--color-text-muted)", bg: "transparent",          dot: "var(--color-text-muted)" },
  ok:          { label: "API online",     color: "var(--color-ok)",         bg: "var(--color-ok-dim)",   dot: "var(--color-ok)" },
  unreachable: { label: "API unreachable",color: "var(--color-error)",      bg: "var(--color-error-dim)",dot: "var(--color-error)" },
};

export default function StatusBadge() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/health", { signal: controller.signal })
      .then((r) => setStatus(r.ok ? "ok" : "unreachable"))
      .catch(() => setStatus("unreachable"));

    return () => controller.abort();
  }, []);

  const { label, color, bg, dot } = CONFIG[status];

  return (
    <span style={{ ...styles.badge, color, backgroundColor: bg }}>
      <span style={{ ...styles.dot, backgroundColor: dot, boxShadow: status === "ok" ? `0 0 6px ${dot}` : "none" }} />
      {label}
    </span>
  );
}

const styles = {
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "5px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.02em",
    border: "1px solid var(--color-border)",
    transition: "all 0.3s ease",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
    transition: "all 0.3s ease",
  },
} as const;
