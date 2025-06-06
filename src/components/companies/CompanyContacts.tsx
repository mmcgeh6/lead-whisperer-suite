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
      
      // Added special case handling for objects with title and subComponents
      if (typeof exp === 'object' && exp !== null && exp.title && exp.subComponents) {
        let formatted = exp.title;
        
        // Handle subComponents by extracting text when possible
        if (Array.isArray(exp.subComponents)) {
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
          } else {
            formatted += `: ${JSON.stringify(exp.subComponents)}`;
          }
        }
        
        return formatted;
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
      content: typeof post.content === 'string' ? post.content : 
               typeof post.text === 'string' ? post.text : 
               JSON.stringify(post.content || post.text || ''),
      timestamp: post.timestamp || post.date || new Date().toISOString(),
      likes: post.likes || 0,
      comments: post.comments || 0,
      url: post.url || null
    }));
  };
  
  // Parse and extract skill information from complex objects
  const formatSkills = (skills: any[]): string[] => {
    if (!Array.isArray(skills)) return [];
    
    return skills.map(skill => {
      // If skill is already a string, return it
      if (typeof skill === 'string') {
        return skill;
      }
      
      // Handle object with title and subComponents (LinkedIn skills format)
      if (typeof skill === 'object' && skill !== null) {
        if (skill.title) {
          return skill.title;
        }
        
        // Fall back to JSON string but clean it up
        return JSON.stringify(skill)
          .replace(/[{}"\\]/g, '') // Remove JSON syntax characters
          .replace(/:/g, ': ')     // Add space after colons
          .replace(/,/g, ', ');    // Add space after commas
      }
      
      return String(skill);
    });
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
      
      // Prepare the update data - only include fields that exist in our database
      const updateData: Record<string, any> = {
        last_enriched: new Date().toISOString()
      };

      // Extract mobile number if available
      if (profileData.mobileNumber) {
        updateData.mobile_phone = profileData.mobileNumber;
      }

      // Extract bio/about
      if (profileData.bio || profileData.summary || profileData.about) {
        updateData.linkedin_bio = profileData.bio || profileData.summary || profileData.about;
        updateData.about = profileData.about;
      }

      // Extract location info if available
      if (profileData.location || profileData.addressWithoutCountry) {
        const locationString = profileData.location || profileData.addressWithoutCountry;
        if (locationString) {
          // Try to parse location string into components
          if (locationString.includes(",")) {
            const parts = locationString.split(",").map(part => part.trim());
            if (parts.length >= 2) {
              updateData.city = parts[0];
              updateData.country = parts[parts.length - 1];
            } else {
              updateData.city = locationString;
            }
          } else {
            updateData.city = locationString;
          }
        }
      }

      // Extract languages if available
      if (Array.isArray(profileData.languages) && profileData.languages.length > 0) {
        updateData.languages = profileData.languages;
      }

      // Extract skills and ensure they are properly formatted
      if (Array.isArray(profileData.skills) && profileData.skills.length > 0) {
        updateData.linkedin_skills = formatSkills(profileData.skills);
      } else if (profileData.topSkillsByEndorsements) {
        updateData.linkedin_skills = profileData.topSkillsByEndorsements.split(", ");
      }
      
      // Extract position if available
      if (profileData.position || profileData.headline || profileData.jobTitle) {
        updateData.position = profileData.position || profileData.headline || profileData.jobTitle;
      }

      // Extract education and store as formatted strings
      if (Array.isArray(profileData.education) || Array.isArray(profileData.educations)) {
        const educationData = profileData.education || profileData.educations;
        updateData.linkedin_education = educationData;
      }

      // Extract experience and process to ensure it's properly formatted
      if (Array.isArray(profileData.experiences) || Array.isArray(profileData.job_history)) {
        const experienceData = profileData.experiences || profileData.job_history;
        updateData.linkedin_experience = processExperienceData(experienceData);
      }

      // Extract posts and format properly
      if (Array.isArray(profileData.posts) && profileData.posts.length > 0) {
        const formattedPosts = formatLinkedInPosts(profileData.posts);
        updateData.linkedin_posts = formattedPosts;
      } else if (profileData.profile_post_text) {
        // Handle the new format with just a single post
        const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        updateData.linkedin_posts = [{
          id: postId,
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
      
      // Update the contact in Supabase - using only fields that exist in our database
      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contact.id);

      if (error) {
        console.error("Error updating contact:", error);
        throw new Error("Failed to update contact with LinkedIn data");
      }

      // Update local state
      const updatedContact = { ...contact };

      // Only update fields that were in the updateData object
      for (const [key, value] of Object.entries(updateData)) {
        // Convert snake_case keys to camelCase for the contact object
        const camelKey = key.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase());
        (updatedContact as any)[camelKey] = value;
      }
      
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
