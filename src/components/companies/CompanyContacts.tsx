
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactList } from "@/components/leads/ContactList";
import { useNavigate } from "react-router-dom";

interface CompanyContactsProps {
  companyId: string;
  isEnriching: boolean;
  handleEnrichCompany: () => void;
  onContactSelect: (contactId: string) => void;
}

export const CompanyContacts = ({ 
  companyId, 
  isEnriching, 
  handleEnrichCompany, 
  onContactSelect 
}: CompanyContactsProps) => {
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            Company contacts and LinkedIn-sourced employees
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEnrichCompany}
            disabled={isEnriching}
          >
            {isEnriching ? "Finding Employees..." : "Find Employees"}
          </Button>
          <Button 
            size="sm" 
            onClick={() => navigate(`/contacts/new?companyId=${companyId}`)}
          >
            Add Contact
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ContactList companyId={companyId} onContactSelect={onContactSelect} />
      </CardContent>
    </Card>
  );
};
