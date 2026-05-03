import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Leaf, Flame, Zap, Recycle, Trash2, ArrowRight, Loader2, CheckCircle2, Camera, X, ImagePlus } from "lucide-react";
import { useCreateWasteLog, useGetUser, WasteLogCategory } from "@workspace/api-client-react";
import { usePhotoUpload } from "@/hooks/use-photo-upload";
import { useDbUserContext } from "@/contexts/db-user-context";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const logSchema = z.object({
  category: z.nativeEnum(WasteLogCategory),
  weightKg: z.coerce.number().min(0.1, "Weight must be at least 0.1 kg").max(1000, "Weight seems too high"),
  notes: z.string().max(200).optional(),
});

const categories = [
  { id: WasteLogCategory.recyclable, label: "Recyclable", icon: Recycle, color: "bg-blue-500", pts: 10 },
  { id: WasteLogCategory.organic, label: "Organic/Compost", icon: Leaf, color: "bg-green-500", pts: 15 },
  { id: WasteLogCategory.electronic, label: "E-Waste", icon: Zap, color: "bg-purple-500", pts: 50 },
  { id: WasteLogCategory.hazardous, label: "Hazardous", icon: Flame, color: "bg-red-500", pts: 30 },
  { id: WasteLogCategory.general, label: "General Waste", icon: Trash2, color: "bg-gray-500", pts: 2 },
];

export default function LogWaste() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { dbUser } = useDbUserContext();
  const currentUserId = dbUser?.id;
  const [successResult, setSuccessResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createLog = useCreateWasteLog();
  const { data: user } = useGetUser(currentUserId!, { query: { enabled: !!currentUserId, queryKey: ["user", currentUserId] } });
  const { uploadFile, isUploading, progress, uploadedPhoto, error: uploadError, clearPhoto } = usePhotoUpload();

  const form = useForm<z.infer<typeof logSchema>>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      category: undefined,
      weightKg: undefined,
      notes: "",
    },
  });

  const selectedCategory = form.watch("category");
  const weight = form.watch("weightKg");

  const estimatedPoints =
    selectedCategory && weight && !isNaN(weight)
      ? Math.floor(categories.find((c) => c.id === selectedCategory)!.pts * weight)
      : 0;

  const onSubmit = async (data: z.infer<typeof logSchema>) => {
    if (!currentUserId) return;
    try {
      const result = await createLog.mutateAsync({
        data: {
          userId: currentUserId,
          category: data.category as any,
          weightKg: data.weightKg,
          notes: data.notes ?? (uploadedPhoto ? `[Photo attached] ${uploadedPhoto.objectPath}` : undefined),
        },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user", currentUserId] }),
        queryClient.invalidateQueries({ queryKey: ["userStats", currentUserId] }),
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
        queryClient.invalidateQueries({ queryKey: ["platformStats"] }),
        queryClient.invalidateQueries({ queryKey: ["activity"] }),
        queryClient.invalidateQueries({ queryKey: ["wasteLogs", currentUserId] }),
        queryClient.invalidateQueries({ queryKey: ["userAchievements", currentUserId] }),
      ]);
      await queryClient.refetchQueries({ queryKey: ["user", currentUserId], type: "active" });
      await queryClient.refetchQueries({ queryKey: ["userStats", currentUserId], type: "active" });
      setSuccessResult(result);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (successResult) {
    return (
      <div className="max-w-xl mx-auto py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-4xl font-black mb-4 text-primary">Epic Impact!</h1>
        <p className="text-xl text-muted-foreground mb-8">You just made the world a little greener.</p>

        <div className="glass-card w-full p-8 rounded-3xl mb-8 space-y-6">
          <div className="flex justify-between items-center border-b border-border/50 pb-6">
            <span className="text-lg font-bold text-muted-foreground">Points Earned</span>
            <span className="text-4xl font-black text-accent">+{successResult.pointsEarned}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-muted-foreground">New Total</span>
            <span className="text-2xl font-bold">{successResult.newTotalPoints}</span>
          </div>

          {successResult.newAchievements?.length > 0 && (
            <div className="pt-6 border-t border-border/50 text-left">
              <h3 className="font-bold text-lg mb-4">New Achievements Unlocked!</h3>
              <div className="space-y-3">
                {successResult.newAchievements.map((ach: any) => (
                  <div key={ach.id} className="flex items-center gap-3 bg-secondary/50 p-3 rounded-xl border border-secondary">
                    <span className="text-3xl">{ach.icon}</span>
                    <div>
                      <p className="font-bold">{ach.name}</p>
                      <p className="text-sm text-muted-foreground">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setLocation("/")}
            className="px-6 py-3 rounded-xl font-bold bg-secondary hover:bg-secondary/80 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => {
              form.reset();
              setSuccessResult(null);
              clearPhoto();
            }}
            className="px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:scale-105 transition-transform"
          >
            Log Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">Log Impact</h1>
        <p className="text-muted-foreground">Every kilogram counts. Record your waste disposal to earn points.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="glass-card p-6 md:p-8 rounded-3xl space-y-8">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-bold">What did you dispose of?</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = field.value === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => field.onChange(cat.id)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-2xl cursor-pointer border-2 transition-all",
                            isSelected
                              ? "border-primary bg-primary/10 scale-[1.02] shadow-md"
                              : "border-border/50 bg-background/50 hover:border-primary/50 hover:bg-primary/5"
                          )}
                        >
                          <div className={cn("p-3 rounded-xl text-white", cat.color, !isSelected && "opacity-80")}>
                            <Icon size={24} />
                          </div>
                          <span className="font-bold text-sm text-center">{cat.label}</span>
                          <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                            {cat.pts} pts/kg
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="weightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-bold">Weight (kg)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          className="h-14 text-2xl font-bold pl-4 pr-16 rounded-2xl bg-background/50 border-2"
                          placeholder="0.0"
                          {...field}
                          value={field.value ?? ""}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">kg</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-primary/10 rounded-2xl p-4 flex items-center justify-between border border-primary/20">
                <div>
                  <p className="text-sm font-bold text-muted-foreground">Estimated Points</p>
                  <p className="text-3xl font-black text-primary mt-1">{estimatedPoints > 0 ? `+${estimatedPoints}` : "0"}</p>
                </div>
                <div className="bg-primary text-primary-foreground p-3 rounded-xl shadow-lg shadow-primary/20">
                  <Zap size={24} />
                </div>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div>
              <p className="text-lg font-bold mb-3 flex items-center gap-2">
                <Camera size={20} />
                Photo of Waste (optional)
              </p>

              {uploadedPhoto ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-primary/40 bg-background/50">
                  <img
                    src={uploadedPhoto.previewUrl}
                    alt="Waste photo"
                    className="w-full max-h-64 object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Photo uploaded
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all",
                    isUploading
                      ? "border-primary/50 bg-primary/5 pointer-events-none"
                      : "border-border/60 bg-background/30 hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p className="font-bold text-primary">Uploading... {progress}%</p>
                      <div className="w-full bg-border rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={32} className="text-muted-foreground" />
                      <p className="font-bold text-muted-foreground">Tap to add a photo</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WEBP supported</p>
                    </>
                  )}
                </div>
              )}

              {uploadError && (
                <p className="text-sm text-destructive mt-2 font-medium">{uploadError}</p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="rounded-2xl resize-none bg-background/50 border-2"
                      placeholder="Dropped off at the city center recycling drive..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <button
            type="submit"
            disabled={createLog.isPending || isUploading}
            className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/30 disabled:opacity-50 disabled:pointer-events-none"
          >
            {createLog.isPending ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                Log & Earn Points
                <ArrowRight size={24} />
              </>
            )}
          </button>
        </form>
      </Form>
    </div>
  );
}
