
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Contact } from "@/types";
import { ContactDetailsTab } from "./ContactDetailsTab";
import { LinkedInInfoTab } from "./LinkedInInfoTab";
import { NotesTab } from "./NotesTab";
import { X } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

interface ContactDetailDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFindEmail: (contact: Contact) => void;
  onEnrichContact: (contact: Contact) => void;
  isFindingEmail: boolean;
  isEnrichingContact: boolean;
  onEditContact?: (contactId: string) => void;
}

export function ContactDetailDialog({
  contact,
  open,
  onOpenChange,
  onFindEmail,
  onEnrichContact,
  isFindingEmail,
  isEnrichingContact,
  onEditContact
}: ContactDetailDialogProps) {
  const { companies } = useAppContext();
  
  if (!contact) return null;

  // Get the actual company name from the companies context
  const company = companies.find(c => c.id === contact.companyId);
  const companyName = company?.name || "Unknown Company";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Contact Details</DialogTitle>
          <DialogClose className="h-8 w-8 rounded-full hover:bg-slate-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="py-2">
          <p className="text-sm text-muted-foreground">
            View and manage contact information for {contact.firstName} {contact.lastName}
          </p>
        </div>
        
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{contact.firstName} {contact.lastName}</h2>
          <p className="text-gray-600">{contact.title} at {companyName}</p>
        </div>
        
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onFindEmail(contact)}
              disabled={isFindingEmail}
            >
              {isFindingEmail ? "Finding Email..." : "Find Email"}
            </Button>
            <Button
              onClick={() => onEnrichContact(contact)}
              disabled={isEnrichingContact}
            >
              {isEnrichingContact ? "Enriching..." : "Enrich Contact"}
            </Button>
          </div>
          {onEditContact && (
            <Button
              variant="default"
              onClick={() => onEditContact(contact.id)}
            >
              Edit Contact
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Contact Details</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn Info</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <ContactDetailsTab 
              contact={contact} 
              company={company ? { id: company.id, name: company.name, website: company.website } : null}
              isFindingEmail={isFindingEmail} 
              isEnriching={isEnrichingContact}
              onFindEmail={() => onFindEmail(contact)}
              onEnrichContact={() => onEnrichContact(contact)}
            />
          </TabsContent>
          
          <TabsContent value="linkedin">
            <LinkedInInfoTab 
              contact={contact} 
              isEnriching={isEnrichingContact} 
              onEnrichContact={() => onEnrichContact(contact)}
            />
          </TabsContent>
          
          <TabsContent value="notes">
            <NotesTab notes={contact.notes} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
