import { useListAchievements, useGetUserAchievements } from "@workspace/api-client-react";
import { Lock, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDbUserContext } from "@/contexts/db-user-context";
const DEFAULT_ACHIEVEMENTS = [
  { id: 1, name: "First Step", description: "Log your first waste recycling entry", icon: "🌱", pointsRequired: 10, category: "starter" },
  { id: 2, name: "Waste Sorter", description: "Earn 50 points by properly segregating waste", icon: "♻️", pointsRequired: 50, category: "recycling" },
  { id: 3, name: "Green Champion", description: "Reach 100 points contributing to a cleaner planet", icon: "🌿", pointsRequired: 100, category: "points" },
  { id: 4, name: "Eco Warrior", description: "Reach 250 points and keep up the momentum", icon: "🛡️", pointsRequired: 250, category: "points" },
  { id: 5, name: "Planet Savior", description: "Reach 500 points with consistent sustainable habits", icon: "🌍", pointsRequired: 500, category: "points" },
  { id: 6, name: "Master of Ecology", description: "Reach 1,000 points and inspire your community", icon: "👑", pointsRequired: 1000, category: "mastery" }
];

function Achievements() {
  const { dbUser } = useDbUserContext();
  const currentUserId = dbUser?.id;
  const { data: allAchievements } = useListAchievements({ query: { queryKey: ["achievements"] } });
  const { data: userAchievements } = useGetUserAchievements(currentUserId, { query: { enabled: !!currentUserId, queryKey: ["userAchievements", currentUserId, "live"] } });
  const achievementsList = (allAchievements && allAchievements.length > 0) ? allAchievements : DEFAULT_ACHIEVEMENTS;
  const userAchList = userAchievements || [];
  const unlockedIds = new Set(userAchList.map((ua) => achId(ua.achievement)));
  function achId(ach) {
    if (typeof ach === "object" && ach !== null && "id" in ach) return ach.id;
    return ach;
  }
  const sortedAchievements = [...achievementsList].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id);
    const bUnlocked = unlockedIds.has(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return a.pointsRequired - b.pointsRequired;
  });
  return <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-center md:text-left">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-2 flex items-center justify-center md:justify-start gap-3">
            <Award className="text-accent" size={40} />
            Achievements
          </h1>
          <p className="text-muted-foreground text-lg">
            {unlockedIds.size} of {achievementsList.length} unlocked
          </p>
        </div>
        
        <div className="bg-card p-4 rounded-2xl border font-bold flex gap-4 justify-center">
          <div className="text-center">
            <div className="text-2xl text-primary">{unlockedIds.size}</div>
            <div className="text-xs text-muted-foreground uppercase">Unlocked</div>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl text-muted-foreground">{achievementsList.length - unlockedIds.size}</div>
            <div className="text-xs text-muted-foreground uppercase">Remaining</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAchievements.map((achievement) => {
    const isUnlocked = unlockedIds.has(achievement.id);
    return <div
      key={achievement.id}
      className={cn(
        "glass-card p-6 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col",
        isUnlocked ? "border-primary/30 bg-primary/5 hover:border-primary shadow-lg shadow-primary/10" : "border-border/50 bg-background/50 opacity-70 grayscale-[0.5]"
      )}
    >
                {!isUnlocked && <div className="absolute top-4 right-4 text-muted-foreground bg-background p-2 rounded-full shadow-sm">
                    <Lock size={16} />
                  </div>}
                
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
                  {isUnlocked ? <div className="text-xs font-bold bg-primary/20 text-primary w-fit px-3 py-1 rounded-full">
                      Unlocked!
                    </div> : <div className="text-xs font-bold bg-muted text-muted-foreground w-fit px-3 py-1 rounded-full">
                      Requires {achievement.pointsRequired} pts
                    </div>}
                </div>
              </div>;
  })}
        </div>
    </div>;
}
export {
  Achievements as default
};
