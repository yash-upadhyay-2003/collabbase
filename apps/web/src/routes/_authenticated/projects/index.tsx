import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, FolderKanban } from "lucide-react";
import { api, type Project } from "@/lib/api";
import { useAuth, isPrivileged } from "@/lib/auth";
import { PageBody, PageHeader, EmptyState } from "@/components/page";
import { CreateProjectModal } from "@/components/create-project-modal";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { user } = useAuth();
  const canCreate = isPrivileged(user?.role);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.listProjects().then((p) => {
      setProjects(p);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <PageHeader
        title="Projects"
        description="All workspaces you have access to."
        actions={
          canCreate && (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-[13px] font-medium text-background hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          )
        }
      />
      <PageBody>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[150px] animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-6 w-6" />}
            title="No projects yet"
            description="Create your first project to start collaborating with your team."
            action={
              canCreate && (
                <button
                  onClick={() => setOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-[13px] font-medium text-background"
                >
                  <Plus className="h-4 w-4" /> New project
                </button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/30"
              >
                <h3 className="text-[14.5px] font-semibold tracking-tight">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{p.description}</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[11.5px] text-muted-foreground">
                    {p.memberCount} {p.memberCount === 1 ? "member" : "members"}
                  </span>
                  <span className="text-[11.5px] text-muted-foreground">{format(new Date(p.createdAt), "MMM d")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageBody>
      <CreateProjectModal
        open={open}
        onOpenChange={setOpen}
        onCreated={(p) => setProjects((prev) => [p, ...prev])}
      />
    </>
  );
}
