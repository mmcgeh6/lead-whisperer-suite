
import { Company } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users, Globe, Phone, Briefcase, Hash, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface CompanyBannerProps {
  company: Company;
  isEnriching: boolean;
  handleEnrichCompany: () => void;
}

export const CompanyBanner = ({ company, isEnriching, handleEnrichCompany }: CompanyBannerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportToCRM = async () => {
    setIsExporting(true);
    
    try {
      // Get the CRM export webhook URL from localStorage
      const crmExportWebhook = localStorage.getItem('crm_export_webhook');
      
      if (!crmExportWebhook) {
        toast({
          title: "Configuration Error",
          description: "CRM export webhook URL not configured. Please check your settings.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        company_id: company.id,
        company_name: company.name,
        user_email: user?.email
      };

      console.log("Exporting to CRM with payload:", payload);

      const response = await fetch(crmExportWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Export Successful",
        description: "Company has been exported to CRM successfully.",
      });
    } catch (error) {
      console.error("Error exporting to CRM:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export company to CRM. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{company.name}</h1>
              {company.website && (
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                  title="Visit website"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 mt-2">
              <div className="flex items-center text-gray-600">
                <Building2 className="h-4 w-4 mr-2" /> 
                <span>{company.industry || "Unknown industry"}</span>
              </div>
              {company.industry_vertical && (
                <div className="flex items-center text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2" /> 
                  <span>{company.industry_vertical}</span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" /> 
                <span>{company.city && company.state ? `${company.city}, ${company.state}` : company.location || "Unknown location"}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="h-4 w-4 mr-2" /> 
                <span>{company.size || "Unknown size"}</span>
              </div>
              {company.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2" /> 
                  <span>{company.phone}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center text-gray-600">
                  <Globe className="h-4 w-4 mr-2" /> 
                  <span>{company.website.replace(/^https?:\/\//, '')}</span>
                </div>
              )}
              {company.tags && company.tags.length > 0 && (
                <div className="flex items-center text-gray-600 col-span-3 flex-wrap">
                  <Hash className="h-4 w-4 mr-2 flex-shrink-0" /> 
                  <div className="flex flex-wrap gap-2">
                    {company.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 md:self-start">
            <Button 
              variant="secondary"
              onClick={handleEnrichCompany}
              disabled={isEnriching || !company.linkedin_url}
              className="relative"
            >
              {isEnriching ? (
                <>
                  <span className="animate-pulse mr-2">●</span>
                  Enriching...
                </>
              ) : (
                "Enrich Company"
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportToCRM}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export to CRM"
              )}
            </Button>
            <Button onClick={() => navigate(`/leads/edit/${company.id}`)}>
              Edit Company
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
