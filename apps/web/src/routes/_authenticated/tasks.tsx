import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { api, type Project, type Task, type TaskStatus, type User } from "@/lib/api";
import { useAuth, isPrivileged } from "@/lib/auth";
import { PageBody, PageHeader, EmptyState } from "@/components/page";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { TaskModal } from "@/components/task-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

const FILTERS: { value: "mine" | "all" | TaskStatus; label: string }[] = [
  { value: "mine", label: "My tasks" },
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("mine");

  // Modal state
  const [editing, setEditing] = useState<Task | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  // Members for the project of the task being edited, fetched lazily
  const [modalMembers, setModalMembers] = useState<User[]>([]);

  useEffect(() => {
    Promise.all([api.listTasks(), api.listProjects()]).then(([t, p]) => {
      setTasks(t);
      setProjects(p);
      setLoading(false);
    });
  }, []);

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const filtered = useMemo(() => {
    if (filter === "mine") return tasks.filter((t) => t.assigneeId === user?.id);
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter, user]);

  const isAdmin = isPrivileged(user?.role);
  const canEditTask = (t: Task) => isAdmin || t.assigneeId === user?.id;

  const openEdit = async (t: Task) => {
    // Fetch members for this task's project so the assignee dropdown is populated
    const members = await api.listMembers(t.projectId);
    setModalMembers(members);
    setEditing(t);
    setTaskModalOpen(true);
  };

  const onSaved = (t: Task) => {
    setTasks((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = t;
        toast.success("Task updated");
        return copy;
      }
      toast.success("Task created");
      return [t, ...prev];
    });
  };

  const onDelete = async (t: Task) => {
    const ok = await api.deleteTask(t.projectId, t.id);
    if (!ok) {
      toast.error("Failed to delete task. You may not have permission.");
      return;
    }
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    toast.success("Task deleted");
  };

  return (
    <>
      <PageHeader title="Tasks" description="Everything assigned to you and your team." />
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex flex-wrap rounded-md border border-border bg-card p-0.5">
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

        {loading ? (
          <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={filter === "mine" ? "No tasks assigned to you" : "No tasks"}
            description={
              filter === "mine"
                ? "Tasks assigned to you will appear here."
                : "Nothing here for this view."
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {filtered.map((t) => {
                const proj = projectMap.get(t.projectId);
                return (
                  <li key={t.id} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/30">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium">{t.title}</div>
                      {proj && (
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: proj.id }}
                          className="mt-0.5 inline-block text-[12px] text-muted-foreground hover:text-foreground"
                        >
                          {proj.name}
                        </Link>
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
                    {canEditTask(t) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(t)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit task
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete(t)}
                              >
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

      {editing && (
        <TaskModal
          open={taskModalOpen}
          onOpenChange={(v) => { setTaskModalOpen(v); if (!v) setEditing(null); }}
          projectId={editing.projectId}
          members={modalMembers}
          initial={editing}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
