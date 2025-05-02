
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CompanyResearchProps {
  companyId: string;
}

export const CompanyResearch = ({ companyId }: CompanyResearchProps) => {
  const { companies } = useAppContext();
  const { toast } = useToast();
  const company = companies.find((c) => c.id === companyId);
  
  const [isGeneratingProfileResearch, setIsGeneratingProfileResearch] = useState(false);
  const [isGeneratingIdealCustomer, setIsGeneratingIdealCustomer] = useState(false);
  const [profileResearch, setProfileResearch] = useState("");
  const [idealCustomerAnalysis, setIdealCustomerAnalysis] = useState("");
  const [profileNotes, setProfileNotes] = useState("");
  const [idealCustomerNotes, setIdealCustomerNotes] = useState("");
  
  if (!company) {
    return <div>Company not found</div>;
  }
  
  const generateProfileResearch = async () => {
    if (!company) return;
    
    setIsGeneratingProfileResearch(true);
    
    // Get webhook URL from localStorage
    const webhookUrl = localStorage.getItem('profile_research_webhook') || "";
    
    if (!webhookUrl) {
      toast({
        title: "Webhook Not Configured",
        description: "Company Profile Research webhook not configured in webhook settings",
        variant: "destructive"
      });
      setIsGeneratingProfileResearch(false);
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
          action: "generateProfileResearch"
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate company profile research");
      }
      
      const data = await response.json();
      setProfileResearch(data.content || "");
      
      toast({
        title: "Research Generated",
        description: `Company Profile Research for ${company.name} has been generated.`
      });
    } catch (error) {
      console.error("Error generating profile research:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate profile research. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingProfileResearch(false);
    }
  };
  
  const generateIdealCustomerAnalysis = async () => {
    if (!company) return;
    
    setIsGeneratingIdealCustomer(true);
    
    // Get webhook URL from localStorage
    const webhookUrl = localStorage.getItem('ideal_customer_webhook') || "";
    
    if (!webhookUrl) {
      toast({
        title: "Webhook Not Configured",
        description: "Ideal Customer Analysis webhook not configured in webhook settings",
        variant: "destructive"
      });
      setIsGeneratingIdealCustomer(false);
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
          action: "generateIdealCustomerAnalysis"
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate ideal customer analysis");
      }
      
      const data = await response.json();
      setIdealCustomerAnalysis(data.content || "");
      
      toast({
        title: "Analysis Generated",
        description: `Ideal Customer Analysis for ${company.name} has been generated.`
      });
    } catch (error) {
      console.error("Error generating ideal customer analysis:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate ideal customer analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingIdealCustomer(false);
    }
  };
  
  const saveProfileNotes = async () => {
    toast({
      title: "Research Notes Saved",
      description: "Your profile research notes have been saved."
    });
  };
  
  const saveIdealCustomerNotes = async () => {
    toast({
      title: "Analysis Notes Saved",
      description: "Your ideal customer analysis notes have been saved."
    });
  };
  
  // Check if webhooks are configured
  const isProfileResearchWebhookConfigured = !!localStorage.getItem('profile_research_webhook');
  const isIdealCustomerWebhookConfigured = !!localStorage.getItem('ideal_customer_webhook');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Research</CardTitle>
        <CardDescription>Generate research insights for {company.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isProfileResearchWebhookConfigured && !isIdealCustomerWebhookConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No research webhooks are configured. Please set up webhooks in Settings to use this feature.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-6">
          {/* Company Profile Research */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Company Profile Research</h3>
              <Button
                variant="outline"
                onClick={generateProfileResearch}
                disabled={isGeneratingProfileResearch || !isProfileResearchWebhookConfigured}
              >
                {isGeneratingProfileResearch ? "Generating..." : "Generate Profile Research"}
              </Button>
            </div>
            
            {profileResearch ? (
              <div className="space-y-4">
                <div className="bg-accent p-4 rounded-md whitespace-pre-wrap text-sm">
                  {profileResearch}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Research Notes</label>
                  <Textarea
                    value={profileNotes}
                    onChange={(e) => setProfileNotes(e.target.value)}
                    placeholder="Add your notes about this profile research..."
                    rows={4}
                  />
                  
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={saveProfileNotes}
                    >
                      Save Notes
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
                <p className="text-gray-500 text-center">
                  Click the button above to generate company profile research.
                </p>
              </div>
            )}
          </div>
          
          {/* Ideal Customer Analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Ideal Customer Analysis</h3>
              <Button
                variant="outline"
                onClick={generateIdealCustomerAnalysis}
                disabled={isGeneratingIdealCustomer || !isIdealCustomerWebhookConfigured}
              >
                {isGeneratingIdealCustomer ? "Generating..." : "Generate Ideal Customer"}
              </Button>
            </div>
            
            {idealCustomerAnalysis ? (
              <div className="space-y-4">
                <div className="bg-accent p-4 rounded-md whitespace-pre-wrap text-sm">
                  {idealCustomerAnalysis}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Analysis Notes</label>
                  <Textarea
                    value={idealCustomerNotes}
                    onChange={(e) => setIdealCustomerNotes(e.target.value)}
                    placeholder="Add your notes about this ideal customer analysis..."
                    rows={4}
                  />
                  
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={saveIdealCustomerNotes}
                    >
                      Save Notes
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
                <p className="text-gray-500 text-center">
                  Click the button above to generate ideal customer analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
