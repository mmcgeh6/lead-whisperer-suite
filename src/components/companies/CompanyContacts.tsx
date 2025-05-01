
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactList } from "@/components/leads/ContactList";
import { ContactDetailDialog } from "@/components/contacts/ContactDetailDialog";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Contact } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CompanyContactsProps {
  companyId: string;
  isEnriching: boolean;
  handleEnrichCompany: () => void;
  onContactSelect: (contactId: string) => void;
}

export const CompanyContacts = ({ 
  companyId, 
  isEnriching, 
  handleEnrichCompany, 
  onContactSelect 
}: CompanyContactsProps) => {
  const navigate = useNavigate();
  const { contacts, companies, setContacts } = useAppContext();
  const { toast } = useToast();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [isFindingEmail, setIsFindingEmail] = useState(false);
  const [isEnrichingContact, setIsEnrichingContact] = useState(false);
  
  const company = companies.find(c => c.id === companyId);
  const selectedContact = contacts.find(c => c.id === selectedContactId) || null;
  
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    setContactDialogOpen(true);
    onContactSelect(contactId);
  };
  
  // Function to find email using the n8n webhook
  const handleFindEmail = async (contact: Contact) => {
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
  
  // Function to enrich contact with LinkedIn data
  const handleEnrichContact = async (contact: Contact) => {
    if (!contact.linkedin_url) {
      toast({
        title: "LinkedIn URL Missing",
        description: "This contact doesn't have a LinkedIn URL. Please add it first.",
        variant: "destructive"
      });
      return;
    }

    setIsEnrichingContact(true);
    
    try {
      console.log("Enriching contact with LinkedIn URL:", contact.linkedin_url);
      
      // Use webhook URL for enrichment
      const webhookUrl = "https://n8n-service-el78.onrender.com/webhook-test/af95b526-404c-4a13-9ca2-2d918b7d4e90";
      
      // Add timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          linkedinUrl: contact.linkedin_url,
          type: "person"
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Contact enrichment data received:", data);
      
      // Process the received data
      const profileData = Array.isArray(data) ? data[0] : data;
      
      // Prepare the update data
      const updateData: any = {
        last_enriched: new Date().toISOString()
      };

      // Extract bio
      if (profileData.bio || profileData.summary) {
        updateData.linkedin_bio = profileData.bio || profileData.summary;
      }

      // Extract skills
      if (Array.isArray(profileData.skills)) {
        updateData.linkedin_skills = profileData.skills;
      }
      
      // Extract languages if available
      if (Array.isArray(profileData.languages)) {
        updateData.languages = profileData.languages;
      }
      
      // Extract address and country if available
      if (profileData.address) {
        updateData.address = profileData.address;
      }
      
      if (profileData.country) {
        updateData.country = profileData.country;
      }
      
      // Extract position if available
      if (profileData.position) {
        updateData.position = profileData.position;
      }
      
      // Extract mobile number if available
      if (profileData.mobilePhone || profileData.mobile_phone) {
        updateData.mobilePhone = profileData.mobilePhone || profileData.mobile_phone;
      }
      
      // Extract job start date if available
      if (profileData.jobStartDate || (profileData.current_job && profileData.current_job.start_date)) {
        updateData.job_start_date = profileData.jobStartDate || profileData.current_job.start_date;
      }

      // Extract education
      if (Array.isArray(profileData.education)) {
        updateData.linkedin_education = profileData.education.map(edu => 
          `${edu.degree || ''} ${edu.field_of_study || ''} at ${edu.school_name || ''} (${edu.starts_at?.year || ''}-${edu.ends_at?.year || 'Present'})`
        );
      }

      // Extract experience
      if (Array.isArray(profileData.experiences)) {
        updateData.linkedin_experience = profileData.experiences.map(exp => 
          `${exp.title || ''} at ${exp.company || ''} (${exp.starts_at?.month ? exp.starts_at.month + '/' : ''}${exp.starts_at?.year || ''}-${exp.ends_at?.month ? exp.ends_at.month + '/' : ''}${exp.ends_at?.year || 'Present'})`
        );
      }

      // Extract posts
      if (Array.isArray(profileData.posts)) {
        updateData.linkedin_posts = profileData.posts.map(post => ({
          id: post.id || `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: post.content || post.text,
          timestamp: post.timestamp || post.date,
          likes: post.likes || 0,
          comments: post.comments || 0,
          url: post.url
        }));
      }

      console.log("Updating contact with data:", updateData);
      
      // Update the contact in Supabase
      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contact.id);

      if (error) {
        console.error("Error updating contact:", error);
        throw new Error("Failed to update contact with LinkedIn data");
      }

      // Update local state
      const updatedContact = { ...contact, ...updateData };
      const updatedContacts = contacts.map(c => 
        c.id === contact.id ? updatedContact : c
      );
      setContacts(updatedContacts);

      toast({
        title: "Contact Enriched",
        description: "Successfully retrieved LinkedIn data for this contact.",
      });
      
    } catch (error) {
      console.error("Error enriching contact:", error);
      
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
      
      // For development purposes, generate mock data
      if (!contact.linkedin_posts) {
        setTimeout(() => {
          const mockData = {
            linkedin_bio: "Experienced marketing professional with over 10 years in digital strategy and brand development. Passionate about creating data-driven campaigns that deliver measurable results.",
            position: "Marketing Director",
            job_start_date: "2020-06-01",
            languages: ["English", "Spanish", "French"],
            mobilePhone: "+1 555-123-4567",
            address: "123 Business Ave, Suite 400",
            country: "United States",
            linkedin_posts: [
              {
                id: "post1",
                content: "Excited to announce our company's new initiative on sustainable business practices! We're committed to reducing our carbon footprint by 30% over the next two years. #Sustainability #BusinessEthics",
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                likes: 42,
                comments: 7
              },
              {
                id: "post2",
                content: "Just finished reading 'The Innovator's Dilemma' by Clayton Christensen. Highly recommend for anyone interested in understanding disruptive innovation and why established companies often fail to adapt. What business books have impacted your thinking? #Innovation #BusinessStrategy",
                timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                likes: 28,
                comments: 12
              }
            ],
            linkedin_skills: ["Digital Marketing", "Content Strategy", "SEO", "Team Leadership", "Project Management"],
            linkedin_education: ["MBA in Marketing at Stanford University (2010-2012)", "BS in Business Administration at UCLA (2006-2010)"],
            linkedin_experience: [
              "Marketing Director at TechCorp (2018-Present)",
              "Senior Marketing Manager at Digital Solutions Inc. (2014-2018)",
              "Marketing Associate at Marketing Pros (2012-2014)"
            ],
            last_enriched: new Date().toISOString()
          };
          
          // Update local state with mock data
          const updatedContact = { ...contact, ...mockData };
          const updatedContacts = contacts.map(c => 
            c.id === contact.id ? updatedContact : c
          );
          setContacts(updatedContacts);
          
          toast({
            title: "Using Sample Data",
            description: "Using mock data for demonstration purposes.",
          });
        }, 2000);
      }
    } finally {
      setIsEnrichingContact(false);
    }
  };
  
  return (
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
            disabled={isEnriching}
          >
            {isEnriching ? "Finding Employees..." : "Find Employees"}
          </Button>
          <Button 
            size="sm" 
            onClick={() => navigate(`/contacts/new?companyId=${companyId}`)}
          >
            Add Contact
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ContactList companyId={companyId} onContactSelect={handleContactSelect} />
        
        <ContactDetailDialog 
          contact={selectedContact} 
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          onFindEmail={handleFindEmail}
          onEnrichContact={handleEnrichContact}
          isFindingEmail={isFindingEmail}
          isEnrichingContact={isEnrichingContact}
        />
      </CardContent>
    </Card>
  );
};
