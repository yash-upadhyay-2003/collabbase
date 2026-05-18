// Lightweight API client for CollabBase.
// All data comes from the real FastAPI backend. Mock fallback is preserved
// only for auth edge cases (network down) — never for content data.

const BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  "http://localhost:4000/api/v1";

export type Role = "owner" | "admin" | "member";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor?: string;
}
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  members: User[];
  memberCount: number;
  ownerId: string;
}
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  createdAt: string;
}

const TOKEN_KEY = "cb_token";
export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// ---------- Backend response shapes ----------
interface BackendUser {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}
interface BackendProject {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}
interface BackendTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
interface BackendMember {
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string;
  email: string;
}
interface Paginated<T> { items: T[]; total: number; limit: number; offset: number; }
interface BackendLoginResponse { access_token: string; token_type: string; }
interface BackendDashboard {
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  assigned_tasks: number;
  completion_percentage: number;
}

// ---------- Normalizers ----------
function normalizeUser(u: BackendUser): User {
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: u.is_superuser ? "admin" : "owner",
  };
}

function normalizeProject(p: BackendProject): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? undefined,
    createdAt: p.created_at,
    ownerId: p.created_by ?? "",
    memberCount: p.member_count ?? 0,
    members: [], // full member objects fetched separately via listMembers()
  };
}

function normalizeTask(t: BackendTask): Task {
  return {
    id: t.id,
    projectId: t.project_id,
    title: t.title,
    description: t.description ?? undefined,
    status: t.status.toLowerCase() as TaskStatus,
    priority: t.priority.toLowerCase() as TaskPriority,
    assigneeId: t.assigned_to ?? null,
    dueDate: t.due_date ?? null,
    createdAt: t.created_at,
  };
}

// ---------- Minimal auth-only fallback state ----------
// Only used when the backend is unreachable during login/register.
// Never used for content (projects, tasks, members).
let _fallbackUser: User | null = null;

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 8)}`;
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

async function tryFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const token = tokenStore.get();
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });
    clearTimeout(t);
    if (!res.ok) {
      // Only clear the token on 401 (expired/invalid token).
      // 403 means the token is valid but the user lacks permission — do NOT log them out.
      if (res.status === 401) {
        tokenStore.clear();
      }
      return null;
    }
    if (res.status === 204) return {} as T;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---------- Public API ----------
export const api = {
  async login(email: string, _password: string) {
    await delay();
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: _password }),
    });
    if (!res.ok) {
      throw new Error("Invalid email or password");
    }
    const remote = await res.json() as BackendLoginResponse;
    if (remote?.access_token) {
      tokenStore.set(remote.access_token);
      const me = await tryFetch<BackendUser>("/auth/me");
      if (me) {
        const user = normalizeUser(me);
        _fallbackUser = user;
        return user;
      }
    }
    throw new Error("Unable to retrieve user profile after login");
  },

  async register(name: string, email: string, password: string) {
    await delay();
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: name, email, password }),
    });
    if (!res.ok) {
      try {
        const err = await res.json();
        throw new Error(err.detail || "Registration failed");
      } catch {
        throw new Error("Registration failed");
      }
    }
    const remote = await res.json() as BackendUser;
    if (remote?.id) {
      const loginResp = await tryFetch<BackendLoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (loginResp?.access_token) {
        tokenStore.set(loginResp.access_token);
      }
      const user = normalizeUser(remote);
      _fallbackUser = user;
      return user;
    }
    throw new Error("Registration failed to return a valid user");
  },

  async me() {
    if (!tokenStore.get()) return null;
    const remote = await tryFetch<BackendUser>("/auth/me");
    if (remote?.id) return normalizeUser(remote);
    return _fallbackUser;
  },

  logout() {
    tokenStore.clear();
    _fallbackUser = null;
  },

  async listProjects(): Promise<Project[]> {
    await delay(200);
    const remote = await tryFetch<Paginated<BackendProject>>("/projects");
    if (remote?.items) return remote.items.map(normalizeProject);
    return [];
  },

  async getProject(id: string): Promise<Project | null> {
    await delay(150);
    const remote = await tryFetch<BackendProject>(`/projects/${id}`);
    if (remote?.id) return normalizeProject(remote);
    return null;
  },

  async createProject(input: { name: string; description?: string }): Promise<Project> {
    await delay();
    const remote = await tryFetch<BackendProject>("/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (remote?.id) return normalizeProject(remote);
    throw new Error("Failed to create project");
  },

  async deleteProject(id: string) {
    await delay();
    await tryFetch(`/projects/${id}`, { method: "DELETE" });
  },

  // Without a projectId, fetches all projects then aggregates their tasks.
  // This gives the tasks page real cross-project data without a dedicated endpoint.
  async listTasks(projectId?: string): Promise<Task[]> {
    await delay(180);
    if (projectId) {
      const remote = await tryFetch<Paginated<BackendTask>>(`/projects/${projectId}/tasks`);
      if (remote?.items) return remote.items.map(normalizeTask);
      return [];
    }
    // Cross-project: fetch all projects, then all their tasks in parallel
    const projectsResp = await tryFetch<Paginated<BackendProject>>("/projects");
    if (!projectsResp?.items?.length) return [];
    const taskArrays = await Promise.all(
      projectsResp.items.map((p) =>
        tryFetch<Paginated<BackendTask>>(`/projects/${p.id}/tasks`).then(
          (r) => r?.items?.map(normalizeTask) ?? [],
        ),
      ),
    );
    return taskArrays.flat();
  },

  async createTask(projectId: string, input: Partial<Task> & { title: string }): Promise<Task> {
    await delay();
    const remote = await tryFetch<BackendTask>(`/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        status: input.status?.toUpperCase(),
        priority: input.priority?.toUpperCase(),
        due_date: input.dueDate ?? null,
        assigned_to: input.assigneeId ?? null,
      }),
    });
    if (remote?.id) return normalizeTask(remote);
    throw new Error("Failed to create task");
  },

  async updateTask(projectId: string, taskId: string, patch: Partial<Task>): Promise<Task | null> {
    await delay(150);
    const remote = await tryFetch<BackendTask>(`/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.status !== undefined && { status: patch.status.toUpperCase() }),
        ...(patch.priority !== undefined && { priority: patch.priority.toUpperCase() }),
        ...(patch.dueDate !== undefined && { due_date: patch.dueDate }),
        ...(patch.assigneeId !== undefined && { assigned_to: patch.assigneeId }),
      }),
    });
    if (remote?.id) return normalizeTask(remote);
    return null;
  },

  async deleteTask(projectId: string, taskId: string): Promise<boolean> {
    await delay();
    const result = await tryFetch(`/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
    // tryFetch returns {} (truthy) on 204 success, null on any error
    return result !== null;
  },

  async dashboardSummary() {
    await delay(150);
    const remote = await tryFetch<BackendDashboard>("/dashboard/summary");
    if (remote && remote.total_tasks !== undefined) {
      return {
        total: remote.total_tasks,
        inProgress: remote.in_progress_tasks,
        done: remote.completed_tasks,
        overdue: remote.overdue_tasks,
      };
    }
    return { total: 0, inProgress: 0, done: 0, overdue: 0 };
  },

  async listMembers(projectId: string): Promise<User[]> {
    const remote = await tryFetch<BackendMember[]>(`/projects/${projectId}/members`);
    if (remote) {
      return remote.map((m) => ({
        id: m.user_id,
        name: m.full_name,
        email: m.email,
        role: (m.role.toLowerCase() === "owner"
          ? "owner"
          : m.role.toLowerCase() === "admin"
          ? "admin"
          : "member") as Role,
      }));
    }
    return [];
  },

  async addMember(projectId: string, email: string): Promise<User | null> {
    const remote = await tryFetch<BackendMember>(`/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    if (!remote) return null;
    return {
      id: remote.user_id,
      name: remote.full_name,
      email: remote.email,
      role: "member",
    };
  },

  // Kept for backward compatibility — returns null since there's no global user store
  getUser(_id?: string | null): User | null {
    return null;
  },
};
