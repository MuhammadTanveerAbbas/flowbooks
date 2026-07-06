import { useAuth } from "@/hooks/auth-context";
import { useClients } from "@/hooks/use-queries";
import { useAddClient, useUpdateClient, useDeleteClient } from "@/hooks/use-mutations";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Users, Mail, Phone, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema } from "@/lib/schemas";
import type { z } from "zod";
import { useState } from "react";

type ClientForm = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const { user } = useAuth();
  const { data: clients, isLoading, error } = useClients(user?.id);
  const addClient = useAddClient(user?.id);
  const updateClient = useUpdateClient(user?.id);
  const deleteClient = useDeleteClient(user?.id);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", email: null, company: null, phone: null, notes: null },
  });

  const openAdd = () => {
    setEditingId(null);
    form.reset({ name: "", email: null, company: null, phone: null, notes: null });
    setOpen(true);
  };

  const openEdit = (client: NonNullable<typeof clients>[number]) => {
    setEditingId(client.id);
    form.reset({
      name: client.name,
      email: client.email ?? null,
      company: client.company ?? null,
      phone: client.phone ?? null,
      notes: client.notes ?? null,
    });
    setOpen(true);
  };

  const handleSubmit = async (values: ClientForm) => {
    if (!user) return;
    try {
      if (editingId) {
        await updateClient.mutateAsync({ id: editingId, ...values });
        toast.success("Client updated");
      } else {
        await addClient.mutateAsync(values);
        toast.success("Client added");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;
    try {
      await deleteClient.mutateAsync(deleteId);
      toast.success("Client deleted");
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (isLoading) return <PageLoader />;
  if (error) {
    return <ErrorCard title="Failed to load clients" message="Please try refreshing the page." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm">Manage your client relationships.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Client" : "Add Client"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input placeholder="Client name" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" {...form.register("email")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input {...form.register("phone")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input {...form.register("company")} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input {...form.register("notes")} />
              </div>
              <Button type="submit" className="w-full" disabled={addClient.isPending || updateClient.isPending}>
                {editingId ? "Update Client" : "Add Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!clients || clients.length === 0 ? (
        <EmptyState icon={UserPlus} title="No clients yet" description="Add your first client to start tracking relationships." actionLabel="Add Client" onAction={openAdd} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow relative group">
              <CardContent className="p-5">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="ghost" size="sm" aria-label="Edit client" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" aria-label="Delete client" onClick={() => setDeleteId(c.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {c.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" /> {c.email}
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" /> {c.phone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This will also remove them from any associated income, projects, and invoices.
            </AlertDialogDescription>
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
