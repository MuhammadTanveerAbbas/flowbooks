import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowDownUp,
  Receipt,
  Users,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/income", label: "Income", icon: ArrowDownUp },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/settings", label: "More", icon: Settings },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-1 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {mobileItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-colors min-w-[48px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.6} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
