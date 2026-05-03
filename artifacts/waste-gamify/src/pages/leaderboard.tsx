import { useGetLeaderboard } from "@workspace/api-client-react";
import { Trophy, Medal, Crown } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 100 }, { query: { queryKey: ['leaderboard', 'signed-in'] } });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown size={24} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
      case 2: return <Medal size={24} className="text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />;
      case 3: return <Medal size={24} className="text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" />;
      default: return <span className="font-black text-lg text-muted-foreground w-6 text-center">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/50 scale-[1.02] shadow-xl shadow-yellow-500/10 z-10 relative";
      case 2: return "bg-gradient-to-r from-slate-300/20 to-slate-300/5 border-slate-300/50";
      case 3: return "bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/50";
      default: return "bg-background/50 border-border/50 hover:bg-muted/50";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-center md:text-left">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-2 flex items-center justify-center md:justify-start gap-3">
            <Trophy className="text-primary" size={40} />
            Global Rankings
          </h1>
          <p className="text-muted-foreground text-lg">See who's making the biggest impact.</p>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-4 md:p-8">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading leaderboard...
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard?.map((entry) => (
              <Link key={entry.userId} href={`/profile/${entry.userId}`}>
                <div className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer",
                  getRankStyle(entry.rank)
                )}>
                  <div className="flex items-center justify-center w-10">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
                    {entry.name.substring(0, 2).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">{entry.name}</p>
                    <div className="flex gap-3 text-xs md:text-sm text-muted-foreground font-medium">
                      <span>Lvl {entry.level}</span>
                      <span className="hidden md:inline">•</span>
                      <span className="hidden md:inline">🔥 {entry.streak} day streak</span>
                      <span className="hidden md:inline">•</span>
                      <span className="hidden md:inline">📦 {entry.totalLogs} logs</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black text-primary">{entry.totalPoints.toLocaleString()}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase">PTS</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
