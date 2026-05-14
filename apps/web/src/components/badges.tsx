import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/lib/api";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; cls: string; dot: string }> = {
    todo:        { label: "Todo",        cls: "text-muted-foreground border-border bg-card",      dot: "bg-muted-foreground/60" },
    in_progress: { label: "In progress", cls: "text-foreground border-border bg-card",            dot: "bg-warning" },
    done:        { label: "Done",        cls: "text-muted-foreground border-border bg-card",      dot: "bg-success" },
  };
  const m = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11.5px] font-medium", m.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, string> = {
    low:    "Low",
    medium: "Medium",
    high:   "High",
    urgent: "Urgent",
  };
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-card px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground">
      {map[priority]}
    </span>
  );
}

export function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  const init = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="inline-flex items-center justify-center rounded-full border border-border bg-card text-[10.5px] font-medium text-foreground"
      style={{ height: size, width: size }}
      title={name}
    >
      {init}
    </div>
  );
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((n, i) => (
        <div key={i} className="ring-2 ring-background rounded-full">
          <Avatar name={n} />
        </div>
      ))}
      {extra > 0 && (
        <div className="ring-2 ring-background rounded-full inline-flex h-6 w-6 items-center justify-center bg-card border border-border text-[10.5px] text-muted-foreground">
          +{extra}
        </div>
      )}
    </div>
  );
}
