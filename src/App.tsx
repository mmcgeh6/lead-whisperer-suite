
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import LeadsPage from "@/pages/LeadsPage";
import LeadSearchPage from "@/pages/LeadSearchPage";
import CompanyFormPage from "@/pages/CompanyFormPage";
import CompanyDetailPage from "@/pages/CompanyDetailPage";
import ContactFormPage from "@/pages/ContactFormPage";
import ContactDetailPage from "@/pages/ContactDetailPage";
import OutreachPage from "@/pages/OutreachPage";
import EmailTemplatesPage from "@/pages/EmailTemplatesPage";
import EmailComposerPage from "@/pages/EmailComposerPage";
import CallScriptPage from "@/pages/CallScriptPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
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
              path="/leads/search"
              element={
                <ProtectedRoute>
                  <LeadSearchPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/leads/company/new"
              element={
                <ProtectedRoute>
                  <CompanyFormPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/leads/company/:id"
              element={
                <ProtectedRoute>
                  <CompanyDetailPage />
                </ProtectedRoute>
              }
            />
            
            {/* Add additional route to handle /leads/:id -> redirect to /leads/company/:id */}
            <Route
              path="/leads/:id"
              element={
                <ProtectedRoute>
                  <CompanyDetailPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/leads/company/:id/edit"
              element={
                <ProtectedRoute>
                  <CompanyFormPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/leads/contact/new"
              element={
                <ProtectedRoute>
                  <ContactFormPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/leads/contact/:id"
              element={
                <ProtectedRoute>
                  <ContactDetailPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/leads/contact/:id/edit"
              element={
                <ProtectedRoute>
                  <ContactFormPage />
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
              path="/outreach/templates"
              element={
                <ProtectedRoute>
                  <EmailTemplatesPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/outreach/email/:id?"
              element={
                <ProtectedRoute>
                  <EmailComposerPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/outreach/call-script/:id?"
              element={
                <ProtectedRoute>
                  <CallScriptPage />
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
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
