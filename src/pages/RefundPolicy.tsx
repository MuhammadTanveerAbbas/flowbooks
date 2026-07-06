import { Link } from "react-router-dom";
import { FlowBooksLogo } from "@/components/FlowBooksLogo";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 mb-8">
          <FlowBooksLogo size={28} />
          <span className="font-serif font-semibold text-lg">FlowBooks</span>
        </div>

        <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <h2 className="font-serif font-semibold text-foreground text-lg">Free Service</h2>
          <p>
            FlowBooks is currently provided as a free service. No payment is required to use the application. Therefore, no refund policy is applicable at this time.
          </p>

          <h2 className="font-serif font-semibold text-foreground text-lg">Future Paid Plans</h2>
          <p>
            If paid subscription plans are introduced in the future, this policy will be updated to reflect:
          </p>
          <ul>
            <li>14-day money-back guarantee for annual subscriptions.</li>
            <li>Prorated refunds for cancellations within the billing period.</li>
            <li>No refunds for partial months of service.</li>
          </ul>

          <h2 className="font-serif font-semibold text-foreground text-lg">Contact</h2>
          <p>
            For questions about this policy, reach out via the project's GitHub repository at{" "}
            <a href="https://github.com/MuhammadTanveerAbbas/flowbooks" className="text-primary underline">github.com/MuhammadTanveerAbbas/flowbooks</a>.
          </p>

          <div className="border-t border-border pt-4 mt-8">
            <p className="text-xs text-muted-foreground italic">
              This is a boilerplate refund policy. Review with legal counsel before introducing paid plans.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <Link to="/" className="text-sm text-primary hover:underline">&larr; Back to FlowBooks</Link>
        </div>
      </div>
    </div>
  );
}
