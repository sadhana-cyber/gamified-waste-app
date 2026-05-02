import { useParams, Link } from "wouter";
import { useGetUser, useGetUserStats, useGetUserAchievements, useListWasteLogs } from "@workspace/api-client-react";
import { Trophy, Leaf, Flame, Zap, Recycle, Trash2, Calendar, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, React.ElementType> = {
  recyclable: Recycle,
  organic: Leaf,
  hazardous: Flame,
  electronic: Zap,
  general: Trash2,
};

const categoryColors: Record<string, string> = {
  recyclable: "bg-blue-500",
  organic: "bg-green-500",
  hazardous: "bg-red-500",
  electronic: "bg-purple-500",
  general: "bg-gray-500",
};

export default function Profile() {
  const params = useParams();
  const userId = params.id ? parseInt(params.id) : 1;

  const { data: user, isLoading: userLoading } = useGetUser(userId, { query: { enabled: !!userId, queryKey: ['user', userId] } });
  const { data: stats, isLoading: statsLoading } = useGetUserStats(userId, { query: { enabled: !!userId, queryKey: ['userStats', userId] } });
  const { data: achievements, isLoading: achievementsLoading } = useGetUserAchievements(userId, { query: { enabled: !!userId, queryKey: ['userAchievements', userId] } });
  const { data: logs, isLoading: logsLoading } = useListWasteLogs({ userId }, { query: { enabled: !!userId, queryKey: ['wasteLogs', userId] } });

  if (userLoading || statsLoading) {
    return <div className="h-screen flex items-center justify-center font-bold text-muted-foreground">Loading profile...</div>;
  }

  if (!user) {
    return <div className="h-screen flex items-center justify-center font-bold text-destructive">User not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Header */}
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/40 to-accent/40" />
        
        <div className="relative pt-12 flex flex-col md:flex-row gap-8 items-center md:items-end text-center md:text-left">
          <div className="w-32 h-32 rounded-3xl bg-card border-4 border-background shadow-xl flex items-center justify-center text-4xl font-black text-primary">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-black text-foreground mb-2">{user.name}</h1>
            <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
              <Calendar size={16} />
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="text-center px-4 py-2 bg-background/50 rounded-2xl border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase">Level</p>
              <p className="text-3xl font-black text-primary">{user.level}</p>
            </div>
            <div className="text-center px-4 py-2 bg-background/50 rounded-2xl border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase">Streak</p>
              <p className="text-3xl font-black text-orange-500">🔥 {user.streak}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Breakdown */}
        <div className="space-y-8 md:col-span-1">
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={24} />
              Impact Summary
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <span className="font-medium text-muted-foreground">Total Points</span>
                <span className="font-black text-xl">{user.totalPoints}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <span className="font-medium text-muted-foreground">Total Weight</span>
                <span className="font-black text-xl">{stats?.totalWeight || 0} kg</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <span className="font-medium text-muted-foreground">Total Logs</span>
                <span className="font-black text-xl">{stats?.totalLogs || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">CO2 Prevented</span>
                <span className="font-black text-xl text-primary">~{(stats?.totalWeight || 0) * 1.5} kg</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-6">Waste Breakdown</h3>
            
            <div className="space-y-4">
              {stats?.byCategory.map((cat) => {
                const Icon = categoryIcons[cat.category] || Trash2;
                const bgClass = categoryColors[cat.category] || "bg-gray-500";
                
                // Calculate percentage
                const percentage = stats.totalWeight > 0 ? Math.round((cat.weightKg / stats.totalWeight) * 100) : 0;

                return (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <div className="flex items-center gap-2 capitalize">
                        <Icon size={16} className={cn("text-white p-0.5 rounded", bgClass)} />
                        {cat.category}
                      </div>
                      <span>{cat.weightKg} kg</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-1000", bgClass)} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
              
              {(!stats?.byCategory || stats.byCategory.length === 0) && (
                <div className="text-center py-4 text-muted-foreground font-medium">No waste logged yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Achievements & History */}
        <div className="space-y-8 md:col-span-2">
          
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award className="text-accent" size={24} />
                Recent Badges
              </h3>
              <Link href="/achievements" className="text-sm font-bold text-primary hover:underline">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {achievements?.slice(0, 4).map((ua) => {
                // handle case where api returns populated achievement object vs just id reference
                const ach = 'icon' in ua.achievement ? ua.achievement : ua as any; 
                return (
                  <div key={ua.id} className="bg-background/50 border border-border/50 rounded-2xl p-4 flex flex-col items-center text-center gap-2 hover:bg-muted/50 transition-colors">
                    <div className="text-4xl drop-shadow-md">{ach.icon || '🏆'}</div>
                    <div className="font-bold text-sm leading-tight">{ach.name || 'Badge'}</div>
                  </div>
                )
              })}
              
              {(!achievements || achievements.length === 0) && (
                <div className="col-span-full py-8 text-center text-muted-foreground font-medium bg-background/50 rounded-2xl border border-dashed">
                  No badges earned yet. Keep logging!
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
            
            <div className="space-y-4">
              {logs?.slice(0, 5).map((log) => {
                const Icon = categoryIcons[log.category] || Trash2;
                const bgClass = categoryColors[log.category] || "bg-gray-500";
                
                return (
                  <div key={log.id} className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-border/50">
                    <div className={cn("p-3 rounded-xl text-white", bgClass)}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold capitalize text-foreground">{log.category} Waste</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        {new Date(log.createdAt).toLocaleDateString()} {log.notes && `• "${log.notes}"`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-primary">+{log.pointsEarned}</p>
                      <p className="text-xs font-bold text-muted-foreground">{log.weightKg} kg</p>
                    </div>
                  </div>
                );
              })}
              
              {(!logs || logs.length === 0) && (
                <div className="py-12 text-center text-muted-foreground font-medium bg-background/50 rounded-2xl border border-dashed">
                  No activity history found.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
