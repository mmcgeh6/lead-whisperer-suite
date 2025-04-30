
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppContext } from "@/context/AppContext";
import { Company } from "@/types";
import { Eye, Edit, Building2, MapPin, Users } from "lucide-react";

interface CompanyListProps {
  newLeads?: Partial<Company>[];
  selectedCompanies?: string[];
  onCompanySelect?: (id: string, selected: boolean) => void;
  hideOptions?: boolean;
}

export const CompanyList = ({ 
  newLeads = [], 
  selectedCompanies = [], 
  onCompanySelect,
  hideOptions = false
}: CompanyListProps) => {
  const { companies } = useAppContext();
  const [displayCompanies, setDisplayCompanies] = useState<Array<Company | (Partial<Company> & {id: string})>>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Combine existing companies with any new leads
    const allCompanies = [...companies];
    
    if (newLeads && newLeads.length > 0) {
      // Only add leads that have an id field
      const validNewLeads = newLeads.filter(lead => lead.id) as Array<Partial<Company> & {id: string}>;
      allCompanies.unshift(...validNewLeads);
    }
    
    setDisplayCompanies(allCompanies);
  }, [companies, newLeads]);

  const handleViewCompany = (id: string) => {
    navigate(`/leads/company/${id}`);
  };

  const handleEditCompany = (id: string) => {
    navigate(`/leads/company/${id}/edit`);
  };
  
  if (displayCompanies.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500 mb-4">No companies found</p>
        <Button onClick={() => navigate("/leads/company/new")}>
          Add Your First Company
        </Button>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {displayCompanies.map((company) => (
        <Card key={company.id} className="shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              {!hideOptions && onCompanySelect && (
                <Checkbox
                  id={`company-${company.id}`}
                  checked={selectedCompanies?.includes(company.id)}
                  onCheckedChange={(checked) => {
                    onCompanySelect(company.id, !!checked);
                  }}
                />
              )}
              <div>
                <h3 className="text-lg font-semibold">{company.name}</h3>
                <div className="text-gray-500 flex items-center space-x-2">
                  {company.industry && (
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      <span>{company.industry}</span>
                    </div>
                  )}
                  {company.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{company.location}</span>
                    </div>
                  )}
                  {company.size && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{company.size}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!hideOptions && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleViewCompany(company.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEditCompany(company.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
