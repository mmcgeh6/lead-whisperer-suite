
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
      
      // Handle complex object with title and subComponents
      if (typeof exp === 'object' && exp !== null && exp.title && exp.subComponents) {
        let formatted = exp.title || '';
        
        // Handle subComponents safely
        if (exp.subComponents) {
          if (typeof exp.subComponents === 'string') {
            formatted += `: ${exp.subComponents}`;
          } else if (Array.isArray(exp.subComponents) && exp.subComponents.length > 0) {
            const extractedTexts = exp.subComponents
              .map((sc: any) => {
                if (typeof sc === 'string') return sc;
                if (sc && typeof sc === 'object' && sc.text) return sc.text;
                return null;
              })
              .filter(Boolean)
              .join(', ');
            
            if (extractedTexts) {
              formatted += `: ${extractedTexts}`;
            }
          } else if (typeof exp.subComponents === 'object' && exp.subComponents !== null) {
            if (exp.subComponents.text) {
              formatted += `: ${exp.subComponents.text}`;
            }
          }
        }
        
        return formatted;
      }
      
      // Handle object format with title, subtitle, etc.
      if (typeof exp === 'object' && exp !== null) {
        if (exp.title || exp.role || exp.position) {
          let formatted = exp.title || exp.role || exp.position || '';
          
          if (exp.company || exp.organization) {
            formatted += ` at ${exp.company || exp.organization}`;
          } else if (exp.subtitle) {
            formatted += ` at ${exp.subtitle}`;
          }
          
          if (exp.caption) {
            formatted += ` ${exp.caption}`;
          }
          
          // Handle date ranges
          if (exp.starts_at || exp.startDate || exp.start_date) {
            const startObj = exp.starts_at || exp.startDate || exp.start_date;
            const startYear = typeof startObj === 'object' ? startObj.year : 
                             (typeof startObj === 'string' ? new Date(startObj).getFullYear() : '');
            const startMonth = typeof startObj === 'object' ? (startObj.month ? startObj.month + '/' : '') : '';
            
            formatted += ` (${startMonth}${startYear}-`;
            
            if (exp.ends_at || exp.endDate || exp.end_date) {
              const endObj = exp.ends_at || exp.endDate || exp.end_date;
              const endYear = typeof endObj === 'object' ? endObj.year : 
                             (typeof endObj === 'string' ? new Date(endObj).getFullYear() : 'Present');
              const endMonth = typeof endObj === 'object' ? (endObj.month ? endObj.month + '/' : '') : '';
              
              formatted += `${endMonth}${endYear || 'Present'})`;
            } else {
              formatted += 'Present)';
            }
          }
          
          return formatted;
        }
      }
      
      // As fallback, convert to string
      return typeof exp === 'object' ? JSON.stringify(exp) : String(exp);
    });
  };
  
  // Format LinkedIn posts to ensure they match the expected type
  const formatLinkedInPosts = (posts: any[]): LinkedInPost[] => {
    if (!Array.isArray(posts)) return [];
    
    return posts.map(post => ({
      id: post.id || `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: post.content || post.text || post.profile_post_text || '',
      timestamp: post.timestamp || post.date || (post.profile_posted_at?.date || new Date().toISOString()),
      likes: post.likes || (post.profile_stats?.total_reactions || 0),
      comments: post.comments || (post.profile_stats?.comments || 0),
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
      
      // Use webhook URL for enrichment
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

      // Extract headline/position
      if (profileData.headline || profileData.position || profileData.jobTitle) {
        updateData.position = profileData.headline || profileData.position || profileData.jobTitle;
        updateData.headline = profileData.headline || profileData.position || profileData.jobTitle;
      }

      // Extract bio/about
      if (profileData.bio || profileData.summary || profileData.about) {
        updateData.linkedin_bio = profileData.bio || profileData.summary || profileData.about;
        updateData.about = profileData.bio || profileData.summary || profileData.about;
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
      
      if (profileData.city) {
        updateData.city = profileData.city;
      }
      
      if (profileData.country || profileData.addressCountryOnly) {
        updateData.country = profileData.country || profileData.addressCountryOnly;
      }
      
      // Extract mobile phone if available
      if (profileData.mobilePhone || profileData.mobileNumber) {
        updateData.mobile_phone = profileData.mobilePhone || profileData.mobileNumber;
      }
      
      // Extract job start date if available
      if (profileData.jobStartDate || (profileData.current_job && profileData.current_job.start_date)) {
        updateData.job_start_date = profileData.jobStartDate || profileData.current_job.start_date;
      }

      // Extract education and formats them properly
      if (Array.isArray(profileData.educations || profileData.education)) {
        updateData.linkedin_education = profileData.educations || profileData.education;
      }

      // Extract experience and process to ensure it's properly formatted
      if (Array.isArray(profileData.job_history || profileData.experiences)) {
        updateData.linkedin_experience = profileData.job_history || profileData.experiences;
      }

      // Extract posts and format properly
      if (Array.isArray(profileData.posts) && profileData.posts.length > 0) {
        const formattedPosts = formatLinkedInPosts(profileData.posts);
        updateData.linkedin_posts = formattedPosts;
      } else if (profileData.profile_post_text) {
        // Handle single post format
        updateData.linkedin_posts = [{
          id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: profileData.profile_post_text,
          timestamp: profileData.profile_posted_at?.date || new Date().toISOString(),
          likes: profileData.profile_stats?.total_reactions || 0,
          comments: profileData.profile_stats?.comments || 0,
          url: null
        }];
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
        about: updateData.about,
        headline: updateData.headline,
        linkedin_skills: updateData.linkedin_skills,
        linkedin_experience: updateData.linkedin_experience,
        linkedin_education: updateData.linkedin_education,
        linkedin_posts: updateData.linkedin_posts,
        last_enriched: updateData.last_enriched,
        mobilePhone: updateData.mobile_phone,
        address: updateData.address,
        city: updateData.city,
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
