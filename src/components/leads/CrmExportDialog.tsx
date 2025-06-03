
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/types";

interface CrmExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCompanies: Company[];
}

export const CrmExportDialog = ({ open, onOpenChange, selectedCompanies }: CrmExportDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { contacts } = useAppContext();
  const [isExporting, setIsExporting] = useState(false);
  const [companyContactSelections, setCompanyContactSelections] = useState<Record<string, string[]>>({});
  const [crmWebhook, setCrmWebhook] = useState<string>("");

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

    if (open) {
      loadCrmWebhook();
    }
  }, [open]);

  const handleContactSelection = (companyId: string, contactId: string, isSelected: boolean) => {
    setCompanyContactSelections(prev => {
      const currentSelections = prev[companyId] || [];
      if (isSelected) {
        return {
          ...prev,
          [companyId]: [...currentSelections, contactId]
        };
      } else {
        return {
          ...prev,
          [companyId]: currentSelections.filter(id => id !== contactId)
        };
      }
    });
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

      const exportData = selectedCompanies.map(company => {
        const companyContacts = contacts.filter(contact => contact.companyId === company.id);
        const selectedContactsForCompany = companyContactSelections[company.id] || [];
        
        // Use selected contacts or default to primary contact (first one)
        const contactsToExport = selectedContactsForCompany.length > 0 
          ? selectedContactsForCompany 
          : (companyContacts.length > 0 ? [companyContacts[0].id] : []);

        return {
          company_id: company.id,
          company_name: company.name,
          contact_ids: contactsToExport
        };
      });

      const payload = {
        exports: exportData,
        user_email: user?.email
      };

      console.log("Bulk exporting to CRM with payload:", payload);

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
        description: `${selectedCompanies.length} companies exported to CRM successfully.`,
      });
      
      onOpenChange(false);
      setCompanyContactSelections({});
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export {selectedCompanies.length} Companies to CRM</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {selectedCompanies.map((company) => {
            const companyContacts = contacts.filter(contact => contact.companyId === company.id);
            const primaryContact = companyContacts.length > 0 ? companyContacts[0] : null;
            const selectedContactsForCompany = companyContactSelections[company.id] || [];
            
            return (
              <div key={company.id} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{company.name}</h4>
                
                {companyContacts.length === 0 ? (
                  <p className="text-sm text-gray-500">No contacts available for this company.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-2">Select contacts to export:</p>
                    {companyContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${company.id}-${contact.id}`}
                          checked={selectedContactsForCompany.includes(contact.id)}
                          onCheckedChange={(checked) => 
                            handleContactSelection(company.id, contact.id, checked === true)
                          }
                        />
                        <label htmlFor={`${company.id}-${contact.id}`} className="text-sm">
                          {contact.firstName} {contact.lastName}
                          {contact.id === primaryContact?.id && (
                            <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                          )}
                        </label>
                      </div>
                    ))}
                    {selectedContactsForCompany.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Primary contact will be exported if none selected.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
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
                "Export to CRM"
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
