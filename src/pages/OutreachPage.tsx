
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";

const OutreachPage = () => {
  const navigate = useNavigate();
  const { contacts, emailConfig } = useAppContext();
  
  const hasContacts = contacts.length > 0;
  const hasEmailConfig = !!emailConfig;
  
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Outreach</h1>
          <p className="text-gray-500 mt-2">
            Send personalized emails and generate call scripts for your leads.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Outreach</CardTitle>
              <CardDescription>
                Send personalized emails to your contacts using templates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm">
                {hasEmailConfig 
                  ? "Send personalized emails to your contacts using templates and SMTP configuration." 
                  : "Configure your SMTP settings in Settings to send emails."}
              </p>
              <div className="flex space-x-4">
                <Button 
                  onClick={() => navigate("/outreach/email")}
                  disabled={!hasContacts || !hasEmailConfig}
                >
                  Compose Email
                </Button>
                {!hasEmailConfig && (
                  <Button variant="outline" onClick={() => navigate("/settings")}>
                    Configure Email
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Call Script Generation</CardTitle>
              <CardDescription>
                Generate personalized call scripts based on company insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm">
                Create customized call scripts that leverage your gathered insights to have more effective conversations.
              </p>
              <div className="flex space-x-4">
                <Button 
                  onClick={() => navigate("/outreach/call-script")}
                  disabled={!hasContacts}
                >
                  Generate Call Script
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>
              Manage your email templates for outreach campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm">
              Email templates help you maintain consistent messaging across your outreach campaigns.
            </p>
            <div className="flex space-x-4">
              <Button onClick={() => navigate("/outreach/templates")}>
                Manage Templates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OutreachPage;
