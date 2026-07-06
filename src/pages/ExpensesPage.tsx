import { useAuth } from "@/hooks/auth-context";
import { useExpenses } from "@/hooks/use-queries";
import { useAddExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/use-mutations";
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
import { Plus, Receipt, Pencil, Trash2, Download, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm, Controller, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema } from "@/lib/schemas";
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

type ExpenseForm = z.infer<typeof expenseSchema>;

const categories = ["software", "hardware", "travel", "meals", "office", "marketing", "contractor", "education", "insurance", "other"];

interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

const columnHelper = createColumnHelper<ExpenseRow>();

const emptyExpenseForm: DefaultValues<ExpenseForm> = {
  description: "",
  date: format(new Date(), "yyyy-MM-dd"),
  category: "other",
  notes: null,
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const { data: entries, isLoading, error } = useExpenses(user?.id);
  const addExpense = useAddExpense(user?.id);
  const updateExpense = useUpdateExpense(user?.id);
  const deleteExpense = useDeleteExpense(user?.id);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: emptyExpenseForm,
  });

  const openAdd = () => {
    setEditingId(null);
    form.reset(emptyExpenseForm);
    setOpen(true);
  };

  const openEdit = (entry: ExpenseRow & { notes?: string | null }) => {
    setEditingId(entry.id);
    form.reset({ description: entry.description, amount: entry.amount, date: entry.date, category: entry.category, notes: entry.notes ?? null });
    setOpen(true);
  };

  const handleSubmit = async (values: ExpenseForm) => {
    if (!user) return;
    try {
      if (editingId) {
        await updateExpense.mutateAsync({ id: editingId, ...values });
        toast.success("Expense updated");
      } else {
        await addExpense.mutateAsync(values);
        toast.success("Expense added");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;
    try {
      await deleteExpense.mutateAsync(deleteId);
      toast.success("Expense deleted");
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const rows: ExpenseRow[] = (entries ?? []).map((e) => ({
    id: e.id,
    description: e.description,
    amount: Number(e.amount),
    date: e.date,
    category: e.category,
  }));

  const columns = [
    columnHelper.accessor("description", { header: "Description" }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("date", {
      header: "Date",
      cell: (info) => format(new Date(info.getValue()), "MMM d, yyyy"),
    }),
    columnHelper.accessor("amount", {
      header: "Amount",
      cell: (info) => `$${Number(info.getValue()).toLocaleString()}`,
      meta: { align: "right" } as Record<string, unknown>,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" aria-label="Edit expense" onClick={() => openEdit({ ...info.row.original, notes: (entries ?? []).find((e) => e.id === info.row.original.id)?.notes ?? null })}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Delete expense" onClick={() => setDeleteId(info.row.original.id)}>
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

  const totalExpenses = rows.reduce((s, e) => s + e.amount, 0);

  if (isLoading) return <PageLoader />;
  if (error) {
    return <ErrorCard title="Failed to load expenses" message="Please try refreshing the page." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm">Log and categorize your business expenses.</p>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => exportToCsv("expenses", [
              { key: "description", label: "Description" },
              { key: "category", label: "Category" },
              { key: "date", label: "Date" },
              { key: "amount", label: "Amount" },
            ], rows)}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          )}
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingId(null); }}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Expense" : "Add Expense"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input placeholder="e.g. SaaS subscription" {...form.register("description")} />
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
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes (optional)</Label>
                  <Input {...form.register("notes")} />
                </div>
                <Button type="submit" className="w-full" disabled={addExpense.isPending || updateExpense.isPending}>
                  {editingId ? "Update Expense" : "Add Expense"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Receipt className="w-[18px] h-[18px] text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Expenses</p>
            <p className="text-xl font-serif font-semibold">${totalExpenses.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="No expenses yet" description="Add your first expense to start tracking spending." actionLabel="Add Expense" onAction={openAdd} />
            ) : (
              <>
                <div className="p-3 border-b">
                  <Input placeholder="Search expenses..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="max-w-sm" />
                </div>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((header) => (
                          <TableHead key={header.id} className={(header.column.columnDef.meta as Record<string, unknown>)?.align === "right" ? "text-right" : ""}>
                            {header.isPlaceholder ? null : (
                              <button className="flex items-center gap-1 select-none" onClick={header.column.getToggleSortingHandler()}>
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
                          <TableCell key={cell.id} className={(cell.column.columnDef.meta as Record<string, unknown>)?.align === "right" ? "text-right font-medium tabular-nums" : ""}>
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
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this expense? This action cannot be undone.</AlertDialogDescription>
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
