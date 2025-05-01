
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Mail, Phone, Building, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const ContactDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { contacts, companies, setContacts } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFindingEmail, setIsFindingEmail] = useState(false);
  
  const contact = contacts.find((c) => c.id === id);
  const company = contact ? companies.find((c) => c.id === contact.companyId) : null;
  
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
  
  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Function to find email using the n8n webhook
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
    
    try {
      // Prepare the data to send to the webhook
      const requestData = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        companyName: company.name,
        companyDomain: company.website ? new URL(company.website).hostname.replace('www.', '') : null,
        linkedinUrl: contact.linkedin_url
      };

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
  
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback>{getInitials(contact.firstName, contact.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{contact.firstName} {contact.lastName}</h1>
              <p className="text-gray-500 mt-1">{contact.title} at {company?.name || "Unknown Company"}</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">Contact Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="flex items-center gap-2">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-gray-500">No email available</span>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleFindEmail}
                        disabled={isFindingEmail}
                        className="h-7 px-2 py-1"
                      >
                        {isFindingEmail ? 
                          <span className="flex items-center gap-1">
                            <span className="animate-pulse">●</span> 
                            Finding...
                          </span> : 
                          <span className="flex items-center gap-1">
                            <Search className="h-3 w-3" /> 
                            Find Email
                          </span>
                        }
                      </Button>
                    </div>
                  </div>
                </div>
                
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div>
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Company</div>
                    <div>
                      {company ? (
                        <a 
                          href={`/leads/company/${company.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {company.name}
                        </a>
                      ) : (
                        "Unknown Company"
                      )}
                    </div>
                  </div>
                </div>
                
                {contact.linkedin_url && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">LinkedIn</div>
                      <div>
                        <a 
                          href={contact.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                        >
                          View Profile
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm text-gray-500 mt-2">Added</div>
                  <div>{new Date(contact.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">Notes</h3>
              <div className="whitespace-pre-line">
                {contact.notes || "No notes available for this contact."}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ContactDetailPage;
