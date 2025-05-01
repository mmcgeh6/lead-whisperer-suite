import { useState } from "react";
import { Company, Contact, Employee, LinkedInPost } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useEnrichment = (company: Company | null) => {
  // Always call all hooks at the top level, regardless of conditions
  const { contacts, setContacts } = useAppContext();
  const { toast } = useToast();
  const [isEnriching, setIsEnriching] = useState(false);
  const [similarCompanies, setSimilarCompanies] = useState<any[]>([]);
  const [isFindingEmail, setIsFindingEmail] = useState(false);
  const [isEnrichingContact, setIsEnrichingContact] = useState(false);
  
  // If no company is provided, return default values for all functions
  if (!company) {
    return {
      isEnriching,
      similarCompanies,
      isFindingEmail,
      isEnrichingContact,
      handleEnrichCompany: () => {},
      handleFindEmail: () => {},
      handleEnrichContact: () => {}
    };
  }
  
  // Function to get webhook URLs from settings
  const getWebhookUrls = async () => {
    try {
      // Try to get webhooks from Supabase first
      const { data, error } = await supabase
        .from('app_settings')
        .select('emailfinderwebhook, linkedinenrichmentwebhook, companyenrichmentwebhook')
        .eq('id', 'default')
        .single();
      
      if (data) {
        return {
          emailFinder: data.emailfinderwebhook || "https://n8n-service-el78.onrender.com/webhook-test/755b751b-eb85-4350-ae99-2508ad2d3f31",
          linkedinEnrichment: data.linkedinenrichmentwebhook || "https://n8n-service-el78.onrender.com/webhook-test/af95b526-404c-4a13-9ca2-2d918b7d4e90",
          companyEnrichment: data.companyenrichmentwebhook || "https://n8n-service-el78.onrender.com/webhook-test/af95b526-404c-4a13-9ca2-2d918b7d4e90"
        };
      }
      
      // If not in Supabase, try localStorage
      return {
        emailFinder: localStorage.getItem('emailFinderWebhook') || "https://n8n-service-el78.onrender.com/webhook-test/755b751b-eb85-4350-ae99-2508ad2d3f31",
        linkedinEnrichment: localStorage.getItem('linkedinEnrichmentWebhook') || "https://n8n-service-el78.onrender.com/webhook-test/af95b526-404c-4a13-9ca2-2d918b7d4e90",
        companyEnrichment: localStorage.getItem('companyEnrichmentWebhook') || "https://n8n-service-el78.onrender.com/webhook-test/af95b526-404c-4a13-9ca2-2d918b7d4e90"
      };
    } catch (error) {
      console.error("Error fetching webhook URLs:", error);
      // Use default webhooks as fallback
      return {
        emailFinder: "https://n8n-service-el78.onrender.com/webhook-test/755b751b-eb85-4350-ae99-2508ad2d3f31",
        linkedinEnrichment: "https://n8n-service-el78.onrender.com/webhook-test/af95b526-404c-4a13-9ca2-2d918b7d4e90",
        companyEnrichment: "https://n8n-service-el78.onrender.com/webhook-test/af95b526-404c-4a13-9ca2-2d918b7d4e90"
      };
    }
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
      
      // Get the company enrichment webhook URL
      const webhookUrls = await getWebhookUrls();
      const webhookUrl = webhookUrls.companyEnrichment;
      
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
  
  // Function to find email using the webhook
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
      // Get the email finder webhook URL
      const webhookUrls = await getWebhookUrls();
      const webhookUrl = webhookUrls.emailFinder;
      
      // Prepare the data to send to the webhook
      const requestData = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        companyName: company.name,
        companyDomain: company.website ? new URL(company.website).hostname.replace('www.', '') : null,
        linkedinUrl: contact.linkedin_url
      };

      console.log("Sending request data:", requestData);

      // Call the webhook to find the email
      const response = await fetch(webhookUrl, {
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
      
      // Get the LinkedIn enrichment webhook URL
      const webhookUrls = await getWebhookUrls();
      const webhookUrl = webhookUrls.linkedinEnrichment;
      
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

      // Extract education
      if (Array.isArray(profileData.education)) {
        updateData.linkedin_education = profileData.education.map((edu: any) => 
          `${edu.degree || ''} ${edu.field_of_study || ''} at ${edu.school_name || ''} (${edu.starts_at?.year || ''}-${edu.ends_at?.year || 'Present'})`
        );
      }

      // Extract experience
      if (Array.isArray(profileData.experiences)) {
        updateData.linkedin_experience = profileData.experiences.map((exp: any) => 
          `${exp.title || ''} at ${exp.company || ''} (${exp.starts_at?.month ? exp.starts_at.month + '/' : ''}${exp.starts_at?.year || ''}-${exp.ends_at?.month ? exp.ends_at.month + '/' : ''}${exp.ends_at?.year || 'Present'})`
        );
      }

      // Extract posts
      if (Array.isArray(profileData.posts)) {
        updateData.linkedin_posts = profileData.posts.map((post: any) => ({
          id: post.id || `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: post.content || post.text,
          timestamp: post.timestamp || post.date,
          likes: post.likes || 0,
          comments: post.comments || 0,
          url: post.url
        }));
      }

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
    } finally {
      setIsEnrichingContact(false);
    }
  };
  
  return {
    isEnriching,
    similarCompanies,
    isFindingEmail,
    isEnrichingContact,
    handleEnrichCompany,
    handleFindEmail,
    handleEnrichContact
  };
};
