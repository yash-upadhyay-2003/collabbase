import { jsx as _jsx } from "react/jsx-runtime";
export default function AppShell({ children }) {
    return (_jsx("div", { style: styles.root, children: _jsx("main", { style: styles.main, children: children }) }));
}
const styles = {
    root: {
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        backgroundColor: "var(--color-bg)",
    },
    main: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },
};
