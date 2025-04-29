
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Welcome to CRM Pro
        </h1>
        <p className="text-xl max-w-2xl mb-8 text-gray-600">
          Your all-in-one solution for managing leads, contacts, and outreach campaigns.
        </p>
        
        <div className="flex gap-4">
          {user ? (
            <Button size="lg" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button size="lg" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
                Create Account
              </Button>
            </>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl">
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Lead Management</h3>
            <p className="text-gray-600">
              Efficiently organize and track potential clients with our comprehensive lead management system.
            </p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Smart Insights</h3>
            <p className="text-gray-600">
              Gain valuable information about your leads with AI-powered insights and analytics.
            </p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Personalized Outreach</h3>
            <p className="text-gray-600">
              Create tailored emails and call scripts to improve your outreach effectiveness.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
