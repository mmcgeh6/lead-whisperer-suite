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
  
  const [isGeneratingProfileResearch, setIsGeneratingProfileResearch] = useState(false);
  const [isGeneratingIdealCustomer, setIsGeneratingIdealCustomer] = useState(false);
  const [profileResearch, setProfileResearch] = useState("");
  const [idealCustomerAnalysis, setIdealCustomerAnalysis] = useState("");
  const [profileNotes, setProfileNotes] = useState("");
  const [idealCustomerNotes, setIdealCustomerNotes] = useState("");
  
  // Track webhook configuration status
  const [profileResearchWebhookConfigured, setProfileResearchWebhookConfigured] = useState(false);
  const [idealCustomerWebhookConfigured, setIdealCustomerWebhookConfigured] = useState(false);
  
  // Find company - this is safe to do after hooks since it's just a filter operation
  const company = companies.find((c) => c.id === companyId);
  
  // On component mount, check if company has existing research data
  useEffect(() => {
    // Early return if no company - but this is inside useEffect which is okay
    if (!company) return;
    
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
  }, [companyId, company, profileResearchWebhookConfigured, idealCustomerWebhookConfigured]);
  
  // Check if company exists AFTER all hooks have been called
  if (!company) {
    return <div>Company not found</div>;
  }
  
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
      
      // Prepare query params for GET request
      const queryParams = new URLSearchParams({
        companyId: company.id,
        companyName: company.name || '',
        industry: company.industry || '',
        website: company.website || '',
        description: company.description || ''
      }).toString();
      
      // The full URL for the GET request
      const getUrl = `${webhookUrl}?${queryParams}`;
      
      console.log("Sending GET request to:", getUrl);
      
      const response = await fetch(getUrl, {
        method: "GET",
        headers: {
          "Accept": "text/plain, application/json"
        }
      });
      
      console.log("GET response status:", response.status);
      
      if (!response.ok) {
        console.error("GET request failed with status:", response.status);
        throw new Error(`Failed to get company profile research, status: ${response.status}`);
      }
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log("Raw webhook response:", responseText);
      
      // Use the text response directly for markdown content
      if (responseText && responseText.trim().length > 0) {
        setProfileResearch(responseText);
        await saveProfileResearchToDatabase(responseText);
        
        toast({
          title: "Research Generated",
          description: `Company Profile Research for ${company.name} has been generated.`
        });
      } else {
        throw new Error("Empty response received from webhook");
      }
    } catch (error) {
      console.error("Error generating profile research:", error);
      
      // Use demo content for better UX
      const demoContent = generateDemoProfileResearch(company);
      setProfileResearch(demoContent);
      
      // Save demo content to database
      await saveProfileResearchToDatabase(demoContent);
      
      toast({
        title: "Using Demo Content",
        description: "Could not reach the webhook endpoint or parse the response. Using sample research content instead.",
        variant: "default"
      });
    } finally {
      setIsGeneratingProfileResearch(false);
    }
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
        } else {
          console.log("Successfully updated profile research in database");
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
        } else {
          console.log("Successfully inserted profile research to database");
        }
      }
    } catch (error) {
      console.error("Error saving research to database:", error);
    }
  };
  
  const generateDemoProfileResearch = (company: any) => {
    return `## ${company.name} Overview

**Company Name:** ${company.name}

**Industry:** ${company.industry || "Unknown"}

**Key Information:**
- Founded approximately 5-7 years ago
- Has shown steady growth in their target market
- Main competitors include several larger enterprises in the ${company.industry || "technology"} space
- Current marketing focus seems to be on digital channels and industry conferences
- Leadership team appears experienced with backgrounds in similar industries

---

## Market Position
${company.name} appears to be positioning itself as a quality-focused provider in the ${company.industry || "technology"} sector, with particular emphasis on customer satisfaction and innovation.

---

## Recommendations
Based on our analysis, ${company.name} would benefit from solutions that help scale operations while maintaining their quality standards and customer focus.`;
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
      
      // Prepare query params for GET request
      const queryParams = new URLSearchParams({
        companyId: company.id,
        companyName: company.name || '',
        industry: company.industry || '',
        website: company.website || '',
        description: company.description || ''
      }).toString();
      
      // The full URL for the GET request
      const getUrl = `${webhookUrl}?${queryParams}`;
      
      console.log("Sending GET request to:", getUrl);
      
      const response = await fetch(getUrl, {
        method: "GET",
        headers: {
          "Accept": "text/plain, application/json"
        }
      });
      
      console.log("GET response status:", response.status);
      
      if (!response.ok) {
        console.error("GET request failed with status:", response.status);
        throw new Error(`Failed to get ideal customer analysis, status: ${response.status}`);
      }
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log("Raw webhook response:", responseText);
      
      // Use the text response directly for markdown content
      if (responseText && responseText.trim().length > 0) {
        setIdealCustomerAnalysis(responseText);
        await saveIdealCustomerToDatabase(responseText);
        
        toast({
          title: "Analysis Generated",
          description: `Ideal Customer Analysis for ${company.name} has been generated.`
        });
      } else {
        throw new Error("Empty response received from webhook");
      }
    } catch (error) {
      console.error("Error generating ideal customer analysis:", error);
      
      // Use demo content for better UX
      const demoContent = generateDemoIdealCustomerAnalysis(company);
      setIdealCustomerAnalysis(demoContent);
      
      // Save demo content to database
      await saveIdealCustomerToDatabase(demoContent);
      
      toast({
        title: "Using Demo Content",
        description: "Could not reach the webhook endpoint or parse the response. Using sample analysis content instead.",
        variant: "default"
      });
    } finally {
      setIsGeneratingIdealCustomer(false);
    }
  };
  
  const generateDemoIdealCustomerAnalysis = (company: any) => {
    return `## Ideal Customer Profile for ${company.name}

**Demographic:**
- Mid-sized businesses with 50-200 employees
- Annual revenue between $5M-$20M
- Companies experiencing growth phase or digital transformation
- ${company.industry || "Technology"}-focused organizations with modern infrastructure needs

---

**Pain Points:**
- Legacy systems integration challenges
- Need for scalable solutions
- Limited internal technical resources
- Regulatory compliance requirements
- Budget constraints for enterprise-level solutions

---

**Buying Behavior:**
- 3-6 month sales cycle
- Purchase decisions made by committee (IT, Finance, Operations)
- Value ROI and implementation timeline over lowest cost
- Prefer consultative relationships over transactional vendors`;
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
        } else {
          console.log("Successfully updated ideal customer analysis in database");
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
        } else {
          console.log("Successfully inserted ideal customer analysis to database");
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
                <div className="bg-accent p-4 rounded-md whitespace-pre-wrap prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(profileResearch) }} />
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
                <div className="bg-accent p-4 rounded-md whitespace-pre-wrap prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(idealCustomerAnalysis) }} />
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

// Simple markdown to HTML converter
const renderMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  // Handle headers
  let html = markdown
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
  // Handle bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Handle links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Handle unordered lists
  html = html.replace(/^\s*-\s*(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>');
  
  // Handle horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  
  // Handle paragraphs - group consecutive lines that don't contain HTML elements
  html = html.replace(/^([^\n<].*?)(?:\n(?!<|$))/gm, '$1<br>');
  html = html.replace(/^([^\n<].+?)$/gm, '<p>$1</p>');
  
  // Handle tables (basic support)
  // Find table blocks
  html = html.replace(/^\|(.*)\|$/gm, '<tr><td>$1</td></tr>')
    .replace(/<td>(.*?)\|/g, '<td>$1</td><td>')
    .replace(/(<tr>.*<\/tr>\n)+/g, '<table class="border-collapse border border-gray-300 w-full">$&</table>');
  
  return html;
}
