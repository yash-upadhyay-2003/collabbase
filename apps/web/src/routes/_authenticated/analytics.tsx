import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Task } from "@/lib/api";
import { PageBody, PageHeader } from "@/components/page";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total === 0 ? 0 : (value / total) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
        <div className="h-full bg-foreground transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listTasks().then((t) => { setTasks(t); setLoading(false); });
  }, []);

  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date()).length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

  const byPriority = (["urgent", "high", "medium", "low"] as const).map((p) => ({
    label: p,
    value: tasks.filter((t) => t.priority === p).length,
  }));

  return (
    <>
      <PageHeader title="Analytics" description="Lightweight insights into team progress." />
      <PageBody className="space-y-8">
        {loading ? (
          <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Completion rate", value: `${completionRate}%` },
                { label: "Active tasks", value: inProgress },
                { label: "Overdue", value: overdue },
                { label: "Total tasks", value: total },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-5">
                  <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{s.label}</div>
                  <div className="mt-3 text-[26px] font-semibold tracking-tight tabular-nums">{s.value}</div>
                </div>
              ))}
            </section>

            <section className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-[14px] font-semibold tracking-tight">Status distribution</h3>
                <p className="mt-1 text-[12.5px] text-muted-foreground">Where work currently sits.</p>
                <div className="mt-6 space-y-4">
                  <Bar label="Todo" value={todo} total={total} />
                  <Bar label="In progress" value={inProgress} total={total} />
                  <Bar label="Done" value={done} total={total} />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-[14px] font-semibold tracking-tight">Priority breakdown</h3>
                <p className="mt-1 text-[12.5px] text-muted-foreground">Distribution across priority levels.</p>
                <div className="mt-6 space-y-4">
                  {byPriority.map((b) => (
                    <Bar key={b.label} label={b.label[0].toUpperCase() + b.label.slice(1)} value={b.value} total={total} />
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </PageBody>
    </>
  );
}
