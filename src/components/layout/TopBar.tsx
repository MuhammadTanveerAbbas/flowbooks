import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Settings, CreditCard } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlowBooksLogo } from "@/components/FlowBooksLogo";

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function TopBar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const now = new Date();
  const initial = user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 md:hidden">
        <FlowBooksLogo size={28} />
        <span className="font-serif font-semibold text-foreground text-base">FlowBooks</span>
      </div>
      <div className="hidden md:block">
        <span className="text-sm text-muted-foreground">{monthNames[now.getMonth()]} {now.getFullYear()}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm flex items-center justify-center hover:bg-primary/20 transition-colors">
            {initial}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="w-4 h-4 mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <CreditCard className="w-4 h-4 mr-2" /> Billing
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={async () => { await signOut(); navigate("/login"); }}>
            <LogOut className="w-4 h-4 mr-2" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
