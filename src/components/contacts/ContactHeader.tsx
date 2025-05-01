
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Contact } from "@/types";
import { format } from "date-fns";

interface ContactHeaderProps {
  contact: Contact;
  companyName: string | null;
}

export const ContactHeader = ({ contact, companyName }: ContactHeaderProps) => {
  const navigate = useNavigate();
  
  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 text-lg">
          <AvatarFallback>{getInitials(contact.firstName, contact.lastName)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{contact.firstName} {contact.lastName}</h1>
          <p className="text-gray-500 mt-1">{contact.title} at {companyName || "Unknown Company"}</p>
          {contact.last_enriched && (
            <p className="text-xs text-gray-400 mt-1">
              Last enriched: {format(new Date(contact.last_enriched), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>
      <div className="space-x-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/outreach/email?contactId=${contact.id}`)}
        >
          Send Email
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate(`/outreach/call-script?contactId=${contact.id}`)}
        >
          Generate Call Script
        </Button>
        <Button onClick={() => navigate(`/contacts/edit/${contact.id}`)}>
          Edit Contact
        </Button>
      </div>
    </div>
  );
};
