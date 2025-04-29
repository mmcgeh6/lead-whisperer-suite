
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/components/ui/use-toast";

interface CompanyResearchProps {
  companyId: string;
}

export const CompanyResearch = ({ companyId }: CompanyResearchProps) => {
  const { companies } = useAppContext();
  const { toast } = useToast();
  const company = companies.find((c) => c.id === companyId);
  
  const [researchType, setResearchType] = useState<string>("");
  const [isGeneratingResearch, setIsGeneratingResearch] = useState(false);
  const [researchResults, setResearchResults] = useState("");
  const [researchNotes, setResearchNotes] = useState("");
  
  if (!company) {
    return <div>Company not found</div>;
  }
  
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
    toast({
      title: "Research Notes Saved",
      description: "Your research notes have been saved."
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Research</CardTitle>
        <CardDescription>Generate research insights for {company.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">Generate Research</h3>
          
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
  );
};
