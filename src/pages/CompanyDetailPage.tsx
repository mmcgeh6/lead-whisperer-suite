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
  const { companies, contacts, updateCompany } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [researchSheetOpen, setResearchSheetOpen] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [similarCompanies, setSimilarCompanies] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<Employee[]>([]);
  
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
      if (companyData && Array.isArray(companyData.employees)) {
        console.log("Setting employee data:", companyData.employees);
        
        // Format the employee data
        const formattedEmployees: Employee[] = companyData.employees.map((emp: any) => ({
          name: emp.employee_name || emp.name || "",
          title: emp.employee_position || emp.title || "",
          linkedinUrl: emp.employee_profile_url || emp.linkedinUrl || "",
          employee_photo: emp.employee_photo || ""
        }));
        
        setEmployeeData(formattedEmployees);
        toast({
          title: "Employee Data Retrieved",
          description: `Found ${formattedEmployees.length} employees from LinkedIn.`,
        });
      } else if (companyData && companyData.profile && Array.isArray(companyData.profile.employees)) {
        // Alternative data structure
        console.log("Setting employee data from profile:", companyData.profile.employees);
        
        // Format the employee data
        const formattedEmployees: Employee[] = companyData.profile.employees.map((emp: any) => ({
          name: emp.employee_name || emp.name || "",
          title: emp.employee_position || emp.title || "",
          linkedinUrl: emp.employee_profile_url || emp.linkedinUrl || "",
          employee_photo: emp.employee_photo || ""
        }));
        
        setEmployeeData(formattedEmployees);
        toast({
          title: "Employee Data Retrieved",
          description: `Found ${formattedEmployees.length} employees from LinkedIn.`,
        });
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
      if (similarCompanies.length === 0 && employeeData.length === 0) {
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
          setEmployeeData(mockData.employees);
          
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
        
        {/* Similar Companies - New section */}
        {similarCompanies && similarCompanies.length > 0 && (
          <SimilarCompanies companies={similarCompanies} />
        )}

        {/* Employee Data - Display if available */}
        {employeeData && employeeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Insights
              </CardTitle>
              <CardDescription>
                Key employees at {company.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {employeeData.map((employee, index) => (
                  <li key={index} className="py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      {employee.employee_photo && (
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img 
                            src={employee.employee_photo} 
                            alt={employee.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium">{employee.name}</h4>
                        <p className="text-sm text-gray-600">{employee.title}</p>
                      </div>
                    </div>
                    {employee.linkedinUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(employee.linkedinUrl, "_blank")}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
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
