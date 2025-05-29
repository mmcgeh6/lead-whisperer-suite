
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Code, ExternalLink, Globe, ShoppingCart, BarChart3, MessageCircle, Zap, Shield } from "lucide-react";
import { Company } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface TechStackInsightProps {
  company: Company;
}

interface TechStackData {
  company: string;
  url: string;
  scan_timestamp: string;
  total_technologies_detected: number;
  technologies: {
    cms_platforms: string[];
    ecommerce: string[];
    page_builders: string[];
    web_analytics: string[];
    tag_management: string[];
    heat_mapping: string[];
    email_marketing: string[];
    social_media: string[];
    ad_networks: string[];
    ssl_certificates: string[];
    security_services: string[];
    chat_widgets: string[];
    ai_connections: string[];
  };
  summary: {
    has_cms: boolean;
    has_ecommerce: boolean;
    has_analytics: boolean;
    has_chat_widget: boolean;
    has_ai_integration: boolean;
  };
}

export const TechStackInsight = ({ company }: TechStackInsightProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [techStackData, setTechStackData] = useState<TechStackData | null>(null);
  const { toast } = useToast();

  // Load existing tech stack data on component mount
  useEffect(() => {
    const loadExistingTechStack = async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('tech_stack_data, tech_stack_last_updated')
          .eq('id', company.id)
          .single();

        if (error) {
          console.error("Error loading tech stack data:", error);
          return;
        }

        if (data?.tech_stack_data) {
          // Properly cast the JSON data to our TechStackData type
          setTechStackData(data.tech_stack_data as unknown as TechStackData);
        }
      } catch (error) {
        console.error("Error loading tech stack data:", error);
      }
    };

    loadExistingTechStack();
  }, [company.id]);

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

      const data = await response.json();
      console.log("Tech stack response:", data);
      
      // Handle both array and single object responses
      const techStackResult = Array.isArray(data) ? data[0] : data;
      
      if (techStackResult) {
        setTechStackData(techStackResult);
        
        // Store the tech stack data in the database
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            tech_stack_data: techStackResult,
            tech_stack_last_updated: new Date().toISOString()
          })
          .eq('id', company.id);

        if (updateError) {
          console.error("Error storing tech stack data:", updateError);
        }
        
        toast({
          title: "Tech Stack Generated",
          description: "Technology stack analysis has been generated successfully.",
        });
      }
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cms_platforms':
      case 'page_builders':
        return <Globe className="h-4 w-4" />;
      case 'ecommerce':
        return <ShoppingCart className="h-4 w-4" />;
      case 'web_analytics':
      case 'tag_management':
      case 'heat_mapping':
        return <BarChart3 className="h-4 w-4" />;
      case 'chat_widgets':
        return <MessageCircle className="h-4 w-4" />;
      case 'ai_connections':
        return <Zap className="h-4 w-4" />;
      case 'security_services':
      case 'ssl_certificates':
        return <Shield className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderTechStackData = () => {
    if (!techStackData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">{techStackData.total_technologies_detected}</div>
            <div className="text-sm text-muted-foreground">Technologies</div>
          </div>
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-lg font-semibold">{techStackData.summary.has_cms ? '✓' : '✗'}</div>
            <div className="text-sm text-muted-foreground">CMS</div>
          </div>
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-lg font-semibold">{techStackData.summary.has_ecommerce ? '✓' : '✗'}</div>
            <div className="text-sm text-muted-foreground">E-commerce</div>
          </div>
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-lg font-semibold">{techStackData.summary.has_analytics ? '✓' : '✗'}</div>
            <div className="text-sm text-muted-foreground">Analytics</div>
          </div>
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-lg font-semibold">{techStackData.summary.has_ai_integration ? '✓' : '✗'}</div>
            <div className="text-sm text-muted-foreground">AI Integration</div>
          </div>
        </div>

        {/* Technologies by Category */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Technologies Detected</h4>
          {Object.entries(techStackData.technologies).map(([category, technologies]) => {
            if (!technologies || technologies.length === 0) return null;
            
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <h5 className="font-medium">{formatCategoryName(category)}</h5>
                </div>
                <div className="flex flex-wrap gap-2 ml-6">
                  {technologies.map((tech, index) => (
                    <Badge key={index} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scan Information */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            <span>Scanned: {techStackData.url}</span>
          </div>
          <div>
            <span>Last updated: {new Date(techStackData.scan_timestamp).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
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
                {techStackData ? 'Refresh Analysis' : 'Analyze Tech Stack'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {techStackData ? (
          renderTechStackData()
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
