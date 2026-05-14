import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { api, type Project } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageBody, PageHeader } from "@/components/page";
import { format, formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  hint,
  loading,
  emphasis = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  loading: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
        {label}
      </span>
      <div
        className={
          (emphasis ? "text-[34px] md:text-[38px]" : "text-[26px] md:text-[28px]") +
          " font-semibold tracking-[-0.03em] leading-none tabular-nums"
        }
      >
        {loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-accent/60" /> : value}
      </div>
      {hint && <div className="text-[11.5px] text-muted-foreground/70">{hint}</div>}
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<{
    total: number;
    inProgress: number;
    done: number;
    overdue: number;
  } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const [s, p] = await Promise.all([api.dashboardSummary(), api.listProjects()]);
      if (cancel) return;
      setSummary(s);
      setProjects(p);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, []);

  const recentProjects = [...projects]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <>
      <PageHeader
        title={`${greeting}${user ? `, ${user.name.split(" ")[0]}` : ""}`}
        description={format(new Date(), "EEEE, MMMM d")}
      />
      <PageBody className="space-y-16 md:space-y-20">
        <motion.section
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 gap-y-10 border-t border-border/60 pt-10 md:grid-cols-12 md:gap-x-12"
        >
          <div className="md:col-span-5 md:border-r md:border-border/60 md:pr-12">
            <StatCard label="Total tasks" value={summary?.total ?? 0} hint="Across all active projects" loading={loading} emphasis />
          </div>
          <div className="grid grid-cols-3 gap-x-8 gap-y-8 md:col-span-7">
            <StatCard label="In progress" value={summary?.inProgress ?? 0} hint="Currently active" loading={loading} />
            <StatCard label="Completed" value={summary?.done ?? 0} hint="Shipped this cycle" loading={loading} />
            <StatCard label="Overdue" value={summary?.overdue ?? 0} hint="Need attention" loading={loading} />
          </div>
        </motion.section>

        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.015em]">Recent projects</h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">Workspaces you've worked in lately.</p>
            </div>
            <Link to="/projects" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[150px] animate-pulse bg-background" />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="rounded-xl border border-border/60 py-16 text-center text-[13px] text-muted-foreground">
              No projects yet.{" "}
              <Link to="/projects" className="underline hover:text-foreground">
                Create your first project.
              </Link>
            </div>
          ) : (
            <div className="grid gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
              {recentProjects.map((p) => (
                <Link
                  key={p.id}
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="group flex flex-col bg-background p-6 transition-colors hover:bg-accent/20"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-[14px] font-semibold tracking-tight">{p.name}</h3>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    {p.description || "No description."}
                  </p>
                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-[11.5px] text-muted-foreground">
                      {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </PageBody>
    </>
  );
}
