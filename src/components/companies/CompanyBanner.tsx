
import { Company } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users, Globe, Phone, Briefcase, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompanyBannerProps {
  company: Company;
  isEnriching: boolean;
  handleEnrichCompany: () => void;
}

export const CompanyBanner = ({ company, isEnriching, handleEnrichCompany }: CompanyBannerProps) => {
  const navigate = useNavigate();

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
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
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline"
                  >
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {company.keywords && company.keywords.length > 0 && (
                <div className="flex items-center text-gray-600 col-span-3 flex-wrap">
                  <Hash className="h-4 w-4 mr-2 flex-shrink-0" /> 
                  <div className="flex flex-wrap gap-2">
                    {company.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
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
            <Button variant="outline" onClick={() => window.open(company.website, "_blank")}>
              Visit Website
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
