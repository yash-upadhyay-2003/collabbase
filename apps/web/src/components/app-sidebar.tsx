import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, CheckSquare, BarChart3, Settings, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

const primary = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
] as const;

const secondary = [
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  const renderItem = (it: { to: string; label: string; icon: typeof LayoutDashboard }) => {
    const active = path === it.to || path.startsWith(it.to + "/");
    const Icon = it.icon;
    return (
      <li key={it.to}>
        <Link
          to={it.to}
          onClick={onNavigate}
          className={cn(
            "group relative flex items-center gap-3 rounded-md px-2 py-1.5 text-[13px] transition-colors",
            active
              ? "text-foreground"
              : "text-muted-foreground/90 hover:text-foreground",
          )}
        >
          {active && (
            <span className="absolute inset-0 -z-0 rounded-md bg-sidebar-accent/60" aria-hidden />
          )}
          <Icon
            className={cn(
              "relative h-[15px] w-[15px] transition-colors",
              active ? "text-foreground" : "text-muted-foreground/70 group-hover:text-foreground",
            )}
            strokeWidth={1.75}
          />
          <span className="relative font-medium tracking-tight">{it.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-sidebar-border/70 bg-sidebar">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-foreground text-background">
          <Hexagon className="h-3.5 w-3.5" strokeWidth={2.25} />
        </div>
        <span className="text-[13.5px] font-semibold tracking-tight">CollabBase</span>
      </div>

      <nav className="flex-1 px-3 pt-4">
        <ul className="space-y-px">{primary.map(renderItem)}</ul>

        <div className="mt-8 mb-2 px-2">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
            Workspace
          </span>
        </div>
        <ul className="space-y-px">{secondary.map(renderItem)}</ul>
      </nav>

      <div className="px-4 py-4 text-[10.5px] tracking-wide text-muted-foreground/60">
        v1.0
      </div>
    </aside>
  );
}
