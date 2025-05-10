
import { useState } from "react";
import { Company } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface IdealClientInsightProps {
  company: Company;
}

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
  
  // Handle paragraphs
  html = html.replace(/^([^\n<].*?)(?:\n(?!<|$))/gm, '$1<br>');
  html = html.replace(/^([^\n<].+?)$/gm, '<p>$1</p>');
  
  return html;
};

export const IdealClientInsight = ({ company }: IdealClientInsightProps) => {
  const { updateCompany } = useAppContext();
  const { toast } = useToast();
  
  const [isIdealClient, setIsIdealClient] = useState(company.insights?.idealClient || false);
  const [approach, setApproach] = useState(company.insights?.suggestedApproach || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingApproach, setIsGeneratingApproach] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  
  const handleSave = () => {
    const updatedCompany = { ...company };
    updatedCompany.insights = {
      ...updatedCompany.insights,
      idealClient: isIdealClient,
      suggestedApproach: approach,
    };
    
    updateCompany(updatedCompany);
    setIsEditing(false);
    toast({
      title: "Insights saved",
      description: "Your ideal client insights have been saved successfully",
    });
  };
  
  const generateSuggestedApproach = async () => {
    setIsGeneratingApproach(true);
    setWebhookError(null);
    
    try {
      // Get webhook URL from settings
      const { data: settings, error: settingsError } = await supabase
        .from('app_settings')
        .select('ideal_customer_webhook')
        .eq('id', 'default')
        .single();
      
      if (settingsError) {
        throw new Error("Could not retrieve webhook settings");
      }
      
      // Initialize webhook URL
      let webhookUrl = settings?.ideal_customer_webhook;
      
      // If not found in DB, try localStorage
      if (!webhookUrl) {
        webhookUrl = localStorage.getItem('ideal_customer_webhook');
      }
      
      if (!webhookUrl) {
        throw new Error("Ideal customer webhook not configured in webhook settings");
      }
      
      // Prepare query params for request
      const queryParams = new URLSearchParams({
        companyId: company.id,
        companyName: company.name || '',
        industry: company.industry || '',
        website: company.website || '',
        description: company.description || ''
      }).toString();
      
      // The full URL for the GET request
      const getUrl = `${webhookUrl}?${queryParams}`;
      
      console.log("Sending webhook request to:", getUrl);
      
      // Set timeout to handle webhook failures
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(getUrl, {
        method: "GET",
        headers: {
          "Accept": "text/plain, application/json"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`);
      }
      
      // Try to get the response text
      const responseText = await response.text();
      console.log("Webhook response:", responseText);
      
      // Check if we got a valid response
      if (responseText && responseText.trim().length > 0) {
        setApproach(responseText);
        
        // Save the approach to the company
        const updatedCompany = { ...company };
        updatedCompany.insights = {
          ...updatedCompany.insights,
          suggestedApproach: responseText,
        };
        
        updateCompany(updatedCompany);
        
        toast({
          title: "Approach Generated",
          description: "Suggested approach for this company has been generated",
        });
      } else {
        throw new Error("Webhook returned an empty response");
      }
    } catch (error) {
      console.error("Error generating approach:", error);
      
      // Set error message based on type of error
      const errorMessage = error instanceof Error 
        ? error.name === 'AbortError'
          ? "Webhook request timed out after 30 seconds"
          : error.message
        : "Unknown error occurred when contacting webhook";
      
      setWebhookError(errorMessage);
      
      toast({
        title: "Generation Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Use a fallback/demo approach if webhook fails
      const demoApproach = generateDemoApproach(company);
      setApproach(demoApproach);
      
      // Save the demo approach to the company
      const updatedCompany = { ...company };
      updatedCompany.insights = {
        ...updatedCompany.insights,
        suggestedApproach: demoApproach,
      };
      
      updateCompany(updatedCompany);
      
      toast({
        title: "Using Demo Content",
        description: "Generated sample approach content instead.",
      });
    } finally {
      setIsGeneratingApproach(false);
    }
  };
  
  // Demo approach generator for fallback
  const generateDemoApproach = (company: Company): string => {
    return `## Suggested Sales Approach for ${company.name}

**Key Talking Points:**
- Focus on our response time improvements for incoming leads (high priority pain point)
- Emphasize qualification of leads before sales team involvement
- Highlight integration with their existing CRM system

**Value Proposition:**
- Improve lead response time from minutes to seconds
- Reduce sales team time spent on unqualified leads by 40%
- Increase appointment booking rate by 25-30%

**Objection Handling:**
- "We already have a system" → Emphasize *complementary* nature of our solution
- "Too expensive" → Focus on ROI from increased conversions
- "Not sure if it works" → Offer 14-day pilot program with specific KPIs

**Next Steps:**
1. Initial demo focused on their specific pain points
2. Technical assessment of integration requirements
3. 14-day pilot with concrete success metrics`;
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-medium">Ideal Client Fit</h3>
              <p className="text-sm text-gray-500">
                Is this company a good fit for your product/service?
              </p>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              checked={isIdealClient}
              onCheckedChange={value => isEditing && setIsIdealClient(value)}
              disabled={!isEditing}
            />
            <Label>This company is an ideal client</Label>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="approach">Suggested Approach</Label>
              {!isEditing && !approach && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateSuggestedApproach}
                  disabled={isGeneratingApproach}
                >
                  {isGeneratingApproach ? "Generating..." : "Generate Approach"}
                </Button>
              )}
            </div>
            
            {webhookError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {webhookError}
                </AlertDescription>
              </Alert>
            )}
            
            {isEditing ? (
              <Textarea
                id="approach"
                placeholder="Describe how your product/service can specifically help this company..."
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                rows={4}
              />
            ) : approach ? (
              <div className="bg-accent p-3 rounded-md prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(approach) }} />
              </div>
            ) : isGeneratingApproach ? (
              <div className="p-4 border border-gray-200 rounded animate-pulse flex justify-center">
                <p className="text-sm text-gray-500">Generating approach...</p>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Generate a suggested approach for engaging with this company
                </p>
                <Button 
                  onClick={generateSuggestedApproach}
                  size="sm"
                >
                  Generate Approach
                </Button>
              </div>
            )}
          </div>
          
          {isEditing && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
