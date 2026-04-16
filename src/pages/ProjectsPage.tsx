import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, FolderKanban, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  budget: number;
  client_id: string | null;
  clients?: { name: string } | null;
}

interface Client {
  id: string;
  name: string;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    budget: "",
    client_id: "",
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [pRes, cRes] = await Promise.all([
      supabase
        .from("projects")
        .select("*, clients(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name").eq("user_id", user.id),
    ]);
    if (pRes.data) setProjects(pRes.data as Project[]);
    if (cRes.data) setClients(cRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const budget = form.budget ? parseFloat(form.budget) : 0;
    if (form.budget && (isNaN(budget) || budget < 0)) {
      toast.error("Please enter a valid budget");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("projects")
        .update({
          name: form.name,
          description: form.description || null,
          status: form.status,
          budget: budget,
          client_id: form.client_id || null,
        })
        .eq("id", editingId);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Project updated");
    } else {
      const { error } = await supabase.from("projects").insert({
        user_id: user.id,
        name: form.name,
        description: form.description || null,
        status: form.status,
        budget: budget,
        client_id: form.client_id || null,
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Project added");
    }

    setOpen(false);
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      status: "active",
      budget: "",
      client_id: "",
    });
    fetchData();
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setForm({
      name: project.name,
      description: project.description || "",
      status: project.status,
      budget: project.budget > 0 ? String(project.budget) : "",
      client_id: project.client_id || "",
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Project deleted");
    setDeleteId(null);
    fetchData();
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingId(null);
      setForm({
        name: "",
        description: "",
        status: "active",
        budget: "",
        client_id: "",
      });
    }
  };

  const statusColor = (s: string) =>
    s === "active"
      ? "bg-success/10 text-success"
      : s === "completed"
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
            Projects
          </h1>
          <p className="text-muted-foreground text-sm">
            Track projects, budgets, and deliverables.
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" /> Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Project" : "Add Project"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Project Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Budget</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.budget}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, budget: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select
                  value={form.client_id}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, client_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update Project" : "Add Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          Loading…
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground text-sm">
            No projects yet. Add your first project above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Card
              key={p.id}
              className="hover:shadow-md transition-shadow relative group"
            >
              <CardContent className="p-5">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(p)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-primary" />
                    <p className="font-medium text-sm">{p.name}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}
                  >
                    {p.status}
                  </span>
                </div>
                {p.clients?.name && (
                  <p className="text-xs text-muted-foreground mb-1">
                    Client: {p.clients.name}
                  </p>
                )}
                {p.budget > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Budget: ${Number(p.budget).toLocaleString()}
                  </p>
                )}
                {p.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {p.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This will also
              remove it from any associated income and invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
