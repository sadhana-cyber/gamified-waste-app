import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Layout } from "@/components/layout";
import { DbUserProvider } from "@/contexts/db-user-context";
import Dashboard from "@/pages/dashboard";
import LogWaste from "@/pages/log-waste";
import Leaderboard from "@/pages/leaderboard";
import Achievements from "@/pages/achievements";
import Profile from "@/pages/profile";
import LandingPage from "@/pages/landing";
import NotFound from "@/pages/not-found";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30
    }
  }
});
const rawClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkPubKey = (typeof window !== "undefined" && rawClerkKey ? publishableKeyFromHost(window.location.hostname, rawClerkKey) || rawClerkKey : rawClerkKey) || "pk_test_ZmVhc2libGUtYnVycm8tMjAuY2xlcmsuYWNjb3VudHMuZGV2JA";
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
function stripBase(path) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}
if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside",
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton"
  },
  variables: {
    colorPrimary: "#16a34a",
    colorForeground: "#111827",
    colorMutedForeground: "#6b7280",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#f9fafb",
    colorInputForeground: "#111827",
    colorNeutral: "#d1fae5",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "0.75rem"
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-black",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700 font-semibold",
    formFieldLabel: "text-gray-700 font-semibold",
    footerActionLink: "text-green-600 font-semibold hover:text-green-700",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-green-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-gray-700",
    logoBox: "flex justify-center mb-2",
    logoImage: "h-12",
    socialButtonsBlockButton: "border border-gray-200 hover:border-green-300 bg-white",
    formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white font-bold",
    formFieldInput: "bg-gray-50 border-gray-200 text-gray-900",
    footerAction: "bg-gray-50",
    dividerLine: "bg-gray-200",
    alert: "bg-red-50 border-red-200",
    otpCodeFieldInput: "border-gray-200 text-gray-900",
    formFieldRow: "",
    main: ""
  }
};
function SignInPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>;
}
function SignUpPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>;
}
function HomeRedirect() {
  return <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>;
}
function ProtectedRoute({ component: Component }) {
  return <>
      <Show when="signed-in">
        <DbUserProvider>
          <Layout>
            <Component />
          </Layout>
        </DbUserProvider>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>;
}
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef(void 0);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== void 0 && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}
function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      signIn: { start: { title: "Welcome back to Ecocycle", subtitle: "Sign in to track your impact" } },
      signUp: { start: { title: "Join Ecocycle", subtitle: "Start earning points for the planet" } }
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
            <Route path="/log" component={() => <ProtectedRoute component={LogWaste} />} />
            <Route path="/leaderboard" component={() => <ProtectedRoute component={Leaderboard} />} />
            <Route path="/achievements" component={() => <ProtectedRoute component={Achievements} />} />
            <Route path="/profile/:id" component={() => <ProtectedRoute component={Profile} />} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>;
}
function App() {
  return <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>;
}
var stdin_default = App;
export {
  stdin_default as default
};
