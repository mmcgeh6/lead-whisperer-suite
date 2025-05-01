
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/types";

export const useContactEnrichment = (contact: Contact, setContacts: (contacts: Contact[]) => void, contacts: Contact[]) => {
  const [isEnriching, setIsEnriching] = useState(false);
  const { toast } = useToast();
  
  const handleEnrichContact = async () => {
    if (!contact.linkedin_url) {
      toast({
        title: "LinkedIn URL Missing",
        description: "This contact doesn't have a LinkedIn URL. Please add it first.",
        variant: "destructive"
      });
      return;
    }

    setIsEnriching(true);
    
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
      
      if (!profileData) {
        toast({
          title: "No Data Found",
          description: "No profile data was returned from the enrichment service.",
          variant: "default"
        });
        setIsEnriching(false);
        return;
      }
      
      // Prepare the update data - only include fields that exist in our database schema
      const updateData: Record<string, any> = {
        last_enriched: new Date().toISOString()
      };

      // Extract mobile number if available
      if (profileData.mobileNumber) {
        updateData.mobile_phone = profileData.mobileNumber;
      }

      // Extract headline/position
      if (profileData.headline || profileData.position || profileData.jobTitle) {
        updateData.headline = profileData.headline || profileData.position || profileData.jobTitle;
        updateData.position = profileData.headline || profileData.position || profileData.jobTitle;
      }

      // Extract bio/about
      if (profileData.bio || profileData.summary || profileData.about) {
        updateData.linkedin_bio = profileData.bio || profileData.summary || profileData.about;
        updateData.about = profileData.about || profileData.bio || profileData.summary;
      }

      // Extract location info if available
      if (profileData.location || profileData.addressWithoutCountry) {
        updateData.address = profileData.addressWithoutCountry || profileData.location;
        
        // Try to parse location string into components
        const locationString = profileData.location || profileData.addressWithoutCountry;
        if (locationString && typeof locationString === 'string') {
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
      
      // Extract city specifically if available
      if (profileData.city) {
        updateData.city = profileData.city;
      }
      
      // Extract country specifically if available
      if (profileData.country || profileData.addressCountryOnly) {
        updateData.country = profileData.country || profileData.addressCountryOnly;
      }

      // Extract job start date if available
      if (profileData.jobStartDate || (profileData.current_job && profileData.current_job.start_date)) {
        updateData.job_start_date = profileData.jobStartDate || profileData.current_job.start_date;
      }

      // Extract languages if present in database schema
      if (profileData.languages && Array.isArray(profileData.languages)) {
        updateData.languages = JSON.stringify(profileData.languages);
      }

      // Extract skills
      if (Array.isArray(profileData.skills) && profileData.skills.length > 0) {
        updateData.linkedin_skills = profileData.skills;
      } else if (profileData.topSkillsByEndorsements) {
        updateData.linkedin_skills = profileData.topSkillsByEndorsements.split(", ");
      }

      // Extract education
      if (Array.isArray(profileData.education) || Array.isArray(profileData.educations)) {
        updateData.linkedin_education = profileData.educations || profileData.education;
      }

      // Extract experience
      if (Array.isArray(profileData.experiences) || Array.isArray(profileData.job_history)) {
        updateData.linkedin_experience = profileData.job_history || profileData.experiences;
      }

      // Extract posts if available
      if (profileData.profile_post_text) {
        // Handle the new format with single post
        updateData.linkedin_posts = [{
          id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: profileData.profile_post_text,
          timestamp: profileData.profile_posted_at?.date || new Date().toISOString(),
          likes: profileData.profile_stats?.total_reactions || 0,
          comments: profileData.profile_stats?.comments || 0,
          url: null
        }];
      } else if (Array.isArray(profileData.posts) && profileData.posts.length > 0) {
        updateData.linkedin_posts = profileData.posts.map(post => ({
          id: post.id || `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: post.content || post.text || '',
          timestamp: post.timestamp || post.date || new Date().toISOString(),
          likes: post.likes || 0,
          comments: post.comments || 0,
          url: post.url || null
        }));
      }

      // If no meaningful data was found, notify the user
      if (Object.keys(updateData).length <= 1) { // Only has last_enriched
        toast({
          title: "No Profile Data Found",
          description: "No useful LinkedIn profile data could be retrieved.",
          variant: "default"
        });
        setIsEnriching(false);
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
        throw new Error(`Failed to update contact with LinkedIn data: ${error.message}`);
      }

      // Update local state
      const updatedContact = { ...contact };

      // Only update fields that were in the updateData object
      for (const [key, value] of Object.entries(updateData)) {
        // Convert snake_case keys to camelCase for the contact object if needed
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
          description: `Could not retrieve additional data: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive"
        });
      }
    } finally {
      setIsEnriching(false);
    }
  };
  
  return { isEnriching, handleEnrichContact };
};
