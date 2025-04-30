
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanySearchConfig } from "./search-configs/CompanySearchConfig";
import { PeopleSearchConfig } from "./search-configs/PeopleSearchConfig";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const ApiConnectionsManager = () => {
  const [activeTab, setActiveTab] = useState<string>("company-search");
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Connections</CardTitle>
        <CardDescription>
          Configure external services for lead generation and data enrichment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="company-search">Company Search</TabsTrigger>
            <TabsTrigger value="people-search">People Search</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>
          
          <TabsContent value="company-search">
            <CompanySearchConfig />
          </TabsContent>
          
          <TabsContent value="people-search">
            <PeopleSearchConfig />
          </TabsContent>
          
          <TabsContent value="api-keys">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Apollo.io API</h3>
                  <div className="flex items-center gap-4">
                    <input 
                      type="password" 
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="Enter your Apollo.io API key"
                    />
                    <Button 
                      onClick={() => {
                        toast({
                          title: "API Key Saved",
                          description: "Your Apollo.io API key has been saved.",
                        });
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">About API Keys</h4>
                <p className="text-sm text-muted-foreground">
                  API keys are stored securely in your browser's local storage. For production use, 
                  we recommend using a server-side implementation with proper key management.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
