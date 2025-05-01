
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailSettings } from "@/components/settings/EmailSettings";
import { ApiConnectionsManager } from "@/components/settings/ApiConnectionsManager";
import { WebhookSettings } from "@/components/settings/WebhookSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const SettingsPage = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500 mt-2">
            Configure your application settings.
          </p>
        </div>
        
        <Tabs defaultValue="email">
          <TabsList>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="api">API Connections</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="mt-6">
            <EmailSettings />
          </TabsContent>
          
          <TabsContent value="api" className="mt-6">
            <ApiConnectionsManager />
          </TabsContent>
          
          <TabsContent value="webhooks" className="mt-6">
            <Alert variant="warning" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Webhook services must be configured to accept requests from your domain or they may fail due to CORS restrictions. 
                If webhooks fail, the application will use sample data for demonstration purposes.
              </AlertDescription>
            </Alert>
            <WebhookSettings />
          </TabsContent>
          
          <TabsContent value="general" className="mt-6">
            <div className="text-center py-12">
              <p className="text-gray-500">General settings coming soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
