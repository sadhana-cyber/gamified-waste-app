import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Plus, Trophy, Award, User, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/log", label: "Log Waste", icon: Plus, highlight: true },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/achievements", label: "Achievements", icon: Award },
    { href: "/profile/1", label: "Profile", icon: User }, // Hardcoded user 1 for now
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 font-display font-black text-xl text-primary tracking-tight">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Leaf size={20} strokeWidth={3} />
          </div>
          Ecocycle
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
          ME
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-card shadow-sm sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 font-display font-black text-2xl text-primary tracking-tight hover:opacity-80 transition-opacity">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl">
              <Leaf size={24} strokeWidth={3} />
            </div>
            Ecocycle
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href.split("/")[1]));
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

        <div className="p-6 mt-auto">
          <div className="bg-secondary p-4 rounded-2xl">
            <p className="text-sm font-bold mb-1">Weekly Goal</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-primary h-2 rounded-full w-[65%]"></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">15 / 20 kg recycled</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0 relative overflow-x-hidden">
        <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around p-2 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href.split("/")[1]));
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
