
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Mail, Phone, Building } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ContactDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { contacts, companies } = useAppContext();
  const navigate = useNavigate();
  
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
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div>
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                
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
