
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Dashboard from "@/pages/Dashboard";
import Index from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import LeadsPage from "@/pages/LeadsPage";
import LeadSearchPage from "@/pages/LeadSearchPage";
import OutreachPage from "@/pages/OutreachPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";
import CompanyDetailPage from "@/pages/CompanyDetailPage";
import CompanyFormPage from "@/pages/CompanyFormPage";
import ContactDetailPage from "@/pages/ContactDetailPage";
import ContactFormPage from "@/pages/ContactFormPage";
import EmailTemplatesPage from "@/pages/EmailTemplatesPage";
import EmailComposerPage from "@/pages/EmailComposerPage";
import CallScriptPage from "@/pages/CallScriptPage";
import UserManagementPage from "@/pages/UserManagementPage";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
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
                path="/leads/company/:id"
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
                path="/contacts/:id"
                element={
                  <ProtectedRoute>
                    <ContactDetailPage />
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
                path="/search"
                element={
                  <ProtectedRoute>
                    <LeadSearchPage />
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
                path="/email-templates"
                element={
                  <ProtectedRoute>
                    <EmailTemplatesPage />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/email-composer/:contactId"
                element={
                  <ProtectedRoute>
                    <EmailComposerPage />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/call-script/:contactId"
                element={
                  <ProtectedRoute>
                    <CallScriptPage />
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
              
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="top-right" />
            <ShadcnToaster />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
