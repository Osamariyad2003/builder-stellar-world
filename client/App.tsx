import "./global.css";
import "./lib/firebaseMonitor"; // Initialize Firebase monitoring early

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AdminLayout } from "./components/admin/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import News from "./pages/admin/News";
import Years from "./pages/admin/Years";
import Resources from "./pages/admin/Resources";
import Professors from "./pages/admin/Professors";
import SubjectPage from "./pages/admin/SubjectPage";
import Store from "./pages/admin/Store";
import Orders from "./pages/admin/Orders";
import VideosPage from "./pages/admin/Videos";
import FilesPage from "./pages/admin/Files";
import QuizzesPage from "./pages/admin/Quizzes";
import Settings from "./pages/admin/Settings";
import Maps from "./pages/admin/Maps";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
                <Route path="subjects/:id" element={<SubjectPage />} />
                {/* Redirect old resources routes to years */}
                <Route
                  path="resources"
                  element={<Navigate to="/admin/years" replace />}
                />
                <Route
                  path="resources/*"
                  element={<Navigate to="/admin/years" replace />}
                />
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
                <Route path="store" element={<Store />} />
                <Route path="orders" element={<Orders />} />
                <Route path="videos" element={<VideosPage />} />
                <Route path="files" element={<FilesPage />} />
                <Route path="quizzes" element={<QuizzesPage />} />
                <Route path="maps" element={<Maps />} />
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

const container = document.getElementById("root")! as any;
if ((window as any).__appRoot) {
  (window as any).__appRoot.render(<App />);
} else {
  const root = createRoot(container);
  (window as any).__appRoot = root;
  root.render(<App />);
}
