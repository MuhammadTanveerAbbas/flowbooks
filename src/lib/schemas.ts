import { z } from "zod";

const optionalText = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.union([z.string().min(1), z.literal(""), z.null(), z.undefined()]),
  )
  .transform((value) =>
    typeof value === "string" && value.length > 0 ? value : null,
  );

const amountFromForm = z.coerce
  .number({ invalid_type_error: "Enter a valid amount" })
  .finite("Enter a valid amount");

export const incomeSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  amount: amountFromForm.positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["pending", "paid", "overdue"]),
  client_id: optionalText,
});

export const expenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  amount: amountFromForm.positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  category: z.string().trim().min(1, "Category is required"),
  notes: optionalText,
});

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z
    .preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.union([
        z.string().email("Enter a valid email"),
        z.literal(""),
        z.null(),
        z.undefined(),
      ]),
    )
    .transform((value) => (typeof value === "string" && value ? value : null)),
  company: optionalText,
  phone: optionalText,
  notes: optionalText,
});

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  description: optionalText,
  status: z.enum(["active", "completed", "paused"]),
  budget: amountFromForm.min(0, "Budget must be 0 or greater").default(0),
  client_id: optionalText,
});

export const invoiceSchema = z.object({
  invoice_number: z.string().trim().min(1, "Invoice number is required"),
  amount: amountFromForm.positive("Amount must be greater than 0"),
  client_id: optionalText,
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  due_date: optionalText,
  notes: optionalText,
});

export const profileSchema = z.object({
  full_name: optionalText,
  country: z.string().min(1),
  tax_status: z.string().min(1),
  monthly_income_goal: amountFromForm.min(0, "Goal must be 0 or greater"),
  tax_saving_percent: z
    .coerce
    .number()
    .min(0, "Must be between 0 and 100")
    .max(100, "Must be between 0 and 100"),
  currency: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

export const passwordResetSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export const passwordUpdateSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function firstSchemaError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again";
}
