import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { ContactList } from "@/components/leads/ContactList";
import { CompanyInsights } from "@/components/insights/CompanyInsights";
import { CompanyResearch } from "@/components/research/CompanyResearch";
import { PersonalizedOutreach } from "@/components/outreach/PersonalizedOutreach";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, MapPin, Users, Globe, Mail, Phone, Briefcase, Hash, Network, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { SimilarCompanies } from "@/components/insights/SimilarCompanies";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/types";

// Define interfaces for the employee data
interface Employee {
  name: string;
  title: string;
  linkedinUrl?: string;
  employee_name?: string;
  employee_position?: string;
  employee_profile_url?: string;
  employee_photo?: string;
}

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { companies, contacts, updateCompany, setContacts } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [researchSheetOpen, setResearchSheetOpen] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [similarCompanies, setSimilarCompanies] = useState<any[]>([]);
  
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
  
  // Function to create contacts from employee data
  const createContactsFromEmployees = async (employeeData: Employee[]) => {
    if (!employeeData.length || !company) return;
    
    try {
      const newContacts: Contact[] = [];
      
      // Create contacts for each employee
      for (const employee of employeeData) {
        // Extract names
        const fullName = employee.name || employee.employee_name || "";
        let firstName = fullName;
        let lastName = "";
        
        // Try to split the name into first and last
        if (fullName.includes(" ")) {
          const nameParts = fullName.split(" ");
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(" ");
        }
        
        // Check if this contact already exists (by LinkedIn URL)
        const linkedinUrl = employee.linkedinUrl || employee.employee_profile_url;
        const existingContact = contacts.find(c => 
          c.linkedin_url === linkedinUrl || 
          (c.firstName === firstName && c.lastName === lastName && c.companyId === company.id)
        );
        
        if (existingContact) {
          console.log(`Contact already exists: ${fullName}`);
          continue; // Skip if contact already exists
        }
        
        // Prepare contact data for Supabase
        const contactData = {
          first_name: firstName,
          last_name: lastName,
          position: employee.title || employee.employee_position || "",
          company_id: company.id,
          linkedin_url: linkedinUrl || null,
          notes: `Added automatically from LinkedIn data enrichment on ${new Date().toLocaleDateString()}`
        };
        
        // Insert into Supabase
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert(contactData)
          .select()
          .single();
        
        if (error) {
          console.error("Error creating contact:", error);
          continue;
        }
        
        // Format for the application state
        if (newContact) {
          newContacts.push({
            id: newContact.id,
            firstName: newContact.first_name,
            lastName: newContact.last_name,
            email: newContact.email || "",
            phone: newContact.phone || "",
            title: newContact.position || "",
            companyId: newContact.company_id,
            notes: newContact.notes || "",
            linkedin_url: newContact.linkedin_url || undefined,
            createdAt: newContact.created_at,
            updatedAt: newContact.updated_at
          });
        }
      }
      
      if (newContacts.length > 0) {
        // Update the contacts in the state
        setContacts([...contacts, ...newContacts]);
        
        toast({
          title: "Contacts Created",
          description: `Added ${newContacts.length} new contacts from LinkedIn data.`,
        });
      } else {
        toast({
          title: "No New Contacts Added",
          description: "All employees already exist as contacts or couldn't be added.",
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error("Error creating contacts from employees:", error);
      toast({
        title: "Error Adding Contacts",
        description: "Failed to create contacts from employee data.",
        variant: "destructive"
      });
    }
  };
  
  const handleEnrichCompany = async () => {
    if (!company.linkedin_url) {
      toast({
        title: "LinkedIn URL Missing",
        description: "This company doesn't have a LinkedIn URL. Please add it first.",
        variant: "destructive"
      });
      return;
    }

    setIsEnriching(true);
    
    try {
      console.log("Enriching company with LinkedIn URL:", company.linkedin_url);
      
      // Use test webhook URL
      const webhookUrl = "https://n8n-service-el78.onrender.com/webhook-test/af95b526-404c-4a13-9ca2-2d918b7d4e90";
      
      // Add timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ linkedinUrl: company.linkedin_url }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Enrichment data received:", data);
      
      // Handle the array response format
      const companyData = Array.isArray(data) ? data[0] : data;
      
      // Process the received data - extract similarCompanies
      if (companyData && Array.isArray(companyData.similar_companies)) {
        console.log("Setting similar companies:", companyData.similar_companies);
        setSimilarCompanies(companyData.similar_companies);
        toast({
          title: "Similar Companies Found",
          description: `Found ${companyData.similar_companies.length} similar companies.`,
        });
      } else if (companyData && companyData.profile && Array.isArray(companyData.profile.similarCompanies)) {
        // Alternative data structure
        console.log("Setting similar companies from profile:", companyData.profile.similarCompanies);
        setSimilarCompanies(companyData.profile.similarCompanies);
        toast({
          title: "Similar Companies Found",
          description: `Found ${companyData.profile.similarCompanies.length} similar companies.`,
        });
      }
      
      // Process employee data
      let employeeData: Employee[] = [];
      
      if (companyData && Array.isArray(companyData.employees)) {
        console.log("Setting employee data:", companyData.employees);
        
        // Format the employee data
        employeeData = companyData.employees.map((emp: any) => ({
          name: emp.employee_name || emp.name || "",
          title: emp.employee_position || emp.title || "",
          linkedinUrl: emp.employee_profile_url || emp.linkedinUrl || "",
          employee_photo: emp.employee_photo || ""
        }));
        
      } else if (companyData && companyData.profile && Array.isArray(companyData.profile.employees)) {
        // Alternative data structure
        console.log("Setting employee data from profile:", companyData.profile.employees);
        
        // Format the employee data
        employeeData = companyData.profile.employees.map((emp: any) => ({
          name: emp.employee_name || emp.name || "",
          title: emp.employee_position || emp.title || "",
          linkedinUrl: emp.employee_profile_url || emp.linkedinUrl || "",
          employee_photo: emp.employee_photo || ""
        }));
      }
      
      // Create contacts from the employee data
      if (employeeData.length > 0) {
        toast({
          title: "Employee Data Retrieved",
          description: `Found ${employeeData.length} employees from LinkedIn. Adding as contacts...`,
        });
        
        await createContactsFromEmployees(employeeData);
      }

      toast({
        title: "Company Enriched",
        description: "Successfully retrieved additional data for this company.",
      });
      
    } catch (error) {
      console.error("Error enriching company:", error);
      
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        toast({
          title: "Network Error",
          description: "Could not connect to the enrichment service. Please check your internet connection and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Enrichment Failed",
          description: "Could not retrieve additional data. Please try again later.",
          variant: "destructive"
        });
      }
      
      // Fall back to mock data for testing purposes
      // Only use mock data if the webhook failed completely
      if (similarCompanies.length === 0) {
        setTimeout(() => {
          const mockData = {
            similarCompanies: [
              { 
                name: "Green Gardens Landscaping", 
                industry: "Landscaping",
                location: "San Francisco, CA", 
                linkedinUrl: "http://www.linkedin.com/company/green-gardens" 
              },
              { 
                name: "Pacific Lawn Care", 
                industry: "Landscaping & Gardening",
                location: "Seattle, WA", 
                linkedinUrl: "http://www.linkedin.com/company/pacific-lawn" 
              },
              { 
                name: "Urban Forestry Inc", 
                industry: "Landscaping & Urban Planning",
                location: "Portland, OR", 
                linkedinUrl: "http://www.linkedin.com/company/urban-forestry" 
              }
            ],
            employees: [
              { name: "John Smith", title: "Landscape Designer", linkedinUrl: "http://linkedin.com/in/johnsmith" },
              { name: "Sarah Johnson", title: "Operations Manager", linkedinUrl: "http://linkedin.com/in/sarahjohnson" },
              { name: "Mike Peters", title: "Senior Gardener", linkedinUrl: "http://linkedin.com/in/mikepeters" }
            ]
          };
          
          // Process the mock data
          setSimilarCompanies(mockData.similarCompanies);
          
          // Create contacts from mock employee data
          createContactsFromEmployees(mockData.employees);
          
          toast({
            title: "Using Sample Data",
            description: "Using mock data since the webhook couldn't be reached.",
          });
        }, 2000);
      }
    } finally {
      setIsEnriching(false);
    }
  };
  
  const [isFindingEmail, setIsFindingEmail] = useState(false);
  
  // Function to find email using the n8n webhook
  const handleFindEmail = async (contact) => {
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
        
        // If this was the selected contact, update it
        if (selectedContact && selectedContact.id === contact.id) {
          setSelectedContactId(contact.id);
        }

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
                <Button 
                  variant="secondary"
                  onClick={handleEnrichCompany}
                  disabled={isEnriching || !company.linkedin_url}
                  className="relative"
                >
                  {isEnriching ? (
                    <>
                      <span className="animate-pulse mr-2">●</span>
                      Enriching...
                    </>
                  ) : (
                    "Enrich Company"
                  )}
                </Button>
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
            <div>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>
                Company contacts and LinkedIn-sourced employees
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEnrichCompany}
                disabled={isEnriching || !company.linkedin_url}
              >
                {isEnriching ? "Finding Employees..." : "Find Employees"}
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate(`/contacts/new?companyId=${company.id}`)}
              >
                Add Contact
              </Button>
            </div>
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
                    <div className="flex items-center gap-2">
                      {selectedContact.email ? (
                        <a href={`mailto:${selectedContact.email}`} className="text-blue-500 hover:underline">
                          {selectedContact.email}
                        </a>
                      ) : (
                        <span className="text-gray-500">No email available</span>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleFindEmail(selectedContact)}
                        disabled={isFindingEmail}
                        className="h-7 px-2 py-1 ml-2 border border-gray-200"
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
                  
                  {selectedContact.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-3 text-gray-500" />
                      <a href={`tel:${selectedContact.phone}`} className="text-blue-500 hover:underline">
                        {selectedContact.phone}
                      </a>
                    </div>
                  )}
                  
                  {selectedContact.linkedin_url && (
                    <div className="flex items-center">
                      <ExternalLink className="h-4 w-4 mr-3 text-gray-500" />
                      <a href={selectedContact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        LinkedIn Profile
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
        
        {/* Similar Companies - New section */}
        {similarCompanies && similarCompanies.length > 0 && (
          <SimilarCompanies companies={similarCompanies} />
        )}
        
        {/* Module 3: Personalized Outreach */}
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
        
        {/* Module 5: Company Research */}
        <CompanyResearch companyId={company.id} />
      </div>
    </Layout>
  );
};

export default CompanyDetailPage;
