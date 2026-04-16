import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  client_id: string | null;
  status: string;
  due_date: string | null;
  notes: string | null;
  clients?: { name: string } | null;
}

interface Client {
  id: string;
  name: string;
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    invoice_number: "",
    amount: "",
    client_id: "",
    status: "draft",
    due_date: "",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [invRes, cRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("*, clients(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name").eq("user_id", user.id),
    ]);
    if (invRes.data) setInvoices(invRes.data as Invoice[]);
    if (cRes.data) setClients(cRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("invoices")
        .update({
          invoice_number: form.invoice_number,
          amount: amount,
          client_id: form.client_id || null,
          status: form.status,
          due_date: form.due_date || null,
          notes: form.notes || null,
        })
        .eq("id", editingId);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Invoice updated");
    } else {
      const { error } = await supabase.from("invoices").insert({
        user_id: user.id,
        invoice_number: form.invoice_number,
        amount: amount,
        client_id: form.client_id || null,
        status: form.status,
        due_date: form.due_date || null,
        notes: form.notes || null,
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Invoice created");
    }

    setOpen(false);
    setEditingId(null);
    setForm({
      invoice_number: "",
      amount: "",
      client_id: "",
      status: "draft",
      due_date: "",
      notes: "",
    });
    fetchData();
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingId(invoice.id);
    setForm({
      invoice_number: invoice.invoice_number,
      amount: String(invoice.amount),
      client_id: invoice.client_id || "",
      status: invoice.status,
      due_date: invoice.due_date || "",
      notes: invoice.notes || "",
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Invoice deleted");
    setDeleteId(null);
    fetchData();
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingId(null);
      setForm({
        invoice_number: "",
        amount: "",
        client_id: "",
        status: "draft",
        due_date: "",
        notes: "",
      });
    }
  };

  const markPaid = async (
    id: string,
    amount: number,
    clientId: string | null,
  ) => {
    if (!user) return;
    const { error: invErr } = await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", id);
    if (invErr) {
      toast.error(invErr.message);
      return;
    }
    // Sync to income
    await supabase.from("income").insert({
      user_id: user.id,
      description: `Invoice payment`,
      amount,
      date: format(new Date(), "yyyy-MM-dd"),
      status: "paid",
      client_id: clientId,
      invoice_id: id,
    });
    toast.success("Invoice marked as paid & income recorded");
    fetchData();
  };

  const statusColor = (s: string) =>
    s === "paid"
      ? "bg-success/10 text-success"
      : s === "sent"
        ? "bg-info/10 text-info"
        : s === "overdue"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
            Invoices
          </h1>
          <p className="text-muted-foreground text-sm">
            Create, send, and track invoices.
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" /> New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Invoice" : "Create Invoice"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Invoice # *</Label>
                  <Input
                    value={form.invoice_number}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, invoice_number: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, due_date: e.target.value }))
                    }
                  />
                </div>
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update Invoice" : "Create Invoice"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading…
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No invoices yet. Create your first one above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.clients?.name || ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.due_date
                        ? format(new Date(inv.due_date), "MMM d, yyyy")
                        : ""}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      ${Number(inv.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {inv.status !== "paid" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              markPaid(
                                inv.id,
                                Number(inv.amount),
                                inv.client_id,
                              )
                            }
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(inv)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(inv.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot
              be undone.
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
