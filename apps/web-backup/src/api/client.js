import { env } from "@/utils/env";
const BASE_URL = env.apiBaseUrl ?? "/api";
async function request(path, init) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json", ...init?.headers },
        ...init,
    });
    if (!res.ok)
        throw new Error(`API error ${res.status}: ${res.statusText}`);
    return res.json();
}
export const apiClient = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: "DELETE" }),
};
