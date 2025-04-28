
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{contact.firstName} {contact.lastName}</h1>
            <p className="text-gray-500 mt-1">{contact.title} at {company?.name || "Unknown Company"}</p>
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
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div>{contact.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div>{contact.phone || "Not provided"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Company</div>
                  <div>{company?.name || "Unknown Company"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Added</div>
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
