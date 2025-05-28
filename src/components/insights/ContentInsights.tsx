import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Company } from "@/types";
import { useAppContext } from "@/context/AppContext";

interface ContentInsightsProps {
  company: Company;
}

export const ContentInsights = ({ company }: ContentInsightsProps) => {
  const { updateCompany } = useAppContext();
  const { toast } = useToast();
  const [websiteUrl, setWebsiteUrl] = useState(company?.website || "");
  const [contentWebhookUrl, setContentWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWebhookUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('content_webhook')
          .eq('id', 'default')
          .single();
          
        if (error) {
          console.error("Error fetching content webhook URL:", error);
          return;
        }
        
        if (data && data.content_webhook) {
          setContentWebhookUrl(data.content_webhook);
          localStorage.setItem('content_webhook', data.content_webhook);
        }
      } catch (error) {
        console.error("Failed to load content webhook URL:", error);
        
        // Try to get from localStorage as fallback
        const savedContentUrl = localStorage.getItem('content_webhook');
        if (savedContentUrl) setContentWebhookUrl(savedContentUrl);
      }
    };
    
    fetchWebhookUrl();
  }, []);

  const generateContentInsights = async () => {
    if (!contentWebhookUrl) {
      toast({
        title: "Webhook Not Configured",
        description: "Please configure the Content webhook in Settings → Webhooks.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare URL with query parameters
      const url = new URL(contentWebhookUrl);
      url.searchParams.append('companyName', company.name);
      url.searchParams.append('companyId', company.id);
      url.searchParams.append('insightType', 'content');
      url.searchParams.append('website', websiteUrl || company.website || "");
      
      console.log(`Generating content insights for ${company.name} with webhook:`, url.toString());
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json, text/plain, text/html",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate insights (HTTP ${response.status})`);
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
          content: textData,
          timestamp: new Date().toISOString(),
        };
      }
      
      console.log(`Processed content insights data:`, data);
      
      toast({
        title: "Content Insights Generated",
        description: "Content insights have been generated successfully.",
      });

      // Update company insights in the database
      if (company) {
        const updatedCompany = {
          ...company,
          insights: {
            ...(company.insights || {}),
            contentAudit: data
          }
        };
        
        console.log("Updating company with content insights:", updatedCompany);
        await updateCompany(updatedCompany);
      }
    } catch (error) {
      console.error(`Error generating content insights:`, error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContentAudit = () => {
    const contentAudit = company.insights?.contentAudit;
    
    if (!contentAudit) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-500">No content insights available.</p>
          <p className="text-sm text-gray-400 mt-2">
            Generate content insights to analyze this company's online content.
          </p>
        </div>
      );
    }

    if (contentAudit.content) {
      // Render HTML content if content is present (from HTML response)
      return (
        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: contentAudit.content }} />
        </div>
      );
    }

    // Otherwise, render the structured content (from JSON response)
    return (
      <div className="space-y-6">
        {contentAudit.keyTopics && (
          <div>
            <h3 className="font-medium mb-3">Key Topics</h3>
            <div className="flex flex-wrap gap-2">
              {contentAudit.keyTopics.map((topic, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {contentAudit.recentContent && (
          <div>
            <h3 className="font-medium mb-3">Recent Content</h3>
            <ul className="list-disc pl-5 space-y-1">
              {contentAudit.recentContent.map((content, index) => (
                <li key={index} className="text-sm">{content}</li>
              ))}
            </ul>
          </div>
        )}
        
        {contentAudit.contentGaps && (
          <div>
            <h3 className="font-medium mb-3">Content Gaps</h3>
            <ul className="list-disc pl-5 space-y-1">
              {contentAudit.contentGaps.map((gap, index) => (
                <li key={index} className="text-sm">{gap}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Insights</CardTitle>
        <CardDescription>
          Analyze {company.name}'s online content and identify opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Company website URL (optional override)"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="flex-1"
            />
          </div>
          
          {!contentWebhookUrl && (
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-800" />
              <AlertDescription className="text-yellow-800 text-sm">
                Content insights webhook is not configured. Please set it up in Settings → Webhooks.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="mb-4">
          <Button
            onClick={generateContentInsights}
            disabled={isLoading || !contentWebhookUrl}
            size="sm"
            className="w-full"
          >
            {isLoading ? "Generating..." : "Generate Content Insights"}
          </Button>
        </div>
        
        {renderContentAudit()}
      </CardContent>
    </Card>
  );
};
