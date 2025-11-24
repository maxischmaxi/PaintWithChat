import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import Root from "./routes/Root";
import Login from "./routes/Login";
import Dashboard from "./routes/Dashboard";
import Session from "./routes/Session";
import AuthCallback from "./routes/AuthCallback";
import { Toaster } from "./components/ui/sonner";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />}>
            <Route index element={<Dashboard />} />
            <Route path="session/:id" element={<Session />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
