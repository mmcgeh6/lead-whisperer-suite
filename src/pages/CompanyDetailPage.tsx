
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { ContactList } from "@/components/leads/ContactList";
import { CompanyInsights } from "@/components/insights/CompanyInsights";
import { PersonalizedOutreach } from "@/components/outreach/PersonalizedOutreach";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { companies, contacts } = useAppContext();
  const navigate = useNavigate();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  
  const company = companies.find((c) => c.id === id);
  const companyContacts = contacts.filter((c) => c.companyId === id);
  const selectedContact = companyContacts.find(c => c.id === selectedContactId) || null;
  
  if (!company) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Company Not Found</h2>
          <p className="text-gray-500 mb-6">
            The company you're looking for doesn't exist or has been removed.
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
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <p className="text-gray-500 mt-1">{company.industry} • {company.location}</p>
          </div>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => window.open(company.website, "_blank")}>
              Visit Website
            </Button>
            <Button onClick={() => navigate(`/leads/edit/${company.id}`)}>
              Edit Company
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{company.description || "No description available"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Website</h3>
                  <p className="mt-1">{company.website}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Size</h3>
                  <p className="mt-1">{company.size}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CompanyInsights companyId={company.id} />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactList companyId={company.id} onContactSelect={setSelectedContactId} />
              </CardContent>
            </Card>
            
            {selectedContact && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Personalized Outreach for {selectedContact.firstName} {selectedContact.lastName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonalizedOutreach contact={selectedContact} companyName={company.name} />
                </CardContent>
              </Card>
            )}
            
            {!selectedContact && companyContacts.length > 0 && (
              <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Select a contact to generate personalized outreach content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CompanyDetailPage;
