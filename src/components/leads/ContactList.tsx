
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface ContactListProps {
  companyId?: string;
  onContactSelect?: (contactId: string) => void;
}

export const ContactList = ({ companyId, onContactSelect }: ContactListProps) => {
  const { contacts, companies, setSelectedContact } = useAppContext();
  const navigate = useNavigate();
  
  // Filter contacts by company if companyId is provided
  const filteredContacts = companyId 
    ? contacts.filter(contact => contact.companyId === companyId) 
    : contacts;
  
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : "Unknown Company";
  };
  
  const handleContactClick = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      if (onContactSelect) {
        onContactSelect(contactId);
      } else {
        setSelectedContact(contact);
        navigate(`/contacts/${contactId}`);
      }
    }
  };
  
  return (
    <div>
      {filteredContacts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No contacts found.</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate(companyId ? `/contacts/new?companyId=${companyId}` : "/contacts/new")}
          >
            Add Contact
          </Button>
        </div>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                {!companyId && <TableHead>Company</TableHead>}
                <TableHead>Email</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow 
                  key={contact.id} 
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell>{contact.title}</TableCell>
                  {!companyId && (
                    <TableCell>{getCompanyName(contact.companyId)}</TableCell>
                  )}
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline"
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactClick(contact.id);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end">
            <Button 
              size="sm" 
              onClick={() => navigate(companyId ? `/contacts/new?companyId=${companyId}` : "/contacts/new")}
            >
              Add Contact
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
