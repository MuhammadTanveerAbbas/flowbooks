import { Link } from "react-router-dom";
import { FlowBooksLogo } from "@/components/FlowBooksLogo";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 mb-8">
          <FlowBooksLogo size={28} />
          <span className="font-serif font-semibold text-lg">FlowBooks</span>
        </div>

        <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <h2 className="font-serif font-semibold text-foreground text-lg">1. Acceptance</h2>
          <p>
            By using FlowBooks ("the Service"), you agree to these terms. If you do not agree, do not use the Service.
          </p>

          <h2 className="font-serif font-semibold text-foreground text-lg">2. Description</h2>
          <p>
            FlowBooks is a freelance finance toolkit that helps independent contractors track income, expenses, invoices, and tax estimates. The Service is provided "as is" and is not a substitute for professional accounting or legal advice.
          </p>

          <h2 className="font-serif font-semibold text-foreground text-lg">3. Account Responsibilities</h2>
          <ul>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You are responsible for the accuracy of all financial data you enter.</li>
            <li>You must be at least 18 years old to use the Service.</li>
          </ul>

          <h2 className="font-serif font-semibold text-foreground text-lg">4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for illegal purposes.</li>
            <li>Attempt to access another user's data.</li>
            <li>Submit malicious payloads or attempt to compromise the Service.</li>
            <li>Use automated scripts to scrape or overload the Service.</li>
          </ul>

          <h2 className="font-serif font-semibold text-foreground text-lg">5. Data Ownership</h2>
          <p>
            You retain full ownership of all data you enter. We claim no intellectual property rights over your financial data.
          </p>

          <h2 className="font-serif font-semibold text-foreground text-lg">6. Limitation of Liability</h2>
          <p>
            FlowBooks is provided "as is" without warranty of any kind. We are not liable for any financial losses, data inaccuracies, or damages arising from use of the Service. Tax estimates are approximations and should be verified with a qualified professional.
          </p>

          <h2 className="font-serif font-semibold text-foreground text-lg">7. Termination</h2>
          <p>
            You may delete your account at any time. We reserve the right to suspend or terminate access for violation of these terms.
          </p>

          <h2 className="font-serif font-semibold text-foreground text-lg">8. Changes</h2>
          <p>
            We may update these terms at any time. Continued use after changes constitutes acceptance of the new terms.
          </p>

          <div className="border-t border-border pt-4 mt-8">
            <p className="text-xs text-muted-foreground italic">
              This is a boilerplate terms of service. Review with legal counsel before using in production.
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
