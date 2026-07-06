import { useAuth } from "@/hooks/auth-context";
import { useProjects, useClientOptions } from "@/hooks/use-queries";
import { useAddProject, useUpdateProject, useDeleteProject } from "@/hooks/use-mutations";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorCard } from "@/components/ErrorCard";
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
import { Plus, FolderKanban, Pencil, Trash2, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "@/lib/schemas";
import type { z } from "zod";
import type { ProjectEntry } from "@/types";
import { useState } from "react";

function projectClientName(project: ProjectEntry): string | null {
  return project.clients?.name ?? null;
}

type ProjectForm = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
  const { user } = useAuth();
  const { data: projects, isLoading, error } = useProjects(user?.id);
  const { data: clients } = useClientOptions(user?.id);
  const addProject = useAddProject(user?.id);
  const updateProject = useUpdateProject(user?.id);
  const deleteProject = useDeleteProject(user?.id);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: null, status: "active", budget: 0, client_id: null },
  });

  const openAdd = () => {
    setEditingId(null);
    form.reset({ name: "", description: null, status: "active", budget: 0, client_id: null });
    setOpen(true);
  };

  const openEdit = (project: NonNullable<typeof projects>[number]) => {
    setEditingId(project.id);
    form.reset({
      name: project.name,
      description: project.description ?? null,
      status: project.status as ProjectForm["status"],
      budget: Number(project.budget) || 0,
      client_id: project.client_id ?? null,
    });
    setOpen(true);
  };

  const handleSubmit = async (values: ProjectForm) => {
    if (!user) return;
    try {
      if (editingId) {
        await updateProject.mutateAsync({ id: editingId, ...values });
        toast.success("Project updated");
      } else {
        await addProject.mutateAsync(values);
        toast.success("Project added");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;
    try {
      await deleteProject.mutateAsync(deleteId);
      toast.success("Project deleted");
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const statusColor = (s: string) =>
    s === "active" ? "bg-success/10 text-success" : s === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground";

  if (isLoading) return <PageLoader />;
  if (error) {
    return <ErrorCard title="Failed to load projects" message="Please try refreshing the page." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">Track projects, budgets, and deliverables.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Project" : "Add Project"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Project Name *</Label>
                <Input placeholder="Project name" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input {...form.register("description")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Budget</Label>
                  <Input type="number" step="0.01" min="0" {...form.register("budget")} />
                  {form.formState.errors.budget && <p className="text-sm text-destructive">{form.formState.errors.budget.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Controller
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>
                        {(clients ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={addProject.isPending || updateProject.isPending}>
                {editingId ? "Update Project" : "Add Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!projects || projects.length === 0 ? (
        <EmptyState icon={FolderPlus} title="No projects yet" description="Add your first project to start tracking work." actionLabel="Add Project" onAction={openAdd} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow relative group">
              <CardContent className="p-5">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="ghost" size="sm" aria-label="Edit project" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" aria-label="Delete project" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-primary" />
                    <p className="font-medium text-sm">{p.name}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>
                {projectClientName(p as ProjectEntry) && (
                  <p className="text-xs text-muted-foreground mb-1">Client: {projectClientName(p as ProjectEntry)}</p>
                )}
                {p.budget != null && Number(p.budget) > 0 && (
                  <p className="text-xs text-muted-foreground">Budget: ${Number(p.budget).toLocaleString()}</p>
                )}
                {p.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this project? This will also remove it from any associated income and invoices.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
