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
import { Plus, DollarSign, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface IncomeEntry {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  client_id: string | null;
  clients?: { name: string } | null;
}

interface Client {
  id: string;
  name: string;
}

export default function IncomePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    status: "pending",
    client_id: "",
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [incomeRes, clientsRes] = await Promise.all([
      supabase
        .from("income")
        .select("*, clients(name)")
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
      supabase.from("clients").select("id, name").eq("user_id", user.id),
    ]);
    if (incomeRes.data) setEntries(incomeRes.data as IncomeEntry[]);
    if (clientsRes.data) setClients(clientsRes.data);
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
        .from("income")
        .update({
          description: form.description,
          amount: amount,
          date: form.date,
          status: form.status,
          client_id: form.client_id || null,
        })
        .eq("id", editingId);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Income updated");
    } else {
      const { error } = await supabase.from("income").insert({
        user_id: user.id,
        description: form.description,
        amount: amount,
        date: form.date,
        status: form.status,
        client_id: form.client_id || null,
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Income added");
    }

    setOpen(false);
    setEditingId(null);
    setForm({
      description: "",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      status: "pending",
      client_id: "",
    });
    fetchData();
  };

  const handleEdit = (entry: IncomeEntry) => {
    setEditingId(entry.id);
    setForm({
      description: entry.description,
      amount: String(entry.amount),
      date: entry.date,
      status: entry.status,
      client_id: entry.client_id || "",
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from("income").delete().eq("id", deleteId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Income deleted");
    setDeleteId(null);
    fetchData();
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingId(null);
      setForm({
        description: "",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        status: "pending",
        client_id: "",
      });
    }
  };

  const totalIncome = entries.reduce((s, e) => s + Number(e.amount), 0);
  const paidIncome = entries
    .filter((e) => e.status === "paid")
    .reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
            Income
          </h1>
          <p className="text-muted-foreground text-sm">
            Track invoices and payments from clients.
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" /> Add Income
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Income Entry" : "Add Income Entry"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount</Label>
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
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update Entry" : "Add Entry"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-[18px] h-[18px] text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Income
              </p>
              <p className="text-xl font-serif font-semibold">
                ${totalIncome.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-[18px] h-[18px] text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Collected
              </p>
              <p className="text-xl font-serif font-semibold">
                ${paidIncome.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading…
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No income entries yet. Add your first one above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      {e.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.clients?.name || ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(e.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          e.status === "paid"
                            ? "bg-success/10 text-success"
                            : e.status === "overdue"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/10 text-warning"
                        }`}
                      >
                        {e.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      ${Number(e.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(e)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(e.id)}
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
            <AlertDialogTitle>Delete Income Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income entry? This action
              cannot be undone.
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
