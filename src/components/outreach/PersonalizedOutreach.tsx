
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PersonalizedOutreachProps {
  companyName: string;
}

// Simple markdown to HTML converter (same as in IdealClientInsight)
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
  const [outreachType, setOutreachType] = useState<"call" | "text" | "social" | "email">("call");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const { toast } = useToast();

  // Fetch the webhook URL when the component mounts
  useEffect(() => {
    const fetchWebhookUrl = async () => {
      try {
        // Try to get the webhook URL from Supabase
        const { data, error } = await supabase
          .from('app_settings')
          .select('outreach_webhook')
          .eq('id', 'default')
          .single();
          
        if (error) {
          console.error("Error fetching outreach webhook URL from Supabase:", error);
          throw error;
        }
        
        if (data?.outreach_webhook) {
          setWebhookUrl(data.outreach_webhook);
          console.log("Loaded outreach webhook URL from DB:", data.outreach_webhook);
        }
      } catch (error) {
        console.error("Failed to load outreach webhook URL from Supabase:", error);
        
        // Try to get from localStorage as fallback
        const savedUrl = localStorage.getItem('outreach_webhook');
        if (savedUrl) {
          setWebhookUrl(savedUrl);
          console.log("Loaded outreach webhook URL from localStorage:", savedUrl);
        }
      }
    };
    
    fetchWebhookUrl();
  }, []);

  const generateContent = async (type: "call" | "text" | "social" | "email") => {
    setOutreachType(type);
    setIsGenerating(true);

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
      
      {!webhookUrl && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            Outreach webhook is not configured. Please set it up in Settings → Webhooks.
          </p>
        </div>
      )}
      
      {generatedContent && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Generated {getOutreachTypeName(outreachType)} Script for {companyName}</h3>
          <div className="p-4 bg-accent rounded-md prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(generatedContent) }} />
          </div>
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={copyToClipboard}>
              Copy to Clipboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
