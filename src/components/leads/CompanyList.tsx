
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppContext } from "@/context/AppContext";
import { Company } from "@/types";
import { Eye, Edit, Building2, MapPin, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const [displayCompanies, setDisplayCompanies] = useState<Array<Company>>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    // If we have newLeads (from a filter/list), use those
    if (newLeads && newLeads.length > 0) {
      // Filter out any leads that don't have the required fields
      const validNewLeads = newLeads.filter(lead => lead.id && lead.name) as Company[];
      setDisplayCompanies(validNewLeads);
    } else {
      // Otherwise, load companies from database if user is authenticated
      if (user) {
        loadCompanies();
      } else {
        // Use the existing companies from context if no user
        setDisplayCompanies(companies);
      }
    }
  }, [companies, newLeads, user]);

  const loadCompanies = async () => {
    if (!user) return;
    
    try {
      // Fetch companies associated with the current user
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error loading companies:', error);
        return;
      }
      
      if (data) {
        // Transform the data to match our Company type (convert snake_case to camelCase)
        const formattedCompanies: Company[] = data.map(item => ({
          id: item.id,
          name: item.name,
          website: item.website || "",
          industry: item.industry || "",
          industry_vertical: item.industry_vertical,
          size: item.size || "",
          location: item.location || "",
          street: item.street,
          city: item.city,
          state: item.state,
          zip: item.zip,
          country: item.country,
          phone: item.phone,
          description: item.description || "",
          facebook_url: item.facebook_url,
          twitter_url: item.twitter_url,
          linkedin_url: item.linkedin_url,
          keywords: item.keywords,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
          call_script: item.call_script,
          email_script: item.email_script,
          text_script: item.text_script,
          social_dm_script: item.social_dm_script,
          research_notes: item.research_notes,
          user_id: item.user_id
        }));
        
        setDisplayCompanies(formattedCompanies);
      }
    } catch (error) {
      console.error('Error in loadCompanies:', error);
    }
  };

  const handleViewCompany = (id: string) => {
    navigate(`/leads/company/${id}`);
  };

  const handleEditCompany = (id: string) => {
    navigate(`/leads/company/${id}/edit`);
  };

  const handleAddCompany = () => {
    navigate("/leads/company/new");
  };
  
  if (displayCompanies.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500 mb-4">No companies found</p>
        <Button onClick={handleAddCompany}>
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
                <div className="text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
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
