
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/types";

interface Company {
  id: string;
  name: string;
  website?: string;
}

export const useEmailFinder = (
  contact: Contact,
  company: Company | null,
  contacts: Contact[],
  setContacts: (contacts: Contact[]) => void
) => {
  const [isFindingEmail, setIsFindingEmail] = useState(false);
  const { toast } = useToast();
  
  const handleFindEmail = async () => {
    if (!contact.firstName || !contact.lastName || !company?.name) {
      toast({
        title: "Missing Information",
        description: "Contact first name, last name and company name are required to search for an email.",
        variant: "destructive"
      });
      return;
    }

    setIsFindingEmail(true);
    console.log("Starting email search for:", contact.firstName, contact.lastName, "at", company.name);
    
    try {
      // Prepare the data to send to the webhook
      const requestData = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        companyName: company.name,
        companyDomain: company.website ? new URL(company.website).hostname.replace('www.', '') : null,
        linkedinUrl: contact.linkedin_url
      };

      console.log("Sending request data:", requestData);

      // Call the n8n webhook to find the email
      const response = await fetch("https://n8n-service-el78.onrender.com/webhook-test/755b751b-eb85-4350-ae99-2508ad2d3f31", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }

      // Parse the response
      const data = await response.json();
      console.log("Email finder response:", data);

      // Check if the email was found
      if (data && data.email) {
        // Update the contact record in Supabase
        const { error } = await supabase
          .from('contacts')
          .update({ email: data.email })
          .eq('id', contact.id);

        if (error) {
          console.error("Error updating contact:", error);
          throw new Error("Failed to update contact record");
        }

        // Update local state
        const updatedContact = { ...contact, email: data.email };
        const updatedContacts = contacts.map(c => 
          c.id === contact.id ? updatedContact : c
        );
        setContacts(updatedContacts);

        toast({
          title: "Email Found",
          description: `Found email: ${data.email}`,
        });
      } else {
        toast({
          title: "No Email Found",
          description: "Couldn't find an email address for this contact.",
        });
      }
    } catch (error) {
      console.error("Error finding email:", error);
      toast({
        title: "Email Search Failed",
        description: "There was an error searching for the email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsFindingEmail(false);
    }
  };
  
  return { isFindingEmail, handleFindEmail };
};
