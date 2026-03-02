import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import EfficiencyCheck from "./pages/EfficiencyCheck";
import AdvancedCheck from "./pages/AdvancedCheck";
import Results from "./pages/Results";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Projekte from "./pages/Projekte";
import ProjectHistory from "./pages/ProjectHistory";
import Einstellungen from "./pages/Einstellungen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    {children}
    <Footer />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/efficiency-check" element={<Layout><EfficiencyCheck /></Layout>} />
            <Route path="/advanced-check" element={<Layout><AdvancedCheck /></Layout>} />
            <Route path="/results" element={<Layout><Results /></Layout>} />
            <Route path="/impressum" element={<Layout><Impressum /></Layout>} />
            <Route path="/datenschutz" element={<Layout><Datenschutz /></Layout>} />
            <Route path="/blog" element={<Layout><Blog /></Layout>} />
            <Route path="/blog/:slug" element={<Layout><BlogArticle /></Layout>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/projekte" element={<Layout><Projekte /></Layout>} />
            <Route path="/projekt/:id/verlauf" element={<Layout><ProjectHistory /></Layout>} />
            <Route path="/einstellungen" element={<Layout><Einstellungen /></Layout>} />
            <Route path="/pricing" element={<Layout><NotFound /></Layout>} />
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
