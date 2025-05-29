
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Code, ExternalLink } from "lucide-react";
import { Company } from "@/types";

interface TechStackInsightProps {
  company: Company;
}

export const TechStackInsight = ({ company }: TechStackInsightProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [techStackData, setTechStackData] = useState<string>("");
  const { toast } = useToast();

  const handleGenerateTechStack = async () => {
    setIsLoading(true);
    
    try {
      console.log("Generating tech stack analysis for:", company.name);
      
      // Get the tech stack webhook URL from localStorage
      const techStackWebhook = localStorage.getItem('tech_stack_webhook');
      
      if (!techStackWebhook) {
        toast({
          title: "Configuration Error",
          description: "Tech stack webhook URL not configured. Please check your settings.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        company_name: company.name,
        company_website: company.website,
        company_description: company.description,
        company_industry: company.industry
      };

      console.log("Sending tech stack request with payload:", payload);

      const response = await fetch(techStackWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      console.log("Tech stack response:", data);
      
      setTechStackData(data);
      
      toast({
        title: "Tech Stack Generated",
        description: "Technology stack analysis has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating tech stack:", error);
      toast({
        title: "Error",
        description: "Failed to generate tech stack analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Tech Stack Analysis
            </CardTitle>
            <CardDescription>
              Discover the technology stack used by {company.name}
            </CardDescription>
          </div>
          <Button 
            onClick={handleGenerateTechStack} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Code className="mr-2 h-4 w-4" />
                Analyze Tech Stack
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {techStackData ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Technology Analysis</h4>
              <div className="text-sm whitespace-pre-wrap">
                {techStackData}
              </div>
            </div>
            {company.website && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                <span>Analysis based on: {company.website}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Analyze Tech Stack" to discover the technologies used by this company</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
