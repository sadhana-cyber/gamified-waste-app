import { Link } from "wouter";
import { Leaf, Trophy, Camera, Zap, Recycle, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 font-black text-2xl text-green-600">
          <div className="bg-green-600 text-white p-1.5 rounded-lg">
            <Leaf size={22} strokeWidth={3} />
          </div>
          Ecocycle
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in">
            <button className="px-5 py-2 rounded-xl font-bold text-green-700 hover:bg-green-100 transition-colors">
              Sign In
            </button>
          </Link>
          <Link href="/sign-up">
            <button className="px-5 py-2 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md shadow-green-600/20">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-3xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full font-bold text-sm mb-6">
          <Zap size={14} />
          Turn waste into points
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
          Make recycling<br />
          <span className="text-green-600">feel like a game</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-lg">
          Log your waste, upload photos, earn points, and compete on the global leaderboard. Every kilogram counts.
        </p>
        <Link href="/sign-up">
          <button className="px-10 py-4 rounded-2xl font-black text-xl bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-green-600/30">
            Start Earning Points
          </button>
        </Link>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
          {[
            { icon: Camera, text: "Photo verification" },
            { icon: Trophy, text: "Live leaderboard" },
            { icon: Recycle, text: "5 waste categories" },
            { icon: Users, text: "Community impact" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 bg-white border border-green-100 px-4 py-2 rounded-full text-sm font-semibold text-gray-600 shadow-sm">
              <Icon size={14} className="text-green-500" />
              {text}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
