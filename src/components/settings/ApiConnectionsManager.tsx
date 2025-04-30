
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

// Schema for API Settings form
const apiSettingsSchema = z.object({
  leadProvider: z.string(),
  apollioApiKey: z.string().optional(),
  apifyApolloApiKey: z.string().optional(),
  companyResearchWebhook: z.string().url().optional().or(z.literal("")),
  marketResearchWebhook: z.string().url().optional().or(z.literal("")),
  growthResearchWebhook: z.string().url().optional().or(z.literal("")),
  techResearchWebhook: z.string().url().optional().or(z.literal("")),
});

type ApiSettingsValues = z.infer<typeof apiSettingsSchema>;

export const ApiConnectionsManager = () => {
  const [activeTab, setActiveTab] = useState<string>("lead-apis");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.email === 'admin@example.com';
  
  // Initialize form with values from localStorage
  const form = useForm<ApiSettingsValues>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      leadProvider: localStorage.getItem('leadProvider') || 'apollo',
      apollioApiKey: localStorage.getItem('apollioApiKey') || '',
      apifyApolloApiKey: localStorage.getItem('apifyApolloApiKey') || '',
      companyResearchWebhook: localStorage.getItem('companyResearchWebhook') || '',
      marketResearchWebhook: localStorage.getItem('marketResearchWebhook') || '',
      growthResearchWebhook: localStorage.getItem('growthResearchWebhook') || '',
      techResearchWebhook: localStorage.getItem('techResearchWebhook') || '',
    },
  });
  
  useEffect(() => {
    // Load saved values from localStorage
    const leadProvider = localStorage.getItem('leadProvider');
    if (leadProvider) {
      form.setValue('leadProvider', leadProvider);
    }
    
    const apollioApiKey = localStorage.getItem('apollioApiKey');
    if (apollioApiKey) {
      form.setValue('apollioApiKey', apollioApiKey);
    }
    
    const apifyApolloApiKey = localStorage.getItem('apifyApolloApiKey');
    if (apifyApolloApiKey) {
      form.setValue('apifyApolloApiKey', apifyApolloApiKey);
    }
    
    const companyResearchWebhook = localStorage.getItem('companyResearchWebhook');
    if (companyResearchWebhook) {
      form.setValue('companyResearchWebhook', companyResearchWebhook);
    }
    
    const marketResearchWebhook = localStorage.getItem('marketResearchWebhook');
    if (marketResearchWebhook) {
      form.setValue('marketResearchWebhook', marketResearchWebhook);
    }
    
    const growthResearchWebhook = localStorage.getItem('growthResearchWebhook');
    if (growthResearchWebhook) {
      form.setValue('growthResearchWebhook', growthResearchWebhook);
    }
    
    const techResearchWebhook = localStorage.getItem('techResearchWebhook');
    if (techResearchWebhook) {
      form.setValue('techResearchWebhook', techResearchWebhook);
    }
  }, [form]);
  
  const onSubmit = (data: ApiSettingsValues) => {
    // Save all values to localStorage
    localStorage.setItem('leadProvider', data.leadProvider);
    
    if (data.apollioApiKey) {
      localStorage.setItem('apollioApiKey', data.apollioApiKey);
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
      description: "Your API connection settings have been saved.",
    });
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
                    name="apollioApiKey"
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
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save API Settings
              </Button>
            </div>
          </form>
        </Form>
        
        <div className="mt-6 p-4 bg-muted rounded-md">
          <h4 className="font-medium mb-2">About API Keys and Webhooks</h4>
          <p className="text-sm text-muted-foreground">
            API keys and webhook URLs are stored securely in your browser's local storage. 
            For production use, we recommend a server-side implementation with proper key management.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
