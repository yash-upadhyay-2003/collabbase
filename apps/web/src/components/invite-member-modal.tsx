import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, type User } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function InviteMemberModal({
  open,
  onOpenChange,
  projectId,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  onInvited: (member: User) => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const member = await api.addMember(projectId, email.trim().toLowerCase());
    setLoading(false);
    if (!member) {
      setError("No account found with that email, or they are already a member.");
      return;
    }
    setEmail("");
    onInvited(member);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setEmail(""); setError(null); } }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Add a CollabBase user to this project by their email address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-1">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
              Email address
            </label>
            <input
              required
              autoFocus
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="colleague@example.com"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] outline-none focus:border-foreground/40"
            />
            {error && (
              <p className="mt-1.5 text-[12px] text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-[13px] font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add member
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
