import { useAuth } from "@/hooks/auth-context";
import { useInvoices, useClientOptions } from "@/hooks/use-queries";
import { useAddInvoice, useUpdateInvoice, useDeleteInvoice, useMarkInvoicePaid } from "@/hooks/use-mutations";
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
import { Plus, Pencil, Trash2, Download, FilePlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm, Controller, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema } from "@/lib/schemas";
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

type InvoiceForm = z.infer<typeof invoiceSchema>;

interface InvoiceRow {
  id: string;
  invoice_number: string;
  amount: number;
  client_name: string;
  status: string;
  due_date: string | null;
  client_id: string | null;
}

const columnHelper = createColumnHelper<InvoiceRow>();

const emptyInvoiceForm: DefaultValues<InvoiceForm> = {
  invoice_number: "",
  client_id: null,
  status: "draft",
  due_date: null,
  notes: null,
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const { data: invoices, isLoading, error } = useInvoices(user?.id);
  const { data: clients } = useClientOptions(user?.id);
  const addInvoice = useAddInvoice(user?.id);
  const updateInvoice = useUpdateInvoice(user?.id);
  const deleteInvoice = useDeleteInvoice(user?.id);
  const markPaid = useMarkInvoicePaid(user?.id);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: emptyInvoiceForm,
  });

  const openAdd = () => {
    setEditingId(null);
    form.reset(emptyInvoiceForm);
    setOpen(true);
  };

  const openEdit = (inv: InvoiceRow) => {
    setEditingId(inv.id);
    form.reset({
      invoice_number: inv.invoice_number,
      amount: inv.amount,
      client_id: inv.client_id as InvoiceForm["client_id"],
      status: inv.status as InvoiceForm["status"],
      due_date: inv.due_date ?? null,
      notes: null,
    });
    setOpen(true);
  };

  const handleSubmit = async (values: InvoiceForm) => {
    if (!user) return;
    try {
      if (editingId) {
        await updateInvoice.mutateAsync({ id: editingId, ...values });
        toast.success("Invoice updated");
      } else {
        await addInvoice.mutateAsync(values);
        toast.success("Invoice created");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;
    try {
      await deleteInvoice.mutateAsync(deleteId);
      toast.success("Invoice deleted");
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleMarkPaid = async (id: string, amount: number, clientId: string | null) => {
    if (!user) return;
    try {
      await markPaid.mutateAsync({ id, amount, clientId });
      toast.success("Invoice marked as paid & income recorded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mark as paid failed");
    }
  };

  const rows: InvoiceRow[] = (invoices ?? []).map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    amount: Number(inv.amount),
    client_name: (inv as Record<string, unknown>).clients ? ((inv as Record<string, unknown>).clients as Record<string, unknown>)?.name as string ?? "" : "",
    status: inv.status,
    due_date: inv.due_date,
    client_id: inv.client_id,
  }));

  const columns = [
    columnHelper.accessor("invoice_number", { header: "Invoice #" }),
    columnHelper.accessor("client_name", { header: "Client" }),
    columnHelper.accessor("due_date", {
      header: "Due",
      cell: (info) => (info.getValue() ? format(new Date(info.getValue()!), "MMM d, yyyy") : ""),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const s = info.getValue();
        const color =
          s === "paid" ? "bg-success/10 text-success" : s === "sent" ? "bg-info/10 text-info" : s === "overdue" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground";
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{s}</span>;
      },
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
          {info.row.original.status !== "paid" && (
            <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(info.row.original.id, info.row.original.amount, info.row.original.client_id)}>
              Mark Paid
            </Button>
          )}
          <Button variant="ghost" size="sm" aria-label="Edit invoice" onClick={() => openEdit(info.row.original)}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" aria-label="Delete invoice" onClick={() => setDeleteId(info.row.original.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
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

  if (isLoading) return <PageLoader />;
  if (error) {
    return <ErrorCard title="Failed to load invoices" message="Please try refreshing the page." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm">Create and track invoices.</p>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => exportToCsv("invoices", [
              { key: "invoice_number", label: "Invoice #" },
              { key: "client_name", label: "Client" },
              { key: "due_date", label: "Due" },
              { key: "status", label: "Status" },
              { key: "amount", label: "Amount" },
            ], rows)}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          )}
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingId(null); }}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> New Invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Invoice # *</Label>
                    <Input placeholder="e.g. INV-001" {...form.register("invoice_number")} />
                    {form.formState.errors.invoice_number && <p className="text-sm text-destructive">{form.formState.errors.invoice_number.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Amount *</Label>
                    <Input type="number" step="0.01" min="0.01" placeholder="0.00" {...form.register("amount")} />
                    {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <div className="space-y-1.5">
                    <Label>Due Date</Label>
                    <Input type="date" {...form.register("due_date")} />
                  </div>
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
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Input {...form.register("notes")} />
                </div>
                <Button type="submit" className="w-full" disabled={addInvoice.isPending || updateInvoice.isPending}>
                  {editingId ? "Update Invoice" : "Create Invoice"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <EmptyState icon={FilePlus} title="No invoices yet" description="Create your first invoice to start billing clients." actionLabel="New Invoice" onAction={openAdd} />
            ) : (
              <>
                <div className="p-3 border-b">
                  <Input placeholder="Search invoices..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="max-w-sm" />
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
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this invoice? This action cannot be undone.</AlertDialogDescription>
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
