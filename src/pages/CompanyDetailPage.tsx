
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { ContactList } from "@/components/leads/ContactList";
import { CompanyInsights } from "@/components/insights/CompanyInsights";
import { PersonalizedOutreach } from "@/components/outreach/PersonalizedOutreach";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, Users, Globe, Mail, Phone } from "lucide-react";

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
      <div className="space-y-6">
        {/* Company Header */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 mt-2">
                  <div className="flex items-center text-gray-600">
                    <Building2 className="h-4 w-4 mr-2" /> 
                    <span>{company.industry || "Unknown industry"}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" /> 
                    <span>{company.location || "Unknown location"}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" /> 
                    <span>{company.size || "Unknown size"}</span>
                  </div>
                  {company.website && (
                    <div className="flex items-center text-gray-600">
                      <Globe className="h-4 w-4 mr-2" /> 
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-500 hover:underline"
                      >
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 md:self-start">
                <Button variant="outline" onClick={() => window.open(company.website, "_blank")}>
                  Visit Website
                </Button>
                <Button onClick={() => navigate(`/leads/edit/${company.id}`)}>
                  Edit Company
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contacts and Personalization */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="contacts">
              <TabsList className="w-full">
                <TabsTrigger value="contacts" className="flex-1">
                  Contacts ({companyContacts.length})
                </TabsTrigger>
                <TabsTrigger value="outreach" className="flex-1">
                  Personalized Outreach
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="contacts" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pt-6 pb-3">
                    <CardTitle>Contacts</CardTitle>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/contacts/new?companyId=${company.id}`)}
                    >
                      Add Contact
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ContactList companyId={company.id} onContactSelect={setSelectedContactId} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="outreach" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedContact 
                        ? `Personalized Outreach for ${selectedContact.firstName} ${selectedContact.lastName}`
                        : "Personalized Outreach"
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedContact ? (
                      <PersonalizedOutreach contact={selectedContact} companyName={company.name} />
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-medium mb-2">Select a Contact</h3>
                        <p className="text-gray-500 mb-6">
                          Please select a contact from the Contacts tab to generate personalized outreach content.
                        </p>
                        {companyContacts.length === 0 ? (
                          <Button onClick={() => navigate(`/contacts/new?companyId=${company.id}`)}>
                            Add Your First Contact
                          </Button>
                        ) : (
                          <Button onClick={() => navigate(`?tab=contacts`)}>
                            View Contacts
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Selected Contact Card - Shows when contact is selected */}
            {selectedContact && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-xl">Contact Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {selectedContact.firstName} {selectedContact.lastName}
                      </h3>
                      <p className="text-gray-600 mb-4">{selectedContact.title}</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-3 text-gray-500" />
                          <a href={`mailto:${selectedContact.email}`} className="text-blue-500 hover:underline">
                            {selectedContact.email}
                          </a>
                        </div>
                        
                        {selectedContact.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-3 text-gray-500" />
                            <a href={`tel:${selectedContact.phone}`} className="text-blue-500 hover:underline">
                              {selectedContact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-gray-600 whitespace-pre-line">
                        {selectedContact.notes || "No notes available for this contact."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/outreach/email?contactId=${selectedContact.id}`)}
                    >
                      Send Email
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/outreach/call-script?contactId=${selectedContact.id}`)}
                    >
                      Generate Call Script
                    </Button>
                    <Button onClick={() => navigate(`/contacts/edit/${selectedContact.id}`)}>
                      Edit Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right Column - Insights and Description */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About {company.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">
                  {company.description || "No description available"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CompanyInsights companyId={company.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CompanyDetailPage;
