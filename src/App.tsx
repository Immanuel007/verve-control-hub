import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/store/theme";
import { AppProvider } from "@/store/app-store";
import { AppShell } from "@/components/AppShell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Cards from "./pages/Cards";
import Transactions from "./pages/Transactions";
import Bills from "./pages/Bills";
import Settings from "./pages/Settings";
import Withdraw from "./pages/Withdraw";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Home />} />
                <Route path="cards" element={<Cards />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="bills" element={<Bills />} />
                <Route path="settings" element={<Settings />} />
                <Route path="withdraw" element={<Withdraw />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
