import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Leaf, Flame, Droplets, Zap, Recycle, Trash2, Trophy } from "lucide-react";
import { useUser } from "@clerk/react";
import { useGetPlatformStats, useGetRecentActivity } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useDbUserContext } from "@/contexts/db-user-context";
const categoryIcons = {
  recyclable: Recycle,
  organic: Leaf,
  hazardous: Flame,
  electronic: Zap,
  general: Trash2
};
const categoryColors = {
  recyclable: "bg-blue-500 text-white",
  organic: "bg-green-500 text-white",
  hazardous: "bg-red-500 text-white",
  electronic: "bg-purple-500 text-white",
  general: "bg-gray-500 text-white"
};
function Dashboard() {
  const { user: clerkUser } = useUser();
  const { dbUser, loading: dbUserLoading } = useDbUserContext();
  const { data: platformStats, isLoading: statsLoading } = useGetPlatformStats();
  const { data: recentActivity, isLoading: activityLoading } = useGetRecentActivity({ limit: 5 });
  const userId = dbUser?.id;
  const displayName = dbUser?.name?.trim() || user?.name?.trim() || clerkUser?.fullName?.trim() || clerkUser?.username?.trim() || clerkUser?.firstName?.trim() || "User";
  const [user, setUser] = useState(dbUser);
  const [userLoading, setUserLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  useEffect(() => {
    if (!userId) {
      setUser(dbUser);
      setUserLoading(false);
      setUserStatsLoading(false);
      return;
    }
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    let active = true;
    setUserLoading(true);
    setUserStatsLoading(true);
    Promise.all([
      fetch(`${base}/api/users/${userId}`, { cache: "no-store" }).then((r) => r.ok ? r.json() : null),
      fetch(`${base}/api/users/${userId}/stats`, { cache: "no-store" }).then((r) => r.ok ? r.json() : null)
    ]).then(([userData, statsData]) => {
      if (!active) return;
      setUser(userData || dbUser);
      setUserStats(statsData);
      setUserLoading(false);
      setUserStatsLoading(false);
    }).catch(() => {
      if (!active) return;
      setUser(dbUser);
      setUserLoading(false);
      setUserStatsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId, dbUser]);

  return <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-foreground mb-2">Welcome back, {displayName}!</h1>
          <p className="text-muted-foreground text-lg">Let's make an impact today.</p>
        </div>
        <Link href="/log">
          <button className="bg-primary text-primary-foreground font-bold py-3 px-6 rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30">
            <PlusIcon size={20} />
            Log Waste
          </button>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
    icon={Trophy}
    title="Total Points"
    value={user?.totalPoints ?? dbUser?.totalPoints ?? 0}
    subtitle={`Level ${user?.level ?? dbUser?.level ?? 1}`}
    color="text-yellow-500"
    bg="bg-yellow-500/10"
  />
        <StatCard
    icon={Droplets}
    title="CO2 Saved"
    value={`${((userStats?.totalWeight || 0) * 1.5).toFixed(1)} kg`}
    subtitle="Estimated equivalent"
    color="text-blue-500"
    bg="bg-blue-500/10"
  />
        <StatCard
    icon={Flame}
    title="Current Streak"
    value={`${user?.streak ?? dbUser?.streak ?? 0} days`}
    subtitle="Keep it going!"
    color="text-orange-500"
    bg="bg-orange-500/10"
  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Platform Impact</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ImpactMetric value={platformStats?.totalUsers ?? 0} label="Active Users" />
              <ImpactMetric value={`${platformStats?.totalWeightKg ?? 0} kg`} label="Waste Logged" />
              <ImpactMetric value={`${platformStats?.co2SavedKg ?? 0} kg`} label="CO2 Prevented" />
              <ImpactMetric value={platformStats?.totalLogs ?? 0} label="Total Actions" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Live Activity</h2>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>

          <div className="flex-1 overflow-hidden relative">
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = categoryIcons[activity.category] || Trash2;
                  const colorClass = categoryColors[activity.category] || "bg-gray-500 text-white";
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 bg-background/50 p-3 rounded-2xl border border-border/50"
                    >
                      <div className={cn("p-2 rounded-xl", colorClass)}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          <span className="text-foreground">{activity.userName?.trim() || "User"}</span> logged {activity.category}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.weightKg} kg • +{activity.pointsEarned} pts</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <p className="text-sm font-semibold">No activity yet</p>
                <p className="text-xs mt-1 text-muted-foreground/80">Log your first waste action to see it live here!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>;
}
function StatCard({ icon: Icon, title, value, subtitle, color, bg }) {
  return <div className="glass-card p-6 rounded-3xl flex items-center gap-5">
      <div className={cn("p-4 rounded-2xl", bg, color)}>
        <Icon size={32} />
      </div>
      <div>
        <p className="text-muted-foreground font-medium">{title}</p>
        <p className="text-3xl font-black">{value}</p>
        <p className="text-sm font-medium opacity-80 mt-1">{subtitle}</p>
      </div>
    </div>;
}
function ImpactMetric({ value, label }) {
  return <div className="bg-background/50 p-4 rounded-2xl border border-border/50 text-center">
      <div className="text-2xl md:text-3xl font-black text-primary mb-1">{value}</div>
      <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>;
}
function PlusIcon(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>;
}
export {
  Dashboard as default
};
