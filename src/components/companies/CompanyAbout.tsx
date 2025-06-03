
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Globe, Users, Calendar, DollarSign } from "lucide-react";
import { Company } from "@/types";

interface CompanyAboutProps {
  company: Company;
}

export const CompanyAbout = ({ company }: CompanyAboutProps) => {
  const formatEmployeeCount = (count: number | undefined) => {
    if (!count) return "Not specified";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const formatRevenue = (revenue: number | undefined, printed: string | undefined) => {
    if (printed) return printed;
    if (!revenue) return "Not specified";
    if (revenue < 1000000) return `$${(revenue / 1000).toFixed(0)}K`;
    if (revenue < 1000000000) return `$${(revenue / 1000000).toFixed(1)}M`;
    return `$${(revenue / 1000000000).toFixed(1)}B`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">About Company</h2>
          <div className="flex gap-2">
            {company.industry && (
              <Badge variant="secondary">{company.industry}</Badge>
            )}
            {company.size && (
              <Badge variant="outline">{company.size}</Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {company.description && (
            <p className="text-gray-700 leading-relaxed">{company.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{company.location}</span>
              </div>
            )}
            
            {company.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
            
            {company.estimated_num_employees && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatEmployeeCount(company.estimated_num_employees)} employees</span>
              </div>
            )}
            
            {company.founded_year && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Founded {company.founded_year}</span>
              </div>
            )}
            
            {(company.annual_revenue || company.annual_revenue_printed) && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Revenue: {formatRevenue(company.annual_revenue, company.annual_revenue_printed)}</span>
              </div>
            )}
          </div>
          
          {company.technology_names && company.technology_names.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Technologies Used</h3>
              <div className="flex flex-wrap gap-1">
                {company.technology_names.map((tech, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
