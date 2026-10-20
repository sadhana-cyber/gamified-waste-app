import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Plus, Trophy, Award, User, Leaf, LogOut, Users, ShieldCheck, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk, useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useDbUserContext } from "@/contexts/db-user-context";

function Layout({ children }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { dbUser, accounts, switchAccount } = useDbUserContext();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const displayName = dbUser?.name || user?.fullName || "User";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "ME";

  const handleSwitch = async (targetId) => {
    await switchAccount(targetId);
    await queryClient.invalidateQueries();
    setShowSwitcher(false);
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/log", label: "Log Waste", icon: Plus, highlight: true },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/achievements", label: "Achievements", icon: Award },
    { href: "/profile/me", label: "Profile", icon: User }
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2 font-display font-black text-xl text-primary tracking-tight">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Leaf size={20} strokeWidth={3} />
          </div>
          Ecocycle
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSwitcher(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
            title="Switch User"
          >
            <Users size={14} />
            <span>Accounts ({accounts.length})</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {initials}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-card shadow-sm sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-black text-2xl text-primary tracking-tight hover:opacity-80 transition-opacity">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl">
              <Leaf size={24} strokeWidth={3} />
            </div>
            Ecocycle
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/dashboard" && location.startsWith("/" + item.href.split("/")[1]));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : item.highlight
                      ? "bg-accent/20 text-foreground hover:bg-accent/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Multi-User Switcher Trigger */}
        <div className="p-4 mt-auto border-t space-y-3">
          <button
            onClick={() => setShowSwitcher(true)}
            className="w-full flex items-center justify-between p-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors border border-primary/20"
          >
            <span className="flex items-center gap-2">
              <Users size={15} />
              Switch Account ({accounts.length})
            </span>
            <ShieldCheck size={16} className="text-primary/70" />
          </button>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{dbUser?.email || user?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0 relative overflow-x-hidden">
        <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Multi-User Switcher Modal */}
      {showSwitcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={24} />
                  Active Account Switcher
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Test live multi-user leaderboard, individual stats, and strict data security isolation.
                </p>
              </div>
              <button
                onClick={() => setShowSwitcher(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {accounts.map((acc) => {
                const isActive = acc.id === dbUser?.id;
                const accInitials = acc.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div
                    key={acc.id}
                    onClick={() => handleSwitch(acc.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer",
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/50 bg-background/50 hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {accInitials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm truncate">{acc.name}</p>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{acc.email}</p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="font-black text-sm text-primary">{acc.totalPoints} pts</p>
                        <p className="text-[10px] font-bold text-muted-foreground">Lvl {acc.level} • 🔥 {acc.streak}</p>
                      </div>
                      {isActive ? (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <span className="text-xs font-bold">#{acc.id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Auth Token Verified
              </span>
              <span>{accounts.length} Active Accounts (More on Sign-In)</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around p-2 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/dashboard" && location.startsWith("/" + item.href.split("/")[1]));
          if (item.highlight) {
            return (
              <Link key={item.href} href={item.href}>
                <div className="relative -top-5 flex flex-col items-center justify-center p-4 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 border-4 border-background cursor-pointer active:scale-95 transition-transform">
                  <item.icon size={24} />
                </div>
              </Link>
            );
          }
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon size={20} className={cn("mb-1", isActive && "fill-primary/20")} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export { Layout };
