
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AwardsInsight } from "./AwardsInsight";
import { JobPostingsInsight } from "./JobPostingsInsight";
import { ContentAuditInsight } from "./ContentAuditInsight";
import { IdealClientInsight } from "./IdealClientInsight";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CompanyInsightsProps {
  companyId: string;
}

export const CompanyInsights = ({ companyId }: CompanyInsightsProps) => {
  const { companies, updateCompany } = useAppContext();
  const { toast } = useToast();
  const company = companies.find((c) => c.id === companyId);
  
  const [websiteUrl, setWebsiteUrl] = useState(company?.website || "");
  const [awardsWebhookUrl, setAwardsWebhookUrl] = useState("");
  const [jobsWebhookUrl, setJobsWebhookUrl] = useState("");
  const [contentWebhookUrl, setContentWebhookUrl] = useState("");
  const [currentTab, setCurrentTab] = useState("awards");
  const [isLoading, setIsLoading] = useState(false);
  
  if (!company) {
    return <div>Company not found</div>;
  }

  useEffect(() => {
    const fetchWebhookUrls = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('awards_webhook, jobs_webhook, content_webhook')
          .eq('id', 'default')
          .single();
          
        if (error) {
          console.error("Error fetching company insights webhook URLs:", error);
          return;
        }
        
        if (data) {
          if (data.awards_webhook) {
            setAwardsWebhookUrl(data.awards_webhook);
            localStorage.setItem('awards_webhook', data.awards_webhook);
          }
          
          if (data.jobs_webhook) {
            setJobsWebhookUrl(data.jobs_webhook);
            localStorage.setItem('jobs_webhook', data.jobs_webhook);
          }
          
          if (data.content_webhook) {
            setContentWebhookUrl(data.content_webhook);
            localStorage.setItem('content_webhook', data.content_webhook);
          }
        }
      } catch (error) {
        console.error("Failed to load company insights webhook URLs:", error);
        
        // Try to get from localStorage as fallback
        const savedAwardsUrl = localStorage.getItem('awards_webhook');
        const savedJobsUrl = localStorage.getItem('jobs_webhook');
        const savedContentUrl = localStorage.getItem('content_webhook');
        
        if (savedAwardsUrl) setAwardsWebhookUrl(savedAwardsUrl);
        if (savedJobsUrl) setJobsWebhookUrl(savedJobsUrl);
        if (savedContentUrl) setContentWebhookUrl(savedContentUrl);
      }
    };
    
    fetchWebhookUrls();
  }, []);

  const getWebhookUrlForCurrentTab = () => {
    switch (currentTab) {
      case 'awards':
        return awardsWebhookUrl;
      case 'jobs':
        return jobsWebhookUrl;
      case 'content':
        return contentWebhookUrl;
      default:
        return "";
    }
  };

  const generateInsights = async (type: string) => {
    const webhookUrl = getWebhookUrlForCurrentTab();
    
    if (!webhookUrl) {
      toast({
        title: "Webhook Not Configured",
        description: `Please configure the ${type.charAt(0).toUpperCase() + type.slice(1)} webhook in Settings → Webhooks.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare URL with query parameters
      const url = new URL(webhookUrl);
      url.searchParams.append('companyName', company.name);
      url.searchParams.append('companyId', companyId);
      url.searchParams.append('insightType', type);
      url.searchParams.append('website', websiteUrl || company.website || "");
      
      console.log(`Generating ${type} insights for ${company.name} with webhook:`, url.toString());
      
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
        
        // Update company insights in the database
        await updateInsightsInDatabase(type, data);
        
        toast({
          title: "Insights Generated",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} insights have been generated.`,
        });
      } else {
        // Handle HTML or text response
        const textData = await response.text();
        
        // Create a structured object to store the text data
        const formattedData = {
          content: textData,
          timestamp: new Date().toISOString(),
        };
        
        // Update company insights in the database
        await updateInsightsInDatabase(type, formattedData);
        
        toast({
          title: "Insights Generated",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} insights have been generated.`,
        });
      }
      
      // Refresh the page or relevant component to show the new insights
      window.location.reload();
    } catch (error) {
      console.error(`Error generating ${type} insights:`, error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateInsightsInDatabase = async (type: string, data: any) => {
    try {
      const insightData: Record<string, any> = {};
      
      switch (type) {
        case 'awards':
          insightData.awards = data;
          break;
        case 'jobs':
          insightData.jobPostings = data;
          break;
        case 'content':
          insightData.contentAudit = data;
          break;
      }
      
      // Update the company with new insights
      if (company && Object.keys(insightData).length > 0) {
        const updatedCompany = {
          ...company,
          insights: {
            ...(company.insights || {}),
            ...insightData
          }
        };
        
        await updateCompany(updatedCompany);
      }
    } catch (error) {
      console.error(`Error updating ${type} insights in database:`, error);
    }
  };
  
  const webhooksConfigured = {
    awards: !!awardsWebhookUrl,
    jobs: !!jobsWebhookUrl,
    content: !!contentWebhookUrl
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Insights</CardTitle>
        <CardDescription>
          Intelligence gathered from various sources about {company.name}
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
          
          {(!webhooksConfigured.awards && !webhooksConfigured.jobs && !webhooksConfigured.content) && (
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-800" />
              <AlertDescription className="text-yellow-800 text-sm">
                Company insights webhooks are not configured. Please set them up in Settings → Webhooks.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <Tabs 
          defaultValue="awards" 
          onValueChange={setCurrentTab}
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="awards">Awards</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="ideal-client">Fit</TabsTrigger>
          </TabsList>
          
          <div className="mb-4">
            {currentTab !== "ideal-client" && (
              <Button
                onClick={() => generateInsights(currentTab)}
                disabled={isLoading || !getWebhookUrlForCurrentTab()}
                size="sm"
                className="w-full"
              >
                {isLoading ? "Generating..." : `Generate ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Insights`}
              </Button>
            )}
          </div>
          
          <TabsContent value="awards">
            <AwardsInsight company={company} />
          </TabsContent>
          
          <TabsContent value="jobs">
            <JobPostingsInsight company={company} />
          </TabsContent>
          
          <TabsContent value="content">
            <ContentAuditInsight company={company} />
          </TabsContent>
          
          <TabsContent value="ideal-client">
            <IdealClientInsight company={company} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center">
          <Badge variant="outline" className="mr-2">Last Updated</Badge>
          <span className="text-sm text-gray-500">
            {new Date(company.updatedAt).toLocaleDateString()}
          </span>
        </div>
        <Button variant="outline">Export Insights</Button>
      </CardFooter>
    </Card>
  );
};
