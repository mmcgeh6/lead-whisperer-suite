
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { ContactList } from "@/components/leads/ContactList";
import { CompanyInsights } from "@/components/insights/CompanyInsights";
import { CompanyResearch } from "@/components/research/CompanyResearch";
import { PersonalizedOutreach } from "@/components/outreach/PersonalizedOutreach";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Users, Globe, Mail, Phone, Briefcase, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { companies, contacts } = useAppContext();
  const navigate = useNavigate();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [researchSheetOpen, setResearchSheetOpen] = useState(false);
  
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
  
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    setContactDialogOpen(true);
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* Company Banner */}
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
                  {company.industry_vertical && (
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" /> 
                      <span>{company.industry_vertical}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" /> 
                    <span>{company.city && company.state ? `${company.city}, ${company.state}` : company.location || "Unknown location"}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" /> 
                    <span>{company.size || "Unknown size"}</span>
                  </div>
                  {company.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" /> 
                      <span>{company.phone}</span>
                    </div>
                  )}
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
                  {company.keywords && company.keywords.length > 0 && (
                    <div className="flex items-center text-gray-600 col-span-3 flex-wrap">
                      <Hash className="h-4 w-4 mr-2 flex-shrink-0" /> 
                      <div className="flex flex-wrap gap-2">
                        {company.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
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

        {/* Module 1: About Company */}
        <Card>
          <CardHeader>
            <CardTitle>About {company.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="whitespace-pre-line">
                {company.description || "No description available"}
              </p>
              
              {/* Social Links */}
              {(company.linkedin_url || company.facebook_url || company.twitter_url) && (
                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-2">Social Media Profiles</h4>
                  <div className="flex flex-wrap gap-3">
                    {company.linkedin_url && (
                      <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                        LinkedIn
                      </a>
                    )}
                    {company.facebook_url && (
                      <a href={company.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                        Facebook
                      </a>
                    )}
                    {company.twitter_url && (
                      <a href={company.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {/* Complete Address */}
              {(company.street || company.city || company.state || company.zip || company.country) && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Address</h4>
                  <address className="not-italic text-gray-600">
                    {company.street && <p>{company.street}</p>}
                    {company.city && company.state && <p>{company.city}, {company.state} {company.zip}</p>}
                    {!company.city && company.state && <p>{company.state} {company.zip}</p>}
                    {company.city && !company.state && <p>{company.city} {company.zip}</p>}
                    {!company.city && !company.state && company.zip && <p>{company.zip}</p>}
                    {company.country && <p>{company.country}</p>}
                  </address>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Module 2: Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contacts</CardTitle>
            <Button 
              size="sm" 
              onClick={() => navigate(`/contacts/new?companyId=${company.id}`)}
            >
              Add Contact
            </Button>
          </CardHeader>
          <CardContent>
            <ContactList companyId={company.id} onContactSelect={handleContactSelect} />
          </CardContent>
        </Card>

        {/* Contact Dialog - Shows when contact is selected */}
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Contact Details</DialogTitle>
            </DialogHeader>
            {selectedContact && (
              <div className="grid gap-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedContact.title}</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
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
                
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-gray-600 whitespace-pre-line">
                    {selectedContact.notes || "No notes available for this contact."}
                  </p>
                </div>

                <div className="flex justify-end gap-3 mt-2">
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
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Module 3: Personalized Outreach (Now at Company Level) */}
        <Card>
          <CardHeader>
            <CardTitle>Personalized Outreach</CardTitle>
          </CardHeader>
          <CardContent>
            <PersonalizedOutreach companyName={company.name} />
          </CardContent>
        </Card>
        
        {/* Module 4: Company Insights */}
        <CompanyInsights companyId={company.id} />
        
        {/* Module 5: Company Research (New section) */}
        <CompanyResearch companyId={company.id} />
      </div>
    </Layout>
  );
};

export default CompanyDetailPage;
