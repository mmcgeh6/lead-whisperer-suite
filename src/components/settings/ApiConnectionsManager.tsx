
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Save } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getAppSettings } from "@/services/apifyService";

// Schema for API Settings form
const apiSettingsSchema = z.object({
  leadProvider: z.string(),
  apolloApiKey: z.string().optional(),
  apifyApolloApiKey: z.string().optional(),
  companyResearchWebhook: z.string().url().optional().or(z.literal("")),
  marketResearchWebhook: z.string().url().optional().or(z.literal("")),
  growthResearchWebhook: z.string().url().optional().or(z.literal("")),
  techResearchWebhook: z.string().url().optional().or(z.literal("")),
});

type ApiSettingsValues = z.infer<typeof apiSettingsSchema>;

export const ApiConnectionsManager = () => {
  const [activeTab, setActiveTab] = useState<string>("lead-apis");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  
  // Initialize form
  const form = useForm<ApiSettingsValues>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      leadProvider: 'apollo',
      apolloApiKey: '',
      apifyApolloApiKey: '',
      companyResearchWebhook: '',
      marketResearchWebhook: '',
      growthResearchWebhook: '',
      techResearchWebhook: '',
    },
  });
  
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getAppSettings();
        
        // Update form with values from Supabase or localStorage
        form.setValue('leadProvider', settings.leadProvider || 'apify-apollo');
        
        if (settings.apolloApiKey) {
          form.setValue('apolloApiKey', settings.apolloApiKey);
        }
        
        if (settings.apifyApolloApiKey) {
          form.setValue('apifyApolloApiKey', settings.apifyApolloApiKey);
        }
        
        if (settings.companyResearchWebhook) {
          form.setValue('companyResearchWebhook', settings.companyResearchWebhook);
        }
        
        if (settings.marketResearchWebhook) {
          form.setValue('marketResearchWebhook', settings.marketResearchWebhook);
        }
        
        if (settings.growthResearchWebhook) {
          form.setValue('growthResearchWebhook', settings.growthResearchWebhook);
        }
        
        if (settings.techResearchWebhook) {
          form.setValue('techResearchWebhook', settings.techResearchWebhook);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast({
          title: "Failed to load settings",
          description: "Could not retrieve API settings. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [form, toast]);
  
  const onSubmit = async (data: ApiSettingsValues) => {
    setIsLoading(true);
    
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 'default', // Use a constant ID to ensure we only have one row
          leadProvider: data.leadProvider,
          apolloApiKey: data.apolloApiKey,
          apifyApolloApiKey: data.apifyApolloApiKey,
          companyResearchWebhook: data.companyResearchWebhook,
          marketResearchWebhook: data.marketResearchWebhook,
          growthResearchWebhook: data.growthResearchWebhook,
          techResearchWebhook: data.techResearchWebhook,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) {
        throw error;
      }
      
      // Also save to localStorage as fallback
      localStorage.setItem('leadProvider', data.leadProvider);
      
      if (data.apolloApiKey) {
        localStorage.setItem('apollioApiKey', data.apolloApiKey);
      }
      
      if (data.apifyApolloApiKey) {
        localStorage.setItem('apifyApolloApiKey', data.apifyApolloApiKey);
      }
      
      if (data.companyResearchWebhook) {
        localStorage.setItem('companyResearchWebhook', data.companyResearchWebhook);
      }
      
      if (data.marketResearchWebhook) {
        localStorage.setItem('marketResearchWebhook', data.marketResearchWebhook);
      }
      
      if (data.growthResearchWebhook) {
        localStorage.setItem('growthResearchWebhook', data.growthResearchWebhook);
      }
      
      if (data.techResearchWebhook) {
        localStorage.setItem('techResearchWebhook', data.techResearchWebhook);
      }
      
      toast({
        title: "API Settings Saved",
        description: "Your API connection settings have been saved to the database.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error Saving Settings",
        description: "Failed to save API settings to the database. Using local storage fallback.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not admin, show access denied message
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Management</CardTitle>
          <CardDescription>
            Configure API keys and credentials for external services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Access denied. Only administrators can access API connection settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Management</CardTitle>
        <CardDescription>
          Configure API keys and credentials for external services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="lead-apis">Lead Scraping APIs</TabsTrigger>
                <TabsTrigger value="research-apis">Research Webhooks</TabsTrigger>
              </TabsList>
              
              <TabsContent value="lead-apis" className="space-y-4">
                <FormField
                  control={form.control}
                  name="leadProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Provider</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lead provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="apollo">Apollo.io (Official API)</SelectItem>
                          <SelectItem value="apify-apollo">Apollo.io via Apify</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select which lead provider API to use for scraping
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                {form.watch('leadProvider') === 'apollo' && (
                  <FormField
                    control={form.control}
                    name="apolloApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apollo.io API Key</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your Apollo.io API key"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter your Apollo.io API key for the official API
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch('leadProvider') === 'apify-apollo' && (
                  <FormField
                    control={form.control}
                    name="apifyApolloApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apify Apollo Scraper API Key</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your Apify API key"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter your Apify API key for the Apollo.io scraper
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="research-apis" className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyResearchWebhook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Competitive Research Webhook</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="Enter webhook URL"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Webhook URL for competitive analysis research
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="marketResearchWebhook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Challenges Webhook</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="Enter webhook URL"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Webhook URL for market challenges research
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="growthResearchWebhook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Growth Opportunities Webhook</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="Enter webhook URL"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Webhook URL for growth opportunities research
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="techResearchWebhook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technology Stack Webhook</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="Enter webhook URL"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Webhook URL for technology stack research
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save API Settings"}
              </Button>
            </div>
          </form>
        </Form>
        
        <div className="mt-6 p-4 bg-muted rounded-md">
          <h4 className="font-medium mb-2">About API Keys and Storage</h4>
          <p className="text-sm text-muted-foreground">
            API keys are now stored in the database and shared across all users. 
            For redundancy, a copy is also kept in your browser's local storage as a fallback.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
