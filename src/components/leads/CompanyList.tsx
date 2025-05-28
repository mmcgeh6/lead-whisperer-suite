
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Building2, Globe, MapPin, Users, Phone, MoreVertical, Edit, List } from "lucide-react";
import { Company } from "@/types";
import { Link } from "react-router-dom";
import { CompanyListManager } from "@/components/leads/search/CompanyListManager";

interface CompanyListProps {
  newLeads: Partial<Company>[];
  selectedCompanies: string[];
  onCompanySelect: (id: string, isSelected: boolean) => void;
}

export const CompanyList = ({ 
  newLeads, 
  selectedCompanies, 
  onCompanySelect 
}: CompanyListProps) => {
  const [listManagerOpen, setListManagerOpen] = useState(false);
  const [selectedCompanyForList, setSelectedCompanyForList] = useState<{id: string, name: string} | null>(null);

  const handleManageLists = (company: Partial<Company>) => {
    if (company.id && company.name) {
      setSelectedCompanyForList({
        id: company.id,
        name: company.name
      });
      setListManagerOpen(true);
    }
  };

  if (!newLeads || newLeads.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No companies found</h3>
            <p className="mb-4">Start by searching for new leads or add companies manually.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {newLeads.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedCompanies.includes(company.id || "")}
                    onCheckedChange={(checked) => {
                      if (company.id) {
                        onCompanySelect(company.id, checked === true);
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                      {company.name || "Unknown Company"}
                    </CardTitle>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {company.industry && (
                        <Badge variant="secondary">{company.industry}</Badge>
                      )}
                      {company.size && (
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {company.size}
                        </span>
                      )}
                      {company.location && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {company.location}
                        </span>
                      )}
                      {company.phone && (
                        <span className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {company.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/leads/company/${company.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Company
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleManageLists(company)}>
                      <List className="h-4 w-4 mr-2" />
                      Manage Lists
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent>
              {company.website && (
                <div className="flex items-center mb-3">
                  <Globe className="h-4 w-4 mr-2 text-gray-500" />
                  <a 
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              )}
              
              {company.description && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {company.description}
                </p>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {company.createdAt && (
                    <span>Added {new Date(company.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
                
                <Button asChild variant="outline" size="sm">
                  <Link to={`/leads/company/${company.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CompanyListManager
        isOpen={listManagerOpen}
        onClose={() => {
          setListManagerOpen(false);
          setSelectedCompanyForList(null);
        }}
        companyId={selectedCompanyForList?.id}
        companyName={selectedCompanyForList?.name}
        onListSelect={(listId) => {
          console.log(`Company ${selectedCompanyForList?.id} added to list ${listId}`);
        }}
      />
    </>
  );
};
