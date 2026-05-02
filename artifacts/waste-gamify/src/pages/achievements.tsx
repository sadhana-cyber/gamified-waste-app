import { useListAchievements, useGetUserAchievements } from "@workspace/api-client-react";
import { Lock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENT_USER_ID = 1;

export default function Achievements() {
  const { data: allAchievements, isLoading: allLoading } = useListAchievements({ query: { queryKey: ['achievements'] } });
  const { data: userAchievements, isLoading: userLoading } = useGetUserAchievements(CURRENT_USER_ID, { query: { enabled: true, queryKey: ['userAchievements', CURRENT_USER_ID] } });

  const unlockedIds = new Set(userAchievements?.map(ua => achId(ua.achievement)) || []);

  // Helper to handle nested achievement object or id
  function achId(ach: any) {
    if (typeof ach === 'object' && ach !== null && 'id' in ach) return ach.id;
    return ach;
  }

  const sortedAchievements = [...(allAchievements || [])].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id);
    const bUnlocked = unlockedIds.has(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return a.pointsRequired - b.pointsRequired;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-center md:text-left">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-2 flex items-center justify-center md:justify-start gap-3">
            <Award className="text-accent" size={40} />
            Achievements
          </h1>
          <p className="text-muted-foreground text-lg">
            {userAchievements?.length || 0} of {allAchievements?.length || 0} unlocked
          </p>
        </div>
        
        <div className="bg-card p-4 rounded-2xl border font-bold flex gap-4 justify-center">
          <div className="text-center">
            <div className="text-2xl text-primary">{userAchievements?.length || 0}</div>
            <div className="text-xs text-muted-foreground uppercase">Unlocked</div>
          </div>
          <div className="w-px bg-border"></div>
          <div className="text-center">
            <div className="text-2xl text-muted-foreground">{(allAchievements?.length || 0) - (userAchievements?.length || 0)}</div>
            <div className="text-xs text-muted-foreground uppercase">Remaining</div>
          </div>
        </div>
      </div>

      {allLoading || userLoading ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">Loading achievements...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAchievements.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            
            return (
              <div 
                key={achievement.id}
                className={cn(
                  "glass-card p-6 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col",
                  isUnlocked 
                    ? "border-primary/30 bg-primary/5 hover:border-primary shadow-lg shadow-primary/10" 
                    : "border-border/50 bg-background/50 opacity-70 grayscale-[0.5]"
                )}
              >
                {!isUnlocked && (
                  <div className="absolute top-4 right-4 text-muted-foreground bg-background p-2 rounded-full shadow-sm">
                    <Lock size={16} />
                  </div>
                )}
                
                <div className="text-5xl mb-4 drop-shadow-md">
                  {achievement.icon}
                </div>
                
                <h3 className={cn("text-xl font-black mb-2", isUnlocked ? "text-foreground" : "text-muted-foreground")}>
                  {achievement.name}
                </h3>
                
                <p className="text-sm font-medium text-muted-foreground mb-4 flex-1">
                  {achievement.description}
                </p>
                
                <div className="mt-auto">
                  {isUnlocked ? (
                    <div className="text-xs font-bold bg-primary/20 text-primary w-fit px-3 py-1 rounded-full">
                      Unlocked!
                    </div>
                  ) : (
                    <div className="text-xs font-bold bg-muted text-muted-foreground w-fit px-3 py-1 rounded-full">
                      Requires {achievement.pointsRequired} pts
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
