import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import PageTransition from "./components/PageTransition";
import { useAuth } from "./context/auth-context";

const Achievements = lazy(() => import("./pages/Achievements"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const History = lazy(() => import("./pages/History"));
const Landing = lazy(() => import("./pages/Landing"));
const LogToday = lazy(() => import("./pages/LogToday"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));
const Settings = lazy(() => import("./pages/Settings"));
const Suggestions = lazy(() => import("./pages/Suggestions"));

function LoadingScreen() {
  return <div className="grid min-h-screen place-items-center font-bold text-stone-600">Loading EcoTrack...</div>;
}

function ProtectedShell({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}

function protectedPage(component) {
  return <ProtectedShell>{component}</ProtectedShell>;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
        <Route path="/log" element={protectedPage(<LogToday />)} />
        <Route path="/history" element={protectedPage(<History />)} />
        <Route path="/suggestions" element={protectedPage(<Suggestions />)} />
        <Route path="/achievements" element={protectedPage(<Achievements />)} />
        <Route path="/profile" element={protectedPage(<Profile />)} />
        <Route path="/settings" element={protectedPage(<Settings />)} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
