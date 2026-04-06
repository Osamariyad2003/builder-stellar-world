import "./global.css";
// Defer Firebase monitor so it doesn't block or break initial render
import("./lib/firebaseMonitor").catch(() => {});

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AdminLayout } from "./components/admin/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import News from "./pages/admin/News";
import Years from "./pages/admin/Years";
import YearPage from "./pages/admin/YearPage";
import Books from "./pages/admin/Books";
import Resources from "./pages/admin/Resources";
import LectureResourcesPage from "./pages/admin/LectureResourcesPage";
import Professors from "./pages/admin/Professors";
import Users from "./pages/admin/Users";
import SubjectPage from "./pages/admin/SubjectPage";
import Store from "./pages/admin/Store";
import Orders from "./pages/admin/Orders";
import VideosPage from "./pages/admin/Videos";
import FilesPage from "./pages/admin/Files";
import QuizzesPage from "./pages/admin/Quizzes";
import FlashcardsPage from "./pages/admin/Flashcards";
import Settings from "./pages/admin/Settings";
import Maps from "./pages/admin/Maps";
import Research from "./pages/admin/Research";
import Notifications from "./pages/admin/Notifications";
import MCQ from "./pages/admin/MCQ";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - cache persists for 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="news" element={<News />} />
                <Route path="years" element={<Years />} />
                <Route path="years/:id" element={<YearPage />} />
                <Route path="books" element={<Books />} />
                <Route path="subjects/:id" element={<SubjectPage />} />
                <Route path="resources/lectures/:lectureId" element={<LectureResourcesPage />} />
                <Route path="resources" element={<Resources />} />
                {/* Handle legacy uppercase route /admin/VIDEOS */}
                <Route
                  path="VIDEOS"
                  element={<Navigate to="/admin/years" replace />}
                />
                <Route
                  path="VIDEOS/*"
                  element={<Navigate to="/admin/years" replace />}
                />
                <Route path="professors" element={<Professors />} />
                <Route path="users" element={<Users />} />
                <Route path="store" element={<Store />} />
                <Route path="orders" element={<Orders />} />
                <Route path="videos" element={<VideosPage />} />
                <Route path="files" element={<FilesPage />} />
                <Route path="quizzes" element={<QuizzesPage />} />
                <Route path="flashcards" element={<FlashcardsPage />} />
                <Route path="research" element={<Research />} />
                <Route path="maps" element={<Maps />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="mcq" element={<MCQ />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="/" element={<Navigate to="/admin" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

const container = document.getElementById("root");
if (!container) {
  document.body.innerHTML = "<div style='padding:20px;font-family:system-ui;'>Error: root element not found.</div>";
} else {
  try {
    if ((window as any).__appRoot) {
      (window as any).__appRoot.render(<App />);
    } else {
      const root = createRoot(container);
      (window as any).__appRoot = root;
      root.render(<App />);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    container.innerHTML =
      "<div style='padding:20px;font-family:system-ui;max-width:600px;'><h2>App failed to load</h2><p style='color:#666'>" +
      msg.replace(/</g, "&lt;") +
      "</p><p style='margin-top:12px'><button onclick='location.reload()'>Reload</button></p></div>";
    console.error("App bootstrap error:", err);
  }
}
