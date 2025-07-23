import "./global.css";

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
import Professors from "./pages/admin/Professors";
import Store from "./pages/admin/Store";
import Settings from "./pages/admin/Settings";
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
        <BrowserRouter>
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
                {/* Redirect old resources routes to years */}
                <Route
                  path="resources"
                  element={<Navigate to="/admin/years" replace />}
                />
                <Route
                  path="resources/*"
                  element={<Navigate to="/admin/years" replace />}
                />
                <Route path="professors" element={<Professors />} />
                <Route path="store" element={<Store />} />
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

createRoot(document.getElementById("root")!).render(<App />);
