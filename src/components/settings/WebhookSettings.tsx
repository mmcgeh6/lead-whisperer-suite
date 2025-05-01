
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
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Schema for webhook settings form
const webhookSettingsSchema = z.object({
  emailFinderWebhook: z.string().url().optional().or(z.literal("")),
  linkedinEnrichmentWebhook: z.string().url().optional().or(z.literal("")),
  companyEnrichmentWebhook: z.string().url().optional().or(z.literal("")),
});

type WebhookSettingsValues = z.infer<typeof webhookSettingsSchema>;

export const WebhookSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Initialize form
  const form = useForm<WebhookSettingsValues>({
    resolver: zodResolver(webhookSettingsSchema),
    defaultValues: {
      emailFinderWebhook: '',
      linkedinEnrichmentWebhook: '',
      companyEnrichmentWebhook: '',
    },
  });
  
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Fetch webhook settings from Supabase
        const { data, error } = await supabase
          .from('app_settings')
          .select('emailfinderwebhook, linkedinenrichmentwebhook, companyenrichmentwebhook')
          .eq('id', 'default')
          .single();
          
        if (error) {
          throw error;
        }
        
        // Update form values if settings exist
        if (data) {
          // Set form values using the column names from the database
          if (data.emailfinderwebhook) {
            form.setValue('emailFinderWebhook', data.emailfinderwebhook);
          }
          
          if (data.linkedinenrichmentwebhook) {
            form.setValue('linkedinEnrichmentWebhook', data.linkedinenrichmentwebhook);
          }
          
          if (data.companyenrichmentwebhook) {
            form.setValue('companyEnrichmentWebhook', data.companyenrichmentwebhook);
          }
        }
      } catch (error) {
        console.error("Failed to load webhook settings:", error);
        toast({
          title: "Failed to load webhook settings",
          description: "Could not retrieve webhook settings. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [form, toast]);
  
  const onSubmit = async (data: WebhookSettingsValues) => {
    setIsLoading(true);
    
    try {
      // Save to Supabase - match column names with the database schema
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 'default', // Use a constant ID to ensure we only have one row
          emailfinderwebhook: data.emailFinderWebhook,
          linkedinenrichmentwebhook: data.linkedinEnrichmentWebhook,
          companyenrichmentwebhook: data.companyEnrichmentWebhook,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) {
        throw error;
      }
      
      // Also save to localStorage as fallback
      localStorage.setItem('emailFinderWebhook', data.emailFinderWebhook || '');
      localStorage.setItem('linkedinEnrichmentWebhook', data.linkedinEnrichmentWebhook || '');
      localStorage.setItem('companyEnrichmentWebhook', data.companyEnrichmentWebhook || '');
      
      // Redirect to settings page with saved parameter and tab
      navigate('/settings?saved=webhooks&tab=webhooks');
    } catch (error) {
      console.error("Error saving webhook settings:", error);
      toast({
        title: "Error Saving Settings",
        description: "Failed to save webhook settings to the database. Using local storage fallback.",
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
          <CardTitle>Webhook Settings</CardTitle>
          <CardDescription>
            Configure webhooks for data enrichment and other automated tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Access denied. Only administrators can access webhook settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Settings</CardTitle>
        <CardDescription>
          Configure webhooks for data enrichment and other automated tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="emailFinderWebhook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Finder Webhook</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/webhook/email-finder"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Webhook endpoint for finding contact email addresses
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="linkedinEnrichmentWebhook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Enrichment Webhook</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/webhook/linkedin-enrichment"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Webhook endpoint for enriching contacts with LinkedIn data
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="companyEnrichmentWebhook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Enrichment Webhook</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/webhook/company-enrichment"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Webhook endpoint for enriching companies with additional data
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Webhook Settings"}
              </Button>
            </div>
          </form>
        </Form>
        
        <div className="mt-6 p-4 bg-muted rounded-md">
          <h4 className="font-medium mb-2">About Webhooks</h4>
          <p className="text-sm text-muted-foreground">
            Webhooks are HTTP callbacks that receive data from external services. They allow your 
            application to automate tasks like finding emails, enriching contacts, and retrieving 
            company information.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
