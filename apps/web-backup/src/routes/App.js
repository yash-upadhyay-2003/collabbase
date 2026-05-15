import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import AppShell from "@/layouts/AppShell";
import StatusBadge from "@/components/StatusBadge";
export default function App() {
    return (_jsx(AppShell, { children: _jsxs("div", { style: styles.stage, children: [_jsxs("div", { style: styles.card, children: [_jsx("div", { style: styles.logoMark, children: _jsxs("svg", { width: "36", height: "36", viewBox: "0 0 36 36", fill: "none", children: [_jsx("rect", { width: "36", height: "36", rx: "10", fill: "var(--color-accent)", fillOpacity: "0.15" }), _jsx("rect", { x: "8", y: "8", width: "9", height: "9", rx: "2.5", fill: "var(--color-accent)" }), _jsx("rect", { x: "19", y: "8", width: "9", height: "9", rx: "2.5", fill: "var(--color-accent)", fillOpacity: "0.5" }), _jsx("rect", { x: "8", y: "19", width: "9", height: "9", rx: "2.5", fill: "var(--color-accent)", fillOpacity: "0.5" }), _jsx("rect", { x: "19", y: "19", width: "9", height: "9", rx: "2.5", fill: "var(--color-accent)" })] }) }), _jsx("h1", { style: styles.title, children: "CollabBase" }), _jsxs("p", { style: styles.subtitle, children: ["Team task management \u2014 built for speed,", _jsx("br", {}), "designed for scale."] }), _jsx("div", { style: styles.divider }), _jsx(StatusBadge, {})] }), _jsxs("p", { style: styles.footer, children: ["CollabBase \u00A9 ", new Date().getFullYear(), " \u2014 SaaS Platform"] })] }) }));
}
const styles = {
    stage: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
        gap: 24,
    },
    card: {
        display: "flex",
        flexDirection: "column",
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
        textAlign: "center",
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
};
