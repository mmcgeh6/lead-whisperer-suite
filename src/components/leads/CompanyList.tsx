
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Company } from "@/types";
import { Search, Building2, MapPin, Tag, Users } from "lucide-react";

interface CompanyListProps {
  newLeads?: Partial<Company>[];
  selectedCompanies?: string[];
  onCompanySelect?: (id: string, isSelected: boolean) => void;
}

export const CompanyList = ({ 
  newLeads = [],
  selectedCompanies = [],
  onCompanySelect
}: CompanyListProps) => {
  const { companies, setSelectedCompany } = useAppContext();
  const navigate = useNavigate();
  
  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    navigate(`/leads/${company.id}`);
  };

  const handleCheckboxChange = (company: Company, checked: boolean) => {
    if (onCompanySelect) {
      onCompanySelect(company.id, checked);
    }
  };
  
  const displayCompanies = [
    ...newLeads.map(lead => ({ 
      ...lead,
      id: lead.id || `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    })),
    ...companies
  ];
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Companies</CardTitle>
        <Button size="sm" onClick={() => navigate("/leads/new")}>
          Add Company
        </Button>
      </CardHeader>
      <CardContent>
        {displayCompanies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No companies found.</p>
            <Button className="mt-4" onClick={() => navigate("/leads/new")}>
              Add Your First Company
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayCompanies.map((company: any) => (
              <Card 
                key={company.id} 
                className={`hover:shadow-md transition-shadow border-l-4 ${
                  company.insights?.idealClient ? "border-l-green-500" : "border-l-gray-200"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {onCompanySelect && (
                      <Checkbox
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={(checked: boolean) => 
                          handleCheckboxChange(company as Company, checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                    )}
                    
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => company.id && handleCompanyClick(company as Company)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{company.name}</h3>
                        {company.insights?.idealClient && (
                          <Badge className="ml-2">Ideal Client</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-3">
                        <div className="flex items-center text-sm">
                          <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{company.industry || "Unknown industry"}</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{company.location || "Unknown location"}</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{company.size || "Unknown size"}</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Tag className="h-4 w-4 mr-2 text-gray-500" />
                          {company.createdAt && (
                            <span>Added {formatDistanceToNow(new Date(company.createdAt), { addSuffix: true })}</span>
                          )}
                        </div>
                      </div>
                      
                      {company.description && (
                        <div className="mt-3 text-sm text-gray-600 line-clamp-2">
                          {company.description}
                        </div>
                      )}
                      
                      <div className="flex justify-end mt-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (company.id) handleCompanyClick(company as Company);
                          }}
                        >
                          <Search className="h-4 w-4" /> View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
