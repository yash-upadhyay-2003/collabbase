import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, MoreHorizontal, Plus, Trash2, UserPlus, Pencil } from "lucide-react";
import { api, type Project, type Task, type TaskStatus, type User } from "@/lib/api";
import { useAuth, isPrivileged } from "@/lib/auth";
import { PageBody, EmptyState } from "@/components/page";
import { StatusBadge, PriorityBadge, Avatar, AvatarStack } from "@/components/badges";
import { TaskModal } from "@/components/task-modal";
import { InviteMemberModal } from "@/components/invite-member-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  component: ProjectDetailPage,
});

const FILTERS: { value: "all" | TaskStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    Promise.all([
      api.getProject(projectId),
      api.listTasks(projectId),
      api.listMembers(projectId),
    ]).then(([p, t, m]) => {
      if (cancel) return;
      setProject(p);
      setTasks(t);
      setMembers(m);
      setLoading(false);
    });
    return () => { cancel = true; };
  }, [projectId]);

  const filtered = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)),
    [filter, tasks],
  );

  const isAdmin = isPrivileged(user?.role);
  const canEditTask = (t: Task) => isAdmin || t.assigneeId === user?.id;

  // Build a lookup map from real members for assignee display
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );

  const onSaved = (t: Task) => {
    setTasks((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      if (idx >= 0) {
        // Update existing — replace with backend response as source of truth
        const copy = [...prev];
        copy[idx] = t;
        toast.success("Task updated");
        return copy;
      }
      // New task — prepend
      toast.success("Task created");
      return [t, ...prev];
    });
  };

  const onDelete = async (t: Task) => {
    const ok = await api.deleteTask(projectId, t.id);
    if (!ok) {
      toast.error("Failed to delete task. You may not have permission.");
      return;
    }
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    toast.success("Task deleted");
  };

  const onDeleteProject = async () => {
    if (!confirm("Delete this project and all its tasks?")) return;
    await api.deleteProject(projectId);
    toast.success("Project deleted");
    nav({ to: "/projects" });
  };

  const onInvited = (newMember: User) => {
    setMembers((prev) => [...prev, newMember]);
    toast.success(`${newMember.name} added to project`);
  };

  if (loading) {
    return (
      <PageBody>
        <div className="h-7 w-56 animate-pulse rounded-md bg-card" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded-md bg-card" />
        <div className="mt-10 h-72 animate-pulse rounded-xl border border-border bg-card" />
      </PageBody>
    );
  }
  if (!project) {
    return (
      <PageBody>
        <EmptyState title="Project not found" description="It may have been deleted or you don't have access." />
      </PageBody>
    );
  }

  return (
    <>
      {/* ── Project header ─────────────────────────────────────── */}
      <div className="border-b border-border px-6 pt-6 md:px-10 md:pt-8">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All projects
        </Link>

        <div className="mt-4 flex flex-col gap-4 pb-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-[24px] font-semibold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="mt-1.5 max-w-2xl text-[13.5px] text-muted-foreground">{project.description}</p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <AvatarStack names={members.map((m) => m.name)} />
              <span className="text-[12px] text-muted-foreground">
                {members.length} {members.length === 1 ? "member" : "members"} · created {format(new Date(project.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setInviteOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium hover:bg-accent"
              >
                <UserPlus className="h-4 w-4" /> Invite
              </button>
            )}
            <button
              onClick={() => { setEditing(null); setTaskModalOpen(true); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-[13px] font-medium text-background hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New task
            </button>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-accent">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDeleteProject}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* ── Members strip ──────────────────────────────────────── */}
        {members.length > 0 && (
          <div className="pb-5">
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1"
                >
                  <Avatar name={m.name} size={20} />
                  <span className="text-[12px] font-medium">{m.name}</span>
                  <span className="text-[11px] capitalize text-muted-foreground">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Task list ──────────────────────────────────────────── */}
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-[6px] px-3 py-1 text-[12.5px] font-medium transition-colors ${
                  filter === f.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-[12px] text-muted-foreground">{filtered.length} tasks</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={
              filter === "all" ? "No tasks yet" :
              filter === "todo" ? "No todo tasks" :
              filter === "in_progress" ? "No tasks in progress" :
              "No completed tasks yet"
            }
            description={
              filter === "all" ? "Create the first task to start tracking work in this project." :
              filter === "todo" ? "Tasks with todo status will appear here." :
              filter === "in_progress" ? "Tasks currently being worked on will appear here." :
              "Completed tasks will appear here."
            }
            action={
              filter === "all" ? (
                <button
                  onClick={() => { setEditing(null); setTaskModalOpen(true); }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-[13px] font-medium text-background"
                >
                  <Plus className="h-4 w-4" /> New task
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {filtered.map((t) => {
                const assignee = memberMap.get(t.assigneeId ?? "");
                return (
                  <li key={t.id} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/30">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium">{t.title}</div>
                      {t.description && (
                        <div className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">{t.description}</div>
                      )}
                    </div>
                    <div className="hidden items-center gap-2 md:flex">
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                    {t.dueDate && (
                      <div className="hidden w-20 text-right text-[12px] text-muted-foreground md:block">
                        {format(new Date(t.dueDate), "MMM d")}
                      </div>
                    )}
                    <div className="flex w-8 justify-center">
                      {assignee
                        ? <Avatar name={assignee.name} />
                        : <span className="text-[11px] text-muted-foreground">—</span>
                      }
                    </div>
                    {canEditTask(t) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(t); setTaskModalOpen(true); }}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit task
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(t)}>
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="w-7" />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </PageBody>

      <TaskModal
        open={taskModalOpen}
        onOpenChange={(v) => { setTaskModalOpen(v); if (!v) setEditing(null); }}
        projectId={projectId}
        members={members}
        initial={editing}
        onSaved={onSaved}
      />

      <InviteMemberModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        projectId={projectId}
        onInvited={onInvited}
      />
    </>
  );
}
