
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactHeader } from "@/components/contacts/ContactHeader";
import { ContactDetailsTab } from "@/components/contacts/ContactDetailsTab";
import { LinkedInInfoTab } from "@/components/contacts/LinkedInInfoTab";
import { NotesTab } from "@/components/contacts/NotesTab";
import { useContactEnrichment } from "@/hooks/useContactEnrichment";
import { useEmailFinder } from "@/hooks/useEmailFinder";

const ContactDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { contacts, companies, setContacts } = useAppContext();
  const navigate = useNavigate();
  
  const contact = contacts.find((c) => c.id === id);
  const company = contact ? companies.find((c) => c.id === contact.companyId) : null;
  
  const { isEnriching, handleEnrichContact } = contact 
    ? useContactEnrichment(contact, setContacts, contacts) 
    : { isEnriching: false, handleEnrichContact: () => {} };
  
  const { isFindingEmail, handleFindEmail } = contact && company
    ? useEmailFinder(contact, company, contacts, setContacts)
    : { isFindingEmail: false, handleFindEmail: () => {} };
  
  if (!contact) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Contact Not Found</h2>
          <p className="text-gray-500 mb-6">
            The contact you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/leads")}>Back to Leads</Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-8">
        <ContactHeader 
          contact={contact} 
          companyName={company?.name || null}
        />
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Contact Details</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn Info</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <ContactDetailsTab 
              contact={contact}
              company={company}
              isFindingEmail={isFindingEmail}
              isEnriching={isEnriching}
              onFindEmail={handleFindEmail}
              onEnrichContact={handleEnrichContact}
            />
          </TabsContent>
          
          <TabsContent value="linkedin">
            <LinkedInInfoTab 
              contact={contact}
              isEnriching={isEnriching}
              onEnrichContact={handleEnrichContact}
            />
          </TabsContent>
          
          <TabsContent value="notes">
            <NotesTab notes={contact.notes} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ContactDetailPage;
