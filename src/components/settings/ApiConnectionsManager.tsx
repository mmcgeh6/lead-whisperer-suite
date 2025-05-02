
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

// Schema for API connections form
const apiConnectionsSchema = z.object({
  apifyApolloApiKey: z.string().optional().or(z.literal("")),
  apolloApiKey: z.string().optional().or(z.literal("")),
  leadProvider: z.string().optional().or(z.literal(""))
});

type ApiConnectionsValues = z.infer<typeof apiConnectionsSchema>;

export const ApiConnectionsManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<ApiConnectionsValues>({
    resolver: zodResolver(apiConnectionsSchema),
    defaultValues: {
      apifyApolloApiKey: '',
      apolloApiKey: '',
      leadProvider: ''
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Fetch API settings from Supabase
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
            form.setValue('apifyApolloApiKey', data.apifyapolloapikey);
          }
          
          if (data.apolloapikey) {
            form.setValue('apolloApiKey', data.apolloapikey);
          }
          
          if (data.leadprovider) {
            form.setValue('leadProvider', data.leadprovider);
          }
        }
      } catch (error) {
        console.error("Failed to load API settings:", error);
        toast({
          title: "Failed to load API settings",
          description: "Could not retrieve API settings. Please try again later.",
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
      // Save to Supabase - match column names with the database schema
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 'default', // Use a constant ID to ensure we only have one row
          apifyapolloapikey: data.apifyApolloApiKey,
          apolloapikey: data.apolloApiKey,
          leadprovider: data.leadProvider,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "API Settings Saved",
        description: "Your API connection settings have been successfully updated."
      });
    } catch (error) {
      console.error("Error saving API settings:", error);
      toast({
        title: "Error Saving Settings",
        description: "Failed to save API settings to the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Connections</CardTitle>
        <CardDescription>
          Configure connections to third-party services for lead enrichment and data scraping
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Lead Data Services</h3>
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
                          placeholder="Enter your Apollo.io API key"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        API key for Apollo.io contact and company data
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="apifyApolloApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apify Apollo API Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your Apify Apollo integration key"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        API key for Apify's Apollo.io scraper
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="leadProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Lead Provider</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your preferred lead data provider"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The primary service to use for lead data
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
      </CardContent>
    </Card>
  );
};
