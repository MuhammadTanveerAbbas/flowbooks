import { Link } from "react-router-dom";
import { FlowBooksLogo } from "@/components/FlowBooksLogo";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 mb-8">
          <FlowBooksLogo size={28} />
          <span className="font-serif font-semibold text-lg">FlowBooks</span>
        </div>

        <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <p>
            FlowBooks ("we", "our", "the Service") respects your privacy. This policy explains what data we collect, why we collect it, and how it is handled.
          </p>

          <h2 className="font-serif font-semibold text-foreground text-lg">1. What We Collect</h2>
          <ul>
            <li><strong>Account data:</strong> Name, email address, and authentication credentials (handled by Supabase Auth).</li>
            <li><strong>Financial data:</strong> Income records, expenses, invoices, client details, and project information you enter.</li>
            <li><strong>Usage data:</strong> Basic analytics (page views, feature usage) if enabled through Vercel Analytics.</li>
          </ul>

          <h2 className="font-serif font-semibold text-foreground text-lg">2. How We Store It</h2>
          <p>
            All data is stored in your Supabase PostgreSQL instance. Row-Level Security ensures only you can access your data. Data is encrypted at rest (AES-256) and in transit (TLS 1.3).
          </p>

          <h2 className="font-serif font-semibold text-foreground text-lg">3. Third-Party Services</h2>
          <ul>
            <li><strong>Supabase</strong> - Database, authentication, and file storage.</li>
            <li><strong>Vercel</strong> - Hosting and serverless functions.</li>
            <li><strong>Google OAuth</strong> - Optional sign-in (if you choose Google login).</li>
          </ul>
          <p>We do not sell your data. We do not share your financial data with third parties for marketing purposes.</p>

          <h2 className="font-serif font-semibold text-foreground text-lg">4. Data Retention</h2>
          <p>
            You retain full ownership of your data. You may delete your account and all associated data at any time through your Settings page. Deletion is immediate and irreversible.
          </p>

          <h2 className="font-serif font-semibold text-foreground text-lg">5. Your Rights</h2>
          <p>
            Depending on your jurisdiction (GDPR, CCPA, etc.), you may have the right to access, correct, or delete your data. Contact us at the email below.
          </p>

          <h2 className="font-serif font-semibold text-foreground text-lg">6. Contact</h2>
          <p>
            For privacy concerns, reach out via the project's GitHub repository at{" "}
            <a href="https://github.com/MuhammadTanveerAbbas/flowbooks" className="text-primary underline">github.com/MuhammadTanveerAbbas/flowbooks</a>.
          </p>

          <div className="border-t border-border pt-4 mt-8">
            <p className="text-xs text-muted-foreground italic">
              This is a boilerplate privacy policy. Review with legal counsel before using in production.
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
