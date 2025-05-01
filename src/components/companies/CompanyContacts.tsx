
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactList } from "@/components/leads/ContactList";
import { ContactDetailDialog } from "@/components/contacts/ContactDetailDialog";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Contact, LinkedInPost } from "@/types";
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
  
  // Process LinkedIn experience data to ensure it's in the correct format
  const processExperienceData = (experiences: any[]): string[] => {
    if (!Array.isArray(experiences)) return [];

    return experiences.map(exp => {
      // Handle string format (already formatted)
      if (typeof exp === 'string') {
        return exp;
      }
      
      // Handle object format with title, subtitle, etc.
      if (typeof exp === 'object' && exp !== null) {
        if (exp.title && (exp.subtitle || exp.caption)) {
          let formatted = exp.title;
          
          if (exp.subtitle) {
            formatted += ` at ${exp.subtitle}`;
          }
          
          if (exp.caption) {
            formatted += ` ${exp.caption}`;
          }
          
          return formatted;
        }
        
        // Handle standard format
        if (exp.company || exp.title) {
          let formatted = exp.title || '';
          
          if (exp.company) {
            formatted += ` at ${exp.company}`;
          }
          
          if (exp.starts_at) {
            formatted += ` (${exp.starts_at.month ? exp.starts_at.month + '/' : ''}${exp.starts_at.year || ''}-`;
            
            if (exp.ends_at) {
              formatted += `${exp.ends_at.month ? exp.ends_at.month + '/' : ''}${exp.ends_at.year || 'Present'})`;
            } else {
              // Fixed: This was the problematic line - mixed quotes
              formatted += 'Present)';
            }
          }
          
          return formatted;
        }
      }
      
      // As fallback, convert to string
      return JSON.stringify(exp);
    });
  };
  
  // Format LinkedIn posts to ensure they match the expected type
  const formatLinkedInPosts = (posts: any[]): LinkedInPost[] => {
    if (!Array.isArray(posts)) return [];
    
    return posts.map(post => ({
      id: post.id || `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: post.content || post.text || '',
      timestamp: post.timestamp || post.date || new Date().toISOString(),
      likes: post.likes || 0,
      comments: post.comments || 0,
      url: post.url || null
    }));
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
      
      // Use webhook URL for enrichment - note the updated URL from user input
      const webhookUrl = "https://n8n-service-el78.onrender.com/webhook-test/4904a13e-c99a-46fe-b724-6eaace77eec0";
      
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
      const updateData: Record<string, any> = {
        last_enriched: new Date().toISOString()
      };

      // Extract bio
      if (profileData.bio || profileData.summary || profileData.about) {
        updateData.linkedin_bio = profileData.bio || profileData.summary || profileData.about;
      }

      // Extract skills
      if (Array.isArray(profileData.skills) && profileData.skills.length > 0) {
        updateData.linkedin_skills = profileData.skills;
      } else if (profileData.topSkillsByEndorsements) {
        updateData.linkedin_skills = profileData.topSkillsByEndorsements.split(", ");
      }
      
      // Extract languages if available
      if (Array.isArray(profileData.languages)) {
        updateData.languages = profileData.languages;
      }
      
      // Extract address and country if available
      if (profileData.address || profileData.addressWithoutCountry) {
        updateData.address = profileData.address || profileData.addressWithoutCountry;
      }
      
      if (profileData.country || profileData.addressCountryOnly) {
        updateData.country = profileData.country || profileData.addressCountryOnly;
      }
      
      // Extract position if available
      if (profileData.position || profileData.headline || profileData.jobTitle) {
        updateData.position = profileData.position || profileData.headline || profileData.jobTitle;
      }
      
      // Extract mobile number if available
      if (profileData.mobilePhone || profileData.mobileNumber) {
        updateData.mobile_phone = profileData.mobilePhone || profileData.mobileNumber;
      }
      
      // Extract job start date if available
      if (profileData.jobStartDate || (profileData.current_job && profileData.current_job.start_date)) {
        updateData.job_start_date = profileData.jobStartDate || profileData.current_job.start_date;
      }

      // Extract education and store as formatted strings
      if (Array.isArray(profileData.education)) {
        updateData.linkedin_education = profileData.education.map((edu: any) => 
          `${edu.degree || ''} ${edu.field_of_study || ''} at ${edu.school_name || ''} (${edu.starts_at?.year || ''}-${edu.ends_at?.year || 'Present'})`
        );
      }

      // Extract experience and process to ensure it's properly formatted
      if (Array.isArray(profileData.experiences)) {
        if (profileData.experiences[0] && (profileData.experiences[0].title || profileData.experiences[0].company)) {
          // Standard format
          updateData.linkedin_experience = processExperienceData(profileData.experiences);
        } else {
          // Alternative format with subtitle/caption
          updateData.linkedin_experience = processExperienceData(profileData.experiences);
        }
      }

      // Extract posts and format properly
      if (Array.isArray(profileData.posts) && profileData.posts.length > 0) {
        const formattedPosts = formatLinkedInPosts(profileData.posts);
        // Store as stringified JSON to work with Supabase jsonb type
        updateData.linkedin_posts = formattedPosts;
      }

      // If no meaningful data was found, notify the user
      if (Object.keys(updateData).length <= 1) { // Only has last_enriched
        toast({
          title: "No Profile Data Found",
          description: "No useful LinkedIn profile data could be retrieved.",
          variant: "default"
        });
        setIsEnrichingContact(false);
        return;
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
      const updatedContact = { 
        ...contact,
        linkedin_bio: updateData.linkedin_bio,
        linkedin_skills: updateData.linkedin_skills,
        linkedin_experience: updateData.linkedin_experience,
        linkedin_education: updateData.linkedin_education,
        linkedin_posts: updateData.linkedin_posts,
        last_enriched: updateData.last_enriched,
        mobilePhone: updateData.mobile_phone,
        address: updateData.address,
        country: updateData.country,
        position: updateData.position,
        job_start_date: updateData.job_start_date,
        languages: updateData.languages
      };
      
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
