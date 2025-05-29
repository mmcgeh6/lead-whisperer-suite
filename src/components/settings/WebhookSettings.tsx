
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const WebhookSettings = () => {
  const [webhooks, setWebhooks] = useState({
    awards_webhook: '',
    jobs_webhook: '',
    content_webhook: '',
    lead_search_webhook: '',
    facebook_ads_webhook: '',
    tech_stack_webhook: '',
    companyresearchwebhook: '',
    marketresearchwebhook: '',
    growthresearchwebhook: '',
    techresearchwebhook: '',
    emailfinderwebhook: '',
    linkedinenrichmentwebhook: '',
    companyenrichmentwebhook: '',
    profile_research_webhook: '',
    ideal_customer_webhook: '',
    outreach_webhook: '',
    crm_export_webhook: ''
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 'default')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error loading settings:", error);
          return;
        }

        if (data) {
          setWebhooks({
            awards_webhook: data.awards_webhook || '',
            jobs_webhook: data.jobs_webhook || '',
            content_webhook: data.content_webhook || '',
            lead_search_webhook: data.lead_search_webhook || '',
            facebook_ads_webhook: data.facebook_ads_webhook || '',
            tech_stack_webhook: data.tech_stack_webhook || '',
            companyresearchwebhook: data.companyresearchwebhook || '',
            marketresearchwebhook: data.marketresearchwebhook || '',
            growthresearchwebhook: data.growthresearchwebhook || '',
            techresearchwebhook: data.techresearchwebhook || '',
            emailfinderwebhook: data.emailfinderwebhook || '',
            linkedinenrichmentwebhook: data.linkedinenrichmentwebhook || '',
            companyenrichmentwebhook: data.companyenrichmentwebhook || '',
            profile_research_webhook: data.profile_research_webhook || '',
            ideal_customer_webhook: data.ideal_customer_webhook || '',
            outreach_webhook: data.outreach_webhook || '',
            crm_export_webhook: data.crm_export_webhook || ''
          });

          // Store in localStorage for easy access
          Object.entries(webhooks).forEach(([key, value]) => {
            if (value) {
              localStorage.setItem(key, value);
            }
          });
        }
      } catch (error) {
        console.error("Exception loading settings:", error);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 'default',
          ...webhooks,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Store in localStorage for easy access
      Object.entries(webhooks).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(key, value);
        } else {
          localStorage.removeItem(key);
        }
      });

      toast({
        title: "Settings Saved",
        description: "Webhook settings have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save webhook settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setWebhooks(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const webhookFields = [
    { key: 'awards_webhook', label: 'Awards Research Webhook', description: 'Webhook for company awards research' },
    { key: 'jobs_webhook', label: 'Jobs Research Webhook', description: 'Webhook for job postings research' },
    { key: 'content_webhook', label: 'Content Analysis Webhook', description: 'Webhook for content audit analysis' },
    { key: 'lead_search_webhook', label: 'Lead Search Webhook', description: 'Webhook for lead search functionality' },
    { key: 'facebook_ads_webhook', label: 'Facebook Ads Webhook', description: 'Webhook for Facebook ads analysis' },
    { key: 'tech_stack_webhook', label: 'Tech Stack Webhook', description: 'Webhook for technology stack analysis' },
    { key: 'companyresearchwebhook', label: 'Company Research Webhook', description: 'Webhook for general company research' },
    { key: 'marketresearchwebhook', label: 'Market Research Webhook', description: 'Webhook for market research analysis' },
    { key: 'growthresearchwebhook', label: 'Growth Research Webhook', description: 'Webhook for growth research analysis' },
    { key: 'techresearchwebhook', label: 'Technology Research Webhook', description: 'Webhook for technology research' },
    { key: 'emailfinderwebhook', label: 'Email Finder Webhook', description: 'Webhook for email finding service' },
    { key: 'linkedinenrichmentwebhook', label: 'LinkedIn Enrichment Webhook', description: 'Webhook for LinkedIn profile enrichment' },
    { key: 'companyenrichmentwebhook', label: 'Company Enrichment Webhook', description: 'Webhook for company data enrichment' },
    { key: 'profile_research_webhook', label: 'Profile Research Webhook', description: 'Webhook for profile research analysis' },
    { key: 'ideal_customer_webhook', label: 'Ideal Customer Webhook', description: 'Webhook for ideal customer analysis' },
    { key: 'outreach_webhook', label: 'Outreach Webhook', description: 'Webhook for outreach message generation' },
    { key: 'crm_export_webhook', label: 'CRM Export Webhook', description: 'Webhook for exporting companies to CRM' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Settings</CardTitle>
        <CardDescription>
          Configure webhook URLs for various research and analysis features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {webhookFields.map(({ key, label, description }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="url"
              placeholder="https://your-webhook-url.com"
              value={webhooks[key as keyof typeof webhooks]}
              onChange={(e) => handleInputChange(key, e.target.value)}
            />
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        ))}
        
        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Webhook Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};
