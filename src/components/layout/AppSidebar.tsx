import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowDownUp,
  Receipt,
  Users,
  FolderKanban,
  Calculator,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { FlowBooksLogo } from "@/components/FlowBooksLogo";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/income", label: "Income", icon: ArrowDownUp },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tax", label: "Tax", icon: Calculator },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[220px]"
      )}
    >
      {/* Logo area */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border">
        <FlowBooksLogo size={32} className="shrink-0" />
        {!collapsed && (
          <span className="font-serif font-semibold text-sidebar-foreground text-lg tracking-tight">
            FlowBooks
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors w-full"
        >
          <ChevronLeft
            className={cn("w-[18px] h-[18px] shrink-0 transition-transform", collapsed && "rotate-180")}
            strokeWidth={1.8}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
