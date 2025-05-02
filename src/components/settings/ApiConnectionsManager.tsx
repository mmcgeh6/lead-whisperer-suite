
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const apiConnectionsSchema = z.object({
  apifyApiKey: z.string().optional().or(z.literal("")),
  apolloApiKey: z.string().optional().or(z.literal("")),
  leadProvider: z.string().optional().or(z.literal(""))
});

type ApiConnectionsValues = z.infer<typeof apiConnectionsSchema>;

export const ApiConnectionsManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Initialize form with react-hook-form
  const form = useForm<ApiConnectionsValues>({
    resolver: zodResolver(apiConnectionsSchema),
    defaultValues: {
      apifyApiKey: '',
      apolloApiKey: '',
      leadProvider: 'apollo'
    },
  });
  
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Fetch API connection settings
        const { data, error } = await supabase
          .from('app_settings')
          .select('apifyapolloapikey, apolloapikey, leadprovider')
          .eq('id', 'default')
          .single();
          
        if (error) {
          throw error;
        }
        
        // Update form values if settings exist
        if (data) {
          if (data.apifyapolloapikey) {
            form.setValue('apifyApiKey', data.apifyapolloapikey);
          }
          
          if (data.apolloapikey) {
            form.setValue('apolloApiKey', data.apolloapikey);
          }
          
          if (data.leadprovider) {
            form.setValue('leadProvider', data.leadprovider);
          }
        }
      } catch (error) {
        console.error("Failed to load API connection settings:", error);
        toast({
          title: "Failed to load API settings",
          description: "Could not retrieve API connection settings. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [form, toast]);
  
  const onSubmit = async (data: ApiConnectionsValues) => {
    setIsLoading(true);
    
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 'default', // Use a constant ID to ensure we only have one row
          apifyapolloapikey: data.apifyApiKey,
          apolloapikey: data.apolloApiKey,
          leadprovider: data.leadProvider,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) {
        throw error;
      }
      
      // Also save to localStorage as fallback
      localStorage.setItem('apifyApiKey', data.apifyApiKey || '');
      localStorage.setItem('apolloApiKey', data.apolloApiKey || '');
      localStorage.setItem('leadProvider', data.leadProvider || 'apollo');
      
      // Show success toast
      toast({
        title: "API Settings Saved",
        description: "Your API connection settings have been saved."
      });
      
      // Redirect to settings page with success parameter
      navigate('/settings?saved=api&tab=api');
    } catch (error) {
      console.error("Error saving API settings:", error);
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
          <CardTitle>API Connections</CardTitle>
          <CardDescription>
            Connect to third-party services for data enrichment
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
        <CardTitle>API Connections</CardTitle>
        <CardDescription>
          Connect to third-party services for data enrichment and lead generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Lead Provider Settings</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="apolloApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apollo.io API Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your Apollo API key"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for finding and enriching contacts from Apollo.io
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="apifyApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apify API Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your Apify API key"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for automating web scraping tasks
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save API Settings"}
              </Button>
            </div>
          </form>
        </Form>
        
        <div className="mt-6">
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground">
            API keys are stored securely and used only for the specified services.
            For webhook settings, please visit the <a href="/settings?tab=webhooks" className="text-blue-600 hover:underline">Webhooks tab</a>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
