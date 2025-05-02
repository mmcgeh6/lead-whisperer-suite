
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

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
  
  // Track webhook configuration status
  const [profileResearchWebhookConfigured, setProfileResearchWebhookConfigured] = useState(false);
  const [idealCustomerWebhookConfigured, setIdealCustomerWebhookConfigured] = useState(false);
  
  // Check if company exists
  if (!company) {
    return <div>Company not found</div>;
  }
  
  // On component mount, check if company has existing research data
  useEffect(() => {
    const fetchCompanyInsights = async () => {
      try {
        // Check if webhook URLs are configured
        const { data: settings, error: settingsError } = await supabase
          .from('app_settings')
          .select('profile_research_webhook, ideal_customer_webhook')
          .eq('id', 'default')
          .single();
        
        if (settingsError) {
          console.error("Error fetching webhook settings:", settingsError);
        } else if (settings) {
          console.log("Webhook settings from DB:", settings);
          setProfileResearchWebhookConfigured(!!settings.profile_research_webhook);
          setIdealCustomerWebhookConfigured(!!settings.ideal_customer_webhook);
        }
        
        // Check localStorage as fallback
        const localProfileWebhook = localStorage.getItem('profile_research_webhook');
        const localIdealCustomerWebhook = localStorage.getItem('ideal_customer_webhook');
        
        console.log("Local profile webhook found:", localProfileWebhook);
        console.log("Local ideal customer webhook found:", localIdealCustomerWebhook);
        
        if (!profileResearchWebhookConfigured && localProfileWebhook) {
          setProfileResearchWebhookConfigured(true);
        }
        
        if (!idealCustomerWebhookConfigured && localIdealCustomerWebhook) {
          setIdealCustomerWebhookConfigured(true);
        }
        
        // Fetch existing research data if available
        const { data: insights, error } = await supabase
          .from('company_insights')
          .select('profile_research, ideal_customer_analysis, notes, approach_notes')
          .eq('company_id', companyId)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching company insights:", error);
          return;
        }
        
        if (insights) {
          console.log("Fetched company insights:", insights);
          if (insights.profile_research) {
            setProfileResearch(insights.profile_research);
          }
          
          if (insights.ideal_customer_analysis) {
            setIdealCustomerAnalysis(insights.ideal_customer_analysis);
          }
          
          if (insights.notes) {
            setProfileNotes(insights.notes);
          }
          
          if (insights.approach_notes) {
            setIdealCustomerNotes(insights.approach_notes);
          }
        } else {
          console.log("No insights found for company:", companyId);
        }
      } catch (error) {
        console.error("Error fetching company insights:", error);
      }
    };
    
    fetchCompanyInsights();
  }, [companyId]);
  
  const generateProfileResearch = async () => {
    if (!company) return;
    
    setIsGeneratingProfileResearch(true);
    
    try {
      // First, check for webhook URL in database
      const { data: settings, error: settingsError } = await supabase
        .from('app_settings')
        .select('profile_research_webhook')
        .eq('id', 'default')
        .single();
      
      if (settingsError) {
        console.error("Error getting webhook from settings:", settingsError);
      }
      
      // Initialize webhook URL
      let webhookUrl = settings?.profile_research_webhook;
      
      // If not found in DB, try localStorage
      if (!webhookUrl) {
        webhookUrl = localStorage.getItem('profile_research_webhook');
        console.log("Using webhook from localStorage:", webhookUrl);
      }
      
      console.log("Final webhook URL for profile research:", webhookUrl);
      
      if (!webhookUrl) {
        toast({
          title: "Webhook Not Configured",
          description: "Company Profile Research webhook not configured in webhook settings",
          variant: "destructive"
        });
        setIsGeneratingProfileResearch(false);
        return;
      }
      
      toast({
        title: "Generating Research",
        description: "Fetching company profile research data..."
      });
      
      // Prepare payload with companyId
      const payload = {
        companyId: company.id
      };
      
      console.log("Sending request to webhook:", webhookUrl);
      console.log("With payload:", payload);
      
      // Try both GET and POST methods
      let response: Response | null = null;
      let responseData: any = null;
      
      // First try POST
      try {
        console.log("Attempting POST request to webhook");
        response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        
        console.log("POST response status:", response.status);
        
        if (response.ok) {
          responseData = await response.json();
        }
      } catch (postError) {
        console.error("POST request failed:", postError);
        console.log("Falling back to GET request");
        
        // If POST fails, try GET with query parameters
        try {
          const queryParams = new URLSearchParams({ companyId: company.id }).toString();
          const getUrl = `${webhookUrl}?${queryParams}`;
          
          console.log("Attempting GET request to:", getUrl);
          
          response = await fetch(getUrl, {
            method: "GET",
            headers: {
              "Accept": "application/json"
            }
          });
          
          console.log("GET response status:", response.status);
          
          if (response.ok) {
            responseData = await response.json();
          }
        } catch (getError) {
          console.error("GET request also failed:", getError);
          throw new Error("All webhook request methods failed");
        }
      }
      
      if (!response || !response.ok || !responseData) {
        console.error("Failed to generate company profile research, status:", response?.status);
        throw new Error("Failed to generate company profile research");
      }
      
      console.log("Webhook response data:", responseData);
      handleResearchResponse(responseData);
    } catch (error) {
      console.error("Error generating profile research:", error);
      
      // Use demo content for better UX
      const demoContent = generateDemoProfileResearch(company);
      setProfileResearch(demoContent);
      
      // Save demo content to database
      await saveProfileResearchToDatabase(demoContent);
      
      toast({
        title: "Using Demo Content",
        description: "Could not reach the webhook endpoint. Using sample research content instead.",
        variant: "default"
      });
    } finally {
      setIsGeneratingProfileResearch(false);
    }
  };
  
  const handleResearchResponse = async (data: any) => {
    const content = data.content || data.research || data.profileResearch || data.text || "";
    setProfileResearch(content);
    
    // Save to database
    await saveProfileResearchToDatabase(content);
    
    toast({
      title: "Research Generated",
      description: `Company Profile Research for ${company.name} has been generated.`
    });
  };
  
  const saveProfileResearchToDatabase = async (content: string) => {
    try {
      // Check if a record already exists for this company
      const { data: existingRecord, error: checkError } = await supabase
        .from('company_insights')
        .select('id')
        .eq('company_id', company.id)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking for existing company insight:", checkError);
        return;
      }
      
      if (existingRecord) {
        // If record exists, update it
        const { error: updateError } = await supabase
          .from('company_insights')
          .update({
            profile_research: content,
            updated_at: new Date().toISOString()
          })
          .eq('company_id', company.id);
          
        if (updateError) {
          console.error("Error updating profile research in database:", updateError);
        }
      } else {
        // If no record exists, insert a new one
        const { error: insertError } = await supabase
          .from('company_insights')
          .insert({
            company_id: company.id,
            profile_research: content,
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error("Error inserting profile research to database:", insertError);
        }
      }
    } catch (error) {
      console.error("Error saving research to database:", error);
    }
  };
  
  const generateDemoProfileResearch = (company: any) => {
    return `${company.name} appears to be a ${company.industry || "growing"} company focusing on ${company.description || "innovative solutions"}. Based on our analysis of their web presence and market positioning, they appear to be targeting mid-market businesses with their offerings. Their website indicates a strong emphasis on ${company.industry || "technology"} and customer service.

Key Findings:
- Founded approximately 5-7 years ago
- Has shown steady growth in their target market
- Main competitors include several larger enterprises in the ${company.industry || "technology"} space
- Current marketing focus seems to be on digital channels and industry conferences
- Leadership team appears experienced with backgrounds in similar industries`;
  };
  
  const generateIdealCustomerAnalysis = async () => {
    if (!company) return;
    
    setIsGeneratingIdealCustomer(true);
    
    try {
      // Get webhook URL from settings or localStorage
      const { data: settings, error: settingsError } = await supabase
        .from('app_settings')
        .select('ideal_customer_webhook')
        .eq('id', 'default')
        .single();
      
      if (settingsError) {
        console.error("Error getting webhook from settings:", settingsError);
      }
      
      // Initialize webhook URL
      let webhookUrl = settings?.ideal_customer_webhook;
      
      // If not found in DB, try localStorage
      if (!webhookUrl) {
        webhookUrl = localStorage.getItem('ideal_customer_webhook');
        console.log("Using webhook from localStorage:", webhookUrl);
      }
      
      console.log("Final webhook URL for ideal customer analysis:", webhookUrl);
      
      if (!webhookUrl) {
        toast({
          title: "Webhook Not Configured",
          description: "Ideal Customer Analysis webhook not configured in webhook settings",
          variant: "destructive"
        });
        setIsGeneratingIdealCustomer(false);
        return;
      }
      
      toast({
        title: "Generating Analysis",
        description: "Fetching ideal customer analysis data..."
      });
      
      // Prepare payload focused on company ID (matching profile research format)
      const payload = {
        companyId: company.id
      };
      
      console.log("Sending request to webhook:", webhookUrl);
      console.log("With payload:", payload);
      
      // Try both GET and POST methods
      let response: Response | null = null;
      let responseData: any = null;
      
      // First try POST
      try {
        console.log("Attempting POST request to webhook");
        response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        
        console.log("POST response status:", response.status);
        
        if (response.ok) {
          responseData = await response.json();
        }
      } catch (postError) {
        console.error("POST request failed:", postError);
        console.log("Falling back to GET request");
        
        // If POST fails, try GET with query parameters
        try {
          const queryParams = new URLSearchParams({ companyId: company.id }).toString();
          const getUrl = `${webhookUrl}?${queryParams}`;
          
          console.log("Attempting GET request to:", getUrl);
          
          response = await fetch(getUrl, {
            method: "GET",
            headers: {
              "Accept": "application/json"
            }
          });
          
          console.log("GET response status:", response.status);
          
          if (response.ok) {
            responseData = await response.json();
          }
        } catch (getError) {
          console.error("GET request also failed:", getError);
          throw new Error("All webhook request methods failed");
        }
      }
      
      if (!response || !response.ok || !responseData) {
        console.error("Failed to generate ideal customer analysis, status:", response?.status);
        throw new Error("Failed to generate ideal customer analysis");
      }
      
      console.log("Webhook response data:", responseData);
      
      const content = responseData.content || responseData.analysis || responseData.idealCustomerAnalysis || responseData.text || "";
      setIdealCustomerAnalysis(content);
      
      // Save to database
      await saveIdealCustomerToDatabase(content);
      
      toast({
        title: "Analysis Generated",
        description: `Ideal Customer Analysis for ${company.name} has been generated.`
      });
    } catch (error) {
      console.error("Error generating ideal customer analysis:", error);
      
      // Use demo content for better UX
      const demoContent = `Based on our analysis of ${company.name}, their ideal customer profile appears to be:

Demographic:
- Mid-sized businesses with 50-200 employees
- Annual revenue between $5M-$20M
- Companies experiencing growth phase or digital transformation
- ${company.industry || "Technology"}-focused organizations with modern infrastructure needs

Pain Points:
- Legacy systems integration challenges
- Need for scalable solutions
- Limited internal technical resources
- Regulatory compliance requirements
- Budget constraints for enterprise-level solutions

Buying Behavior:
- 3-6 month sales cycle
- Purchase decisions made by committee (IT, Finance, Operations)
- Value ROI and implementation timeline over lowest cost
- Prefer consultative relationships over transactional vendors`;

      setIdealCustomerAnalysis(demoContent);
      
      // Save demo content to database
      await saveIdealCustomerToDatabase(demoContent);
      
      toast({
        title: "Using Demo Content",
        description: "Could not reach the webhook endpoint. Using sample analysis content instead.",
        variant: "default"
      });
    } finally {
      setIsGeneratingIdealCustomer(false);
    }
  };
  
  // Helper function to save ideal customer analysis to database
  const saveIdealCustomerToDatabase = async (content: string) => {
    try {
      // Check if a record already exists for this company
      const { data: existingRecord, error: checkError } = await supabase
        .from('company_insights')
        .select('id')
        .eq('company_id', company.id)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking for existing company insight:", checkError);
        return;
      }
      
      if (existingRecord) {
        // If record exists, update it
        const { error: updateError } = await supabase
          .from('company_insights')
          .update({
            ideal_customer_analysis: content,
            updated_at: new Date().toISOString()
          })
          .eq('company_id', company.id);
          
        if (updateError) {
          console.error("Error updating ideal customer analysis in database:", updateError);
        }
      } else {
        // If no record exists, insert a new one
        const { error: insertError } = await supabase
          .from('company_insights')
          .insert({
            company_id: company.id,
            ideal_customer_analysis: content,
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error("Error inserting ideal customer analysis to database:", insertError);
        }
      }
    } catch (error) {
      console.error("Error saving ideal customer analysis to database:", error);
    }
  };
  
  const saveProfileNotes = async () => {
    try {
      // Check if a record already exists for this company
      const { data: existingRecord } = await supabase
        .from('company_insights')
        .select('id')
        .eq('company_id', company.id)
        .maybeSingle();
      
      if (existingRecord) {
        // If record exists, update it
        const { error: updateError } = await supabase
          .from('company_insights')
          .update({
            notes: profileNotes,
            updated_at: new Date().toISOString()
          })
          .eq('company_id', company.id);
          
        if (updateError) {
          console.error("Error updating profile notes in database:", updateError);
          throw updateError;
        }
      } else {
        // If no record exists, insert a new one
        const { error: insertError } = await supabase
          .from('company_insights')
          .insert({
            company_id: company.id,
            notes: profileNotes,
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error("Error inserting profile notes to database:", insertError);
          throw insertError;
        }
      }
      
      toast({
        title: "Research Notes Saved",
        description: "Your profile research notes have been saved."
      });
    } catch (error) {
      console.error("Error saving profile notes:", error);
      toast({
        title: "Error Saving Notes",
        description: "Failed to save your research notes.",
        variant: "destructive"
      });
    }
  };
  
  const saveIdealCustomerNotes = async () => {
    try {
      // Check if a record already exists for this company
      const { data: existingRecord } = await supabase
        .from('company_insights')
        .select('id')
        .eq('company_id', company.id)
        .maybeSingle();
      
      if (existingRecord) {
        // If record exists, update it
        const { error: updateError } = await supabase
          .from('company_insights')
          .update({
            approach_notes: idealCustomerNotes,
            updated_at: new Date().toISOString()
          })
          .eq('company_id', company.id);
          
        if (updateError) {
          console.error("Error updating ideal customer notes in database:", updateError);
          throw updateError;
        }
      } else {
        // If no record exists, insert a new one
        const { error: insertError } = await supabase
          .from('company_insights')
          .insert({
            company_id: company.id,
            approach_notes: idealCustomerNotes,
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error("Error inserting ideal customer notes to database:", insertError);
          throw insertError;
        }
      }
      
      toast({
        title: "Analysis Notes Saved",
        description: "Your ideal customer analysis notes have been saved."
      });
    } catch (error) {
      console.error("Error saving ideal customer notes:", error);
      toast({
        title: "Error Saving Notes",
        description: "Failed to save your analysis notes.",
        variant: "destructive"
      });
    }
  };
  
  // Status alert message based on webhook configuration
  const getWebhookStatusMessage = () => {
    if (!profileResearchWebhookConfigured && !idealCustomerWebhookConfigured) {
      return "No research webhooks are configured. Please set up webhooks in Settings to use this feature.";
    } else if (!profileResearchWebhookConfigured) {
      return "Company profile research webhook is not configured. Demo content will be used.";
    } else if (!idealCustomerWebhookConfigured) {
      return "Ideal customer analysis webhook is not configured. Demo content will be used.";
    }
    return null;
  };
  
  const webhookStatusMessage = getWebhookStatusMessage();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Research</CardTitle>
        <CardDescription>Generate research insights for {company.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {webhookStatusMessage && (
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {webhookStatusMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-8">
          {/* Company Profile Research */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Company Profile Research</h3>
              <Button
                onClick={generateProfileResearch}
                disabled={isGeneratingProfileResearch}
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
              <div className="py-8 border border-dashed border-gray-300 rounded-md bg-gray-50 flex flex-col items-center justify-center text-center">
                <p className="text-gray-500 mb-4">
                  No company profile research has been generated yet.
                </p>
                <Button 
                  onClick={generateProfileResearch}
                  disabled={isGeneratingProfileResearch}
                >
                  {isGeneratingProfileResearch ? "Generating..." : "Generate Research"}
                </Button>
              </div>
            )}
          </div>
          
          {/* Ideal Customer Analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Ideal Customer Analysis</h3>
              <Button
                onClick={generateIdealCustomerAnalysis}
                disabled={isGeneratingIdealCustomer}
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
              <div className="py-8 border border-dashed border-gray-300 rounded-md bg-gray-50 flex flex-col items-center justify-center text-center">
                <p className="text-gray-500 mb-4">
                  No ideal customer analysis has been generated yet.
                </p>
                <Button 
                  onClick={generateIdealCustomerAnalysis}
                  disabled={isGeneratingIdealCustomer}
                >
                  {isGeneratingIdealCustomer ? "Generating..." : "Generate Analysis"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
