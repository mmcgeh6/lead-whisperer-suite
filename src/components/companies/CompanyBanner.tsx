import { Company } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, MapPin, Users, Globe, Phone, Briefcase, Hash, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";

interface CompanyBannerProps {
  company: Company;
  isEnriching: boolean;
  handleEnrichCompany: () => void;
}

export const CompanyBanner = ({ company, isEnriching, handleEnrichCompany }: CompanyBannerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { contacts } = useAppContext();
  const [isExporting, setIsExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [crmWebhook, setCrmWebhook] = useState<string>("");

  // Get contacts for this company
  const companyContacts = contacts.filter(contact => contact.companyId === company.id);
  
  // Set default primary contact (first contact added to company)
  const primaryContact = companyContacts.length > 0 ? companyContacts[0] : null;

  // Helper function to format employee count
  const formatEmployeeCount = (count: number | undefined) => {
    if (!count) return "Unknown size";
    if (count < 1000) return `${count} employees`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K employees`;
    return `${(count / 1000000).toFixed(1)}M employees`;
  };

  // Load CRM webhook URL from Supabase settings
  useEffect(() => {
    const loadCrmWebhook = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('crm_export_webhook')
          .eq('id', 'default')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error loading CRM webhook:", error);
          return;
        }

        if (data?.crm_export_webhook) {
          setCrmWebhook(data.crm_export_webhook);
        }
      } catch (error) {
        console.error("Exception loading CRM webhook:", error);
      }
    };

    if (exportDialogOpen) {
      loadCrmWebhook();
    }
  }, [exportDialogOpen]);

  const handleContactSelection = (contactId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleExportToCRM = async () => {
    setIsExporting(true);
    
    try {
      if (!crmWebhook) {
        toast({
          title: "Configuration Error",
          description: "CRM export webhook URL not configured. Please check your settings.",
          variant: "destructive",
        });
        return;
      }

      // Use selected contacts or default to primary contact
      const contactsToExport = selectedContacts.length > 0 ? selectedContacts : (primaryContact ? [primaryContact.id] : []);

      const payload = {
        company_id: company.id,
        company_name: company.name,
        contact_ids: contactsToExport,
        user_email: user?.email
      };

      console.log("Exporting to CRM with payload:", payload);

      const response = await fetch(crmWebhook, {
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
        description: `Company and ${contactsToExport.length} contact(s) exported to CRM successfully.`,
      });
      
      setExportDialogOpen(false);
      setSelectedContacts([]);
    } catch (error) {
      console.error("Error exporting to CRM:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export to CRM. Please try again.",
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
                <span>{company.estimated_num_employees ? formatEmployeeCount(company.estimated_num_employees) : company.size || "Unknown size"}</span>
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
            
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Export to CRM
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Export to CRM</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Company</h4>
                    <p className="text-sm text-gray-600">{company.name}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Select Contacts to Export</h4>
                    {companyContacts.length === 0 ? (
                      <p className="text-sm text-gray-500">No contacts available for this company.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {companyContacts.map((contact) => (
                          <div key={contact.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={contact.id}
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={(checked) => 
                                handleContactSelection(contact.id, checked === true)
                              }
                            />
                            <label htmlFor={contact.id} className="text-sm">
                              {contact.firstName} {contact.lastName}
                              {contact.id === primaryContact?.id && (
                                <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    {primaryContact && selectedContacts.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Primary contact will be exported if none selected.
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleExportToCRM}
                      disabled={isExporting}
                      className="flex-1"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        "Export"
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setExportDialogOpen(false)}
                      disabled={isExporting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button onClick={() => navigate(`/leads/edit/${company.id}`)}>
              Edit Company
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
