
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface PersonalizedOutreachProps {
  companyName: string;
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

export const PersonalizedOutreach = ({ companyName }: PersonalizedOutreachProps) => {
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [outreachType, setOutreachType] = useState<"call" | "text" | "social" | "email">("call");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [loadingScripts, setLoadingScripts] = useState(true);
  const [scripts, setScripts] = useState({
    call: "",
    email: "",
    text: "",
    social: ""
  });
  const { id: companyId } = useParams<{ id: string }>();
  const { toast } = useToast();

  // Fetch the webhook URL and saved scripts when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoadingScripts(true);
      
      try {
        // Fetch webhook URL from Supabase
        const { data: settingsData, error: settingsError } = await supabase
          .from('app_settings')
          .select('outreach_webhook')
          .eq('id', 'default')
          .single();
          
        if (settingsError) {
          console.error("Error fetching outreach webhook URL from Supabase:", settingsError);
          throw settingsError;
        }
        
        if (settingsData?.outreach_webhook) {
          setWebhookUrl(settingsData.outreach_webhook);
          console.log("Loaded outreach webhook URL from DB:", settingsData.outreach_webhook);
        }
        
        // Fetch saved scripts for this company
        if (companyId) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('call_script, email_script, text_script, social_dm_script')
            .eq('id', companyId)
            .single();
            
          if (companyError) {
            console.error("Error fetching company scripts:", companyError);
            throw companyError;
          }
          
          if (companyData) {
            setScripts({
              call: companyData.call_script || "",
              email: companyData.email_script || "",
              text: companyData.text_script || "",
              social: companyData.social_dm_script || ""
            });
            
            console.log("Loaded saved scripts for company:", companyId);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        
        // Try to get from localStorage as fallback
        const savedUrl = localStorage.getItem('outreach_webhook');
        if (savedUrl) {
          setWebhookUrl(savedUrl);
          console.log("Loaded outreach webhook URL from localStorage:", savedUrl);
        }
      } finally {
        setLoadingScripts(false);
      }
    };
    
    fetchData();
  }, [companyId]);

  const generateContent = async (type: "call" | "text" | "social" | "email") => {
    setOutreachType(type);
    setIsGenerating(true);
    
    // Check if we already have a saved script for this type
    const existingScript = scripts[type === "social" ? "social" : type];
    
    // If there's an existing script, use it instead of generating a new one
    if (existingScript) {
      setGeneratedContent(existingScript);
      setIsGenerating(false);
      
      toast({
        title: "Using Saved Script",
        description: `Loaded your saved ${getOutreachTypeName(type)} script.`,
      });
      
      return;
    }
    
    try {
      if (!webhookUrl) {
        throw new Error("Outreach webhook URL not configured");
      }

      // Prepare URL with query parameters
      const url = new URL(webhookUrl);
      url.searchParams.append('companyName', companyName);
      url.searchParams.append('outreachType', type);
      url.searchParams.append('additionalContext', additionalContext);
      
      console.log(`Generating ${type} content for ${companyName} with webhook:`, url.toString());
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "text/plain, application/json",
        },
      });

      if (!response.ok) {
        console.error(`Webhook response not ok. Status: ${response.status}`);
        throw new Error(`Failed to generate content (HTTP ${response.status})`);
      }

      // Try to get response as text
      const responseText = await response.text();
      console.log(`Raw ${type} script response:`, responseText);
      
      // Check if the response is JSON or plain text
      let content;
      try {
        const jsonData = JSON.parse(responseText);
        content = jsonData.content || jsonData.text || jsonData.data || responseText;
        console.log(`Parsed JSON ${type} content:`, content);
      } catch (e) {
        // If not JSON, use the response text directly
        content = responseText;
        console.log(`Using raw text as ${type} content`);
      }

      setGeneratedContent(content || "");
      
      toast({
        title: "Content Generated",
        description: `Your ${getOutreachTypeName(type)} script has been generated.`,
      });
    } catch (error) {
      console.error(`Error generating ${type} script:`, error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : `Failed to generate ${getOutreachTypeName(type)} script. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveScript = async () => {
    if (!companyId || !generatedContent) return;
    
    setIsSaving(true);
    
    try {
      // Determine which column to update based on outreachType
      let updateData: Record<string, string> = {};
      
      switch (outreachType) {
        case "call":
          updateData = { call_script: generatedContent };
          break;
        case "email":
          updateData = { email_script: generatedContent };
          break;
        case "text":
          updateData = { text_script: generatedContent };
          break;
        case "social":
          updateData = { social_dm_script: generatedContent };
          break;
      }
      
      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId);
        
      if (error) {
        throw error;
      }
      
      // Update local state to reflect the saved script
      setScripts(prev => ({
        ...prev,
        [outreachType === "social" ? "social" : outreachType]: generatedContent
      }));
      
      toast({
        title: "Script Saved",
        description: `Your ${getOutreachTypeName(outreachType)} script has been saved.`,
      });
    } catch (error) {
      console.error("Error saving script:", error);
      toast({
        title: "Save Failed",
        description: "Unable to save the script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getOutreachTypeName = (type: string): string => {
    switch (type) {
      case "call": return "call";
      case "text": return "text message";
      case "social": return "social media DM";
      case "email": return "email";
      default: return type;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copied to Clipboard",
      description: "The content has been copied to your clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Additional Context (Optional)</label>
        <Textarea
          placeholder="Add any specific details about the company or industry insights to customize the outreach content..."
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          rows={3}
        />
      </div>
      
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="saved" disabled={loadingScripts}>
            {loadingScripts ? "Loading..." : "Saved Scripts"}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate">
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => generateContent("call")} 
              disabled={isGenerating || !webhookUrl}
              variant="outline"
              className="flex-1 md:flex-none"
            >
              {isGenerating && outreachType === "call" ? "Generating..." : "Generate Call Script"}
            </Button>
            <Button 
              onClick={() => generateContent("email")} 
              disabled={isGenerating || !webhookUrl}
              variant="outline"
              className="flex-1 md:flex-none"
            >
              {isGenerating && outreachType === "email" ? "Generating..." : "Generate Email Script"}
            </Button>
            <Button 
              onClick={() => generateContent("text")} 
              disabled={isGenerating || !webhookUrl}
              variant="outline"
              className="flex-1 md:flex-none"
            >
              {isGenerating && outreachType === "text" ? "Generating..." : "Generate Text Script"}
            </Button>
            <Button 
              onClick={() => generateContent("social")} 
              disabled={isGenerating || !webhookUrl}
              variant="outline"
              className="flex-1 md:flex-none"
            >
              {isGenerating && outreachType === "social" ? "Generating..." : "Generate Social DM Script"}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="saved">
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => {
                setOutreachType("call");
                setGeneratedContent(scripts.call);
              }} 
              variant="outline"
              disabled={!scripts.call}
              className="flex-1 md:flex-none"
            >
              {scripts.call ? "View Call Script" : "No Call Script"}
            </Button>
            <Button 
              onClick={() => {
                setOutreachType("email");
                setGeneratedContent(scripts.email);
              }} 
              variant="outline"
              disabled={!scripts.email}
              className="flex-1 md:flex-none"
            >
              {scripts.email ? "View Email Script" : "No Email Script"}
            </Button>
            <Button 
              onClick={() => {
                setOutreachType("text");
                setGeneratedContent(scripts.text);
              }} 
              variant="outline"
              disabled={!scripts.text}
              className="flex-1 md:flex-none"
            >
              {scripts.text ? "View Text Script" : "No Text Script"}
            </Button>
            <Button 
              onClick={() => {
                setOutreachType("social");
                setGeneratedContent(scripts.social);
              }} 
              variant="outline"
              disabled={!scripts.social}
              className="flex-1 md:flex-none"
            >
              {scripts.social ? "View Social DM Script" : "No Social DM Script"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {!webhookUrl && (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-800" />
          <AlertDescription className="text-yellow-800 text-sm">
            Outreach webhook is not configured. Please set it up in Settings → Webhooks.
          </AlertDescription>
        </Alert>
      )}
      
      {loadingScripts ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : generatedContent && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">
            {getOutreachTypeName(outreachType).charAt(0).toUpperCase() + getOutreachTypeName(outreachType).slice(1)} Script for {companyName}
          </h3>
          <div className="p-4 bg-accent rounded-md prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(generatedContent) }} />
          </div>
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={copyToClipboard}>
              Copy to Clipboard
            </Button>
            <Button 
              variant="default" 
              onClick={saveScript} 
              disabled={isSaving || !companyId}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Script"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
