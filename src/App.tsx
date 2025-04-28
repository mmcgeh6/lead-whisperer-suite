
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import LeadsPage from "./pages/LeadsPage";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import CompanyFormPage from "./pages/CompanyFormPage";
import ContactFormPage from "./pages/ContactFormPage";
import ContactDetailPage from "./pages/ContactDetailPage";
import OutreachPage from "./pages/OutreachPage";
import EmailComposerPage from "./pages/EmailComposerPage";
import CallScriptPage from "./pages/CallScriptPage";
import EmailTemplatesPage from "./pages/EmailTemplatesPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/leads/:id" element={<CompanyDetailPage />} />
            <Route path="/leads/new" element={<CompanyFormPage />} />
            <Route path="/leads/edit/:id" element={<CompanyFormPage />} />
            <Route path="/contacts/new" element={<ContactFormPage />} />
            <Route path="/contacts/edit/:id" element={<ContactFormPage />} />
            <Route path="/contacts/:id" element={<ContactDetailPage />} />
            <Route path="/outreach" element={<OutreachPage />} />
            <Route path="/outreach/email" element={<EmailComposerPage />} />
            <Route path="/outreach/call-script" element={<CallScriptPage />} />
            <Route path="/outreach/templates" element={<EmailTemplatesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
