
import { useState, useEffect } from "react";
import { Company } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

interface FacebookAdsInsightProps {
  company: Company;
}

export const FacebookAdsInsight = ({ company }: FacebookAdsInsightProps) => {
  const { updateCompany } = useAppContext();
  const { toast } = useToast();
  const [facebookAdsWebhookUrl, setFacebookAdsWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const isRunningAds = company.insights?.runningFacebookAds;
  const adDetails = company.insights?.adDetails || "";

  useEffect(() => {
    const fetchWebhookUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('facebook_ads_webhook')
          .eq('id', 'default')
          .single();
          
        if (error) {
          console.error("Error fetching Facebook ads webhook URL:", error);
          // Set dummy webhook for now as requested
          setFacebookAdsWebhookUrl("https://dummy-webhook.example.com/facebook-ads");
          return;
        }
        
        if (data && data.facebook_ads_webhook) {
          setFacebookAdsWebhookUrl(data.facebook_ads_webhook);
        } else {
          // Set dummy webhook for now as requested
          setFacebookAdsWebhookUrl("https://dummy-webhook.example.com/facebook-ads");
        }
      } catch (error) {
        console.error("Failed to load Facebook ads webhook URL:", error);
        // Set dummy webhook for now as requested
        setFacebookAdsWebhookUrl("https://dummy-webhook.example.com/facebook-ads");
      }
    };
    
    fetchWebhookUrl();
  }, []);

  const searchFacebookAds = async () => {
    if (!facebookAdsWebhookUrl) {
      toast({
        title: "Webhook Not Configured",
        description: "Please configure the Facebook Ads webhook in Settings → Webhooks.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare URL with query parameters
      const url = new URL(facebookAdsWebhookUrl);
      url.searchParams.append('companyName', company.name);
      url.searchParams.append('companyId', company.id);
      url.searchParams.append('website', company.website || "");
      
      console.log(`Searching Facebook ads for ${company.name} with webhook:`, url.toString());
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json, text/plain, text/html",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search Facebook ads (HTTP ${response.status})`);
      }

      // Check if the response is JSON or HTML/text
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        // Handle JSON response
        data = await response.json();
      } else {
        // Handle HTML or text response
        const textData = await response.text();
        console.log("Received HTML/text response:", textData.substring(0, 100) + "...");
        
        // Create a structured object to store the text data
        data = {
          runningFacebookAds: textData.toLowerCase().includes('active') || textData.toLowerCase().includes('running'),
          adDetails: textData,
          timestamp: new Date().toISOString(),
        };
      }
      
      console.log(`Processed Facebook ads data:`, data);
      
      toast({
        title: "Facebook Ads Search Complete",
        description: "Facebook ads search has been completed.",
      });

      // Update company insights in the database
      if (company) {
        const updatedCompany = {
          ...company,
          insights: {
            ...(company.insights || {}),
            runningFacebookAds: data.runningFacebookAds || false,
            adDetails: data.adDetails || data.content || "No ad information found"
          }
        };
        
        console.log("Updating company with Facebook ads insights:", updatedCompany);
        await updateCompany(updatedCompany);
      }
    } catch (error) {
      console.error(`Error searching Facebook ads:`, error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search Facebook ads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Facebook Ads</CardTitle>
        <CardDescription>
          Search for {company.name}'s Facebook advertising campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {!facebookAdsWebhookUrl.includes('dummy') ? null : (
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-800" />
              <AlertDescription className="text-yellow-800 text-sm">
                Using dummy Facebook ads webhook. Please configure the real webhook in Settings → Webhooks.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="mb-4">
          <Button
            onClick={searchFacebookAds}
            disabled={isLoading}
            size="sm"
            className="w-full"
          >
            {isLoading ? "Searching..." : "Search for Facebook Ads"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Facebook Ad Campaigns</h3>
            <Badge variant={isRunningAds ? "default" : "outline"}>
              {isRunningAds ? "Active" : isRunningAds === false ? "No Campaigns" : "Unknown"}
            </Badge>
          </div>
          
          {isRunningAds ? (
            <div className="space-y-3">
              <p className="text-sm">{adDetails}</p>
              <a 
                href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(company.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline inline-block"
              >
                View in Facebook Ad Library →
              </a>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-gray-500">
                {isRunningAds === false 
                  ? "No active Facebook ad campaigns detected." 
                  : "Facebook ad status unknown."}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Search for Facebook ads to see if this company is running campaigns.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
