
import { useState } from "react";
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
  const { companies, updateCompany, scanWebsite } = useAppContext();
  const { toast } = useToast();
  const company = companies.find((c) => c.id === companyId);
  
  const [websiteUrl, setWebsiteUrl] = useState(company?.website || "");
  const [isScanning, setIsScanning] = useState(false);
  const [insightsWebhookUrl, setInsightsWebhookUrl] = useState("");
  const [currentTab, setCurrentTab] = useState("awards");
  const [isLoading, setIsLoading] = useState(false);
  
  if (!company) {
    return <div>Company not found</div>;
  }

  // Fetch the webhook URL when component mounts
  useState(() => {
    const fetchWebhookUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('companyresearchwebhook')
          .eq('id', 'default')
          .single();
          
        if (error) {
          console.error("Error fetching company insights webhook URL:", error);
          return;
        }
        
        if (data?.companyresearchwebhook) {
          setInsightsWebhookUrl(data.companyresearchwebhook);
          console.log("Loaded company insights webhook URL:", data.companyresearchwebhook);
        }
      } catch (error) {
        console.error("Failed to load company insights webhook URL:", error);
        
        // Try to get from localStorage as fallback
        const savedUrl = localStorage.getItem('company_insights_webhook');
        if (savedUrl) {
          setInsightsWebhookUrl(savedUrl);
        }
      }
    };
    
    fetchWebhookUrl();
  }, []);
  
  const handleScanWebsite = async () => {
    setIsScanning(true);
    await scanWebsite(websiteUrl);
    setIsScanning(false);
  };

  const generateInsights = async (type: string) => {
    if (!insightsWebhookUrl) {
      toast({
        title: "Webhook Not Configured",
        description: "Please configure the Company Insights webhook in Settings → Webhooks.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare URL with query parameters
      const url = new URL(insightsWebhookUrl);
      url.searchParams.append('companyName', company.name);
      url.searchParams.append('companyId', companyId);
      url.searchParams.append('insightType', type);
      url.searchParams.append('website', company.website || "");
      
      console.log(`Generating ${type} insights for ${company.name} with webhook:`, url.toString());
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json, text/plain",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate insights (HTTP ${response.status})`);
      }

      const data = await response.json();
      
      toast({
        title: "Insights Generated",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} insights have been generated.`,
      });
      
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
              placeholder="Company website URL"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleScanWebsite} disabled={isScanning || !websiteUrl}>
              {isScanning ? "Scanning..." : "Scan Website"}
            </Button>
          </div>
          
          {!insightsWebhookUrl && (
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-800" />
              <AlertDescription className="text-yellow-800 text-sm">
                Company insights webhook is not configured. Please set it up in Settings → Webhooks.
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
            <Button
              onClick={() => generateInsights(currentTab)}
              disabled={isLoading || !insightsWebhookUrl}
              size="sm"
              className="w-full"
            >
              {isLoading ? "Generating..." : `Generate ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Insights`}
            </Button>
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
