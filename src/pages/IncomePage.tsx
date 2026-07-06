import { useAuth } from "@/hooks/auth-context";
import { useIncome, useClientOptions } from "@/hooks/use-queries";
import { useAddIncome, useUpdateIncome, useDeleteIncome } from "@/hooks/use-mutations";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorCard } from "@/components/ErrorCard";
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
import { Plus, DollarSign, TrendingUp, Pencil, Trash2, Download, ArrowDownUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm, Controller, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incomeSchema } from "@/lib/schemas";
import type { z } from "zod";
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { exportToCsv } from "@/lib/csv";

type IncomeForm = z.infer<typeof incomeSchema>;

interface IncomeRow {
  id: string;
  description: string;
  amount: number;
  currency: string | null;
  date: string;
  status: string;
  client_name: string;
}

const emptyIncomeForm: DefaultValues<IncomeForm> = {
  description: "",
  date: format(new Date(), "yyyy-MM-dd"),
  status: "pending",
  client_id: null,
};

const columnHelper = createColumnHelper<IncomeRow>();

export default function IncomePage() {
  const { user } = useAuth();
  const { data: entries, isLoading, error } = useIncome(user?.id);
  const { data: clients } = useClientOptions(user?.id);
  const addIncome = useAddIncome(user?.id);
  const updateIncome = useUpdateIncome(user?.id);
  const deleteIncome = useDeleteIncome(user?.id);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const form = useForm<IncomeForm>({
    resolver: zodResolver(incomeSchema),
    defaultValues: emptyIncomeForm,
  });

  const openAdd = () => {
    setEditingId(null);
    form.reset(emptyIncomeForm);
    setOpen(true);
  };

  const openEdit = (entry: IncomeRow) => {
    setEditingId(entry.id);
    form.reset({
      description: entry.description,
      amount: entry.amount,
      date: entry.date,
      status: entry.status as IncomeForm["status"],
      client_id: entry.client_name ? clients?.find((c) => c.name === entry.client_name)?.id ?? null : null,
    });
    setOpen(true);
  };

  const handleSubmit = async (values: IncomeForm) => {
    if (!user) return;
    try {
      if (editingId) {
        await updateIncome.mutateAsync({ id: editingId, ...values });
        toast.success("Income updated");
      } else {
        await addIncome.mutateAsync(values);
        toast.success("Income added");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;
    try {
      await deleteIncome.mutateAsync(deleteId);
      toast.success("Income deleted");
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const rows: IncomeRow[] = (entries ?? []).map((e) => ({
    id: e.id,
    description: e.description,
    amount: Number(e.amount),
    currency: e.currency,
    date: e.date,
    status: e.status,
    client_name: (e as Record<string, unknown>).clients ? ((e as Record<string, unknown>).clients as Record<string, unknown>)?.name as string ?? "" : "",
  }));

  const columns = [
    columnHelper.accessor("description", { header: "Description", enableSorting: true }),
    columnHelper.accessor("client_name", { header: "Client", enableSorting: true }),
    columnHelper.accessor("date", {
      header: "Date",
      enableSorting: true,
      cell: (info) => format(new Date(info.getValue()), "MMM d, yyyy"),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      enableSorting: true,
      cell: (info) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            info.getValue() === "paid"
              ? "bg-success/10 text-success"
              : info.getValue() === "overdue"
                ? "bg-destructive/10 text-destructive"
                : "bg-warning/10 text-warning"
          }`}
        >
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("amount", {
      header: "Amount",
      enableSorting: true,
      cell: (info) => `$${Number(info.getValue()).toLocaleString()}`,
      meta: { align: "right" },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" aria-label="Edit income" onClick={() => openEdit(info.row.original)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Delete income" onClick={() => setDeleteId(info.row.original.id)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const totalIncome = rows.reduce((s, e) => s + e.amount, 0);
  const paidIncome = rows.filter((e) => e.status === "paid").reduce((s, e) => s + e.amount, 0);

  if (isLoading) return <PageLoader />;
  if (error) {
    return <ErrorCard title="Failed to load income" message="Please try refreshing the page." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">Income</h1>
          <p className="text-muted-foreground text-sm">Track invoices and payments from clients.</p>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => exportToCsv("income", [
              { key: "description", label: "Description" },
              { key: "client_name", label: "Client" },
              { key: "date", label: "Date" },
              { key: "status", label: "Status" },
              { key: "amount", label: "Amount" },
            ], rows)}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          )}
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingId(null); }}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1" /> Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Income Entry" : "Add Income Entry"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input placeholder="e.g. Web design project payment" {...form.register("description")} />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Amount</Label>
                    <Input type="number" step="0.01" min="0.01" placeholder="0.00" {...form.register("amount")} />
                    {form.formState.errors.amount && (
                      <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input type="date" {...form.register("date")} />
                    {form.formState.errors.date && (
                      <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Controller
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
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
                </div>
                <Button type="submit" className="w-full" disabled={addIncome.isPending || updateIncome.isPending}>
                  {editingId ? "Update Entry" : "Add Entry"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-[18px] h-[18px] text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Income</p>
              <p className="text-xl font-serif font-semibold">${totalIncome.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-[18px] h-[18px] text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Collected</p>
              <p className="text-xl font-serif font-semibold">${paidIncome.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <EmptyState icon={ArrowDownUp} title="No income entries yet" description="Add your first income entry to start tracking payments." actionLabel="Add Income" onAction={openAdd} />
            ) : (
              <>
                <div className="p-3 border-b">
                  <Input
                    placeholder="Search income..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={header.column.columnDef.meta?.align === "right" ? "text-right" : ""}
                          >
                            {header.isPlaceholder ? null : (
                              <button
                                className="flex items-center gap-1 select-none"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {{ asc: " \u2191", desc: " \u2193" }[header.column.getIsSorted() as string] ?? ""}
                              </button>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cell.column.columnDef.meta?.align === "right" ? "text-right font-medium tabular-nums" : ""}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
