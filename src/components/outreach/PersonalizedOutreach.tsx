
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface PersonalizedOutreachProps {
  companyName: string;
}

export const PersonalizedOutreach = ({ companyName }: PersonalizedOutreachProps) => {
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [outreachType, setOutreachType] = useState<"call" | "text" | "social" | "email">("call");
  const { toast } = useToast();

  const generateContent = async (type: "call" | "text" | "social" | "email") => {
    setOutreachType(type);
    setIsGenerating(true);

    try {
      // Get the webhook URL based on the outreach type
      let webhookUrl = "";
      
      switch (type) {
        case "call":
          webhookUrl = import.meta.env.VITE_N8N_CALL_SCRIPT_WEBHOOK || "";
          break;
        case "text":
          webhookUrl = import.meta.env.VITE_N8N_TEXT_SCRIPT_WEBHOOK || "";
          break;
        case "social":
          webhookUrl = import.meta.env.VITE_N8N_SOCIAL_DM_WEBHOOK || "";
          break;
        case "email":
          webhookUrl = import.meta.env.VITE_N8N_EMAIL_SCRIPT_WEBHOOK || "";
          break;
      }
      
      if (!webhookUrl) {
        throw new Error(`N8N webhook URL for ${type} not configured`);
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          outreachType: type,
          additionalContext,
          action: "generateCompanyOutreach"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();
      setGeneratedContent(data.content || "");
      
      toast({
        title: "Content Generated",
        description: `Your ${getOutreachTypeName(type)} script has been generated.`,
      });
    } catch (error) {
      console.error(`Error generating ${type} script:`, error);
      toast({
        title: "Generation Failed",
        description: `Failed to generate ${getOutreachTypeName(type)} script. Please try again.`,
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
          disabled={isGenerating}
          variant="outline"
          className="flex-1 md:flex-none"
        >
          {isGenerating && outreachType === "call" ? "Generating..." : "Generate Call Script"}
        </Button>
        <Button 
          onClick={() => generateContent("email")} 
          disabled={isGenerating}
          variant="outline"
          className="flex-1 md:flex-none"
        >
          {isGenerating && outreachType === "email" ? "Generating..." : "Generate Email Script"}
        </Button>
        <Button 
          onClick={() => generateContent("text")} 
          disabled={isGenerating}
          variant="outline"
          className="flex-1 md:flex-none"
        >
          {isGenerating && outreachType === "text" ? "Generating..." : "Generate Text Script"}
        </Button>
        <Button 
          onClick={() => generateContent("social")} 
          disabled={isGenerating}
          variant="outline"
          className="flex-1 md:flex-none"
        >
          {isGenerating && outreachType === "social" ? "Generating..." : "Generate Social DM Script"}
        </Button>
      </div>
      
      {generatedContent && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Generated {getOutreachTypeName(outreachType)} Script for {companyName}</h3>
          <div className="p-4 bg-accent rounded-md whitespace-pre-wrap">
            {generatedContent}
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
