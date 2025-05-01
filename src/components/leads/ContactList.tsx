
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ContactListProps {
  companyId?: string;
  onContactSelect?: (contactId: string) => void;
}

export const ContactList = ({ companyId, onContactSelect }: ContactListProps) => {
  const { contacts, companies, setSelectedContact, setContacts } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch contacts from Supabase when the component mounts or when companyId changes
  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('contacts')
          .select('*');
        
        // Filter by company if companyId is provided
        if (companyId) {
          query = query.eq('company_id', companyId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          // Transform contacts from Supabase schema to app schema
          const formattedContacts: Contact[] = data.map(contact => ({
            id: contact.id,
            firstName: contact.first_name,
            lastName: contact.last_name,
            email: contact.email || "",
            phone: contact.phone || "",
            title: contact.position || "",
            companyId: contact.company_id,
            notes: contact.notes || "",
            linkedin_url: contact.linkedin_url,
            createdAt: contact.created_at,
            updatedAt: contact.updated_at
          }));
          
          setContacts(formattedContacts);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast({
          title: "Failed to load contacts",
          description: "There was an error loading contacts. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContacts();
  }, [companyId, setContacts, toast]);
  
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
  
  // Get initials from a name for the avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  return (
    <div>
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading contacts...</p>
        </div>
      ) : filteredContacts.length === 0 ? (
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
                <TableHead>LinkedIn</TableHead>
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
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(contact.firstName, contact.lastName)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {contact.firstName} {contact.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{contact.title}</TableCell>
                  {!companyId && (
                    <TableCell>{getCompanyName(contact.companyId)}</TableCell>
                  )}
                  <TableCell>
                    {contact.linkedin_url ? (
                      <a 
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Profile</span>
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
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
