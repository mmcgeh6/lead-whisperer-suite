
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

// Create a new client instance - make sure it's outside of the component
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/leads" 
                  element={
                    <ProtectedRoute>
                      <LeadsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/leads/:id" 
                  element={
                    <ProtectedRoute>
                      <CompanyDetailPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/leads/new" 
                  element={
                    <ProtectedRoute>
                      <CompanyFormPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/leads/edit/:id" 
                  element={
                    <ProtectedRoute>
                      <CompanyFormPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/contacts/new" 
                  element={
                    <ProtectedRoute>
                      <ContactFormPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/contacts/edit/:id" 
                  element={
                    <ProtectedRoute>
                      <ContactFormPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/contacts/:id" 
                  element={
                    <ProtectedRoute>
                      <ContactDetailPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/outreach" 
                  element={
                    <ProtectedRoute>
                      <OutreachPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/outreach/email" 
                  element={
                    <ProtectedRoute>
                      <EmailComposerPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/outreach/call-script" 
                  element={
                    <ProtectedRoute>
                      <CallScriptPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/outreach/templates" 
                  element={
                    <ProtectedRoute>
                      <EmailTemplatesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
