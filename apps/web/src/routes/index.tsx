import { createFileRoute, Navigate } from "@tanstack/react-router";
import { tokenStore } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <Navigate to={tokenStore.get() ? "/dashboard" : "/login"} />;
}
