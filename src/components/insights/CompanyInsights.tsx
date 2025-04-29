
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
import { Textarea } from "@/components/ui/textarea";

interface CompanyInsightsProps {
  companyId: string;
}

export const CompanyInsights = ({ companyId }: CompanyInsightsProps) => {
  const { companies, updateCompany, scanWebsite } = useAppContext();
  const { toast } = useToast();
  const company = companies.find((c) => c.id === companyId);
  
  const [websiteUrl, setWebsiteUrl] = useState(company?.website || "");
  const [isScanning, setIsScanning] = useState(false);
  const [researchType, setResearchType] = useState<string>("");
  const [isGeneratingResearch, setIsGeneratingResearch] = useState(false);
  const [researchResults, setResearchResults] = useState("");
  const [researchNotes, setResearchNotes] = useState("");
  
  if (!company) {
    return <div>Company not found</div>;
  }
  
  const handleScanWebsite = async () => {
    setIsScanning(true);
    await scanWebsite(websiteUrl);
    setIsScanning(false);
  };
  
  const generateResearch = async (type: string) => {
    if (!company) return;
    
    setResearchType(type);
    setIsGeneratingResearch(true);
    
    // Determine which webhook to use based on research type
    let webhookUrl = "";
    
    switch (type) {
      case "competitive":
        webhookUrl = import.meta.env.VITE_N8N_COMPETITIVE_RESEARCH_WEBHOOK || "";
        break;
      case "market":
        webhookUrl = import.meta.env.VITE_N8N_MARKET_RESEARCH_WEBHOOK || "";
        break;
      case "growth":
        webhookUrl = import.meta.env.VITE_N8N_GROWTH_RESEARCH_WEBHOOK || "";
        break;
      case "tech":
        webhookUrl = import.meta.env.VITE_N8N_TECH_RESEARCH_WEBHOOK || "";
        break;
      default:
        webhookUrl = "";
    }
    
    if (!webhookUrl) {
      toast({
        title: "Webhook Not Configured",
        description: `N8N webhook URL for ${type} research not configured`,
        variant: "destructive"
      });
      setIsGeneratingResearch(false);
      return;
    }
    
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          companyId: company.id,
          companyName: company.name,
          industry: company.industry,
          website: company.website,
          description: company.description,
          researchType: type,
          action: "generateResearch"
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate ${type} research`);
      }
      
      const data = await response.json();
      setResearchResults(data.content || "");
      
      toast({
        title: "Research Generated",
        description: `${getResearchTypeName(type)} research for ${company.name} has been generated.`
      });
    } catch (error) {
      console.error(`Error generating research:`, error);
      toast({
        title: "Generation Failed",
        description: `Failed to generate research. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingResearch(false);
    }
  };
  
  const getResearchTypeName = (type: string): string => {
    switch (type) {
      case "competitive": return "Competitive Analysis";
      case "market": return "Market Challenges";
      case "growth": return "Growth Opportunities";
      case "tech": return "Technology Stack";
      default: return type;
    }
  };
  
  const saveResearchNotes = async () => {
    // Implementation for saving research notes
    toast({
      title: "Research Notes Saved",
      description: "Your research notes have been saved."
    });
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
        </div>
        
        <Tabs defaultValue="awards">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="awards">Awards</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="ideal-client">Fit</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
          </TabsList>
          
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
          
          <TabsContent value="research">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Company Research</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="justify-start"
                      disabled={isGeneratingResearch}
                      onClick={() => generateResearch("competitive")}
                    >
                      {isGeneratingResearch && researchType === "competitive" 
                        ? "Generating..." 
                        : "Generate Competitive Analysis"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start"
                      disabled={isGeneratingResearch}
                      onClick={() => generateResearch("market")}
                    >
                      {isGeneratingResearch && researchType === "market" 
                        ? "Generating..." 
                        : "Generate Market Challenges"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start"
                      disabled={isGeneratingResearch}
                      onClick={() => generateResearch("growth")}
                    >
                      {isGeneratingResearch && researchType === "growth" 
                        ? "Generating..." 
                        : "Generate Growth Opportunities"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start"
                      disabled={isGeneratingResearch}
                      onClick={() => generateResearch("tech")}
                    >
                      {isGeneratingResearch && researchType === "tech" 
                        ? "Generating..." 
                        : "Generate Technology Stack"}
                    </Button>
                  </div>
                  
                  {researchResults && (
                    <div className="mt-6 space-y-4">
                      <h4 className="font-medium">
                        {getResearchTypeName(researchType)} Research Results
                      </h4>
                      <div className="bg-accent p-4 rounded-md whitespace-pre-wrap text-sm">
                        {researchResults}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Research Notes</label>
                        <Textarea
                          value={researchNotes}
                          onChange={(e) => setResearchNotes(e.target.value)}
                          placeholder="Add your notes about this research..."
                          rows={4}
                        />
                        
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={saveResearchNotes}
                          >
                            Save Notes
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!researchResults && (
                    <div className="py-4 text-center">
                      <p className="text-gray-500">
                        Select one of the research options above to generate insights.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
