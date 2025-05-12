
import { supabase } from "@/integrations/supabase/client";
import { Company, Contact } from "@/types";
import { SearchResult } from "./searchUtils";

// Handle saving the selected leads to the database
export const saveSelectedLeads = async (
  selectedLeads: SearchResult[],
  user: any,
  addCompany: (company: Company) => Promise<void>,
  addContact: (contact: Contact) => Promise<void>,
  toast: any,
  listId: string
) => {
  console.log(`Saving ${selectedLeads.length} leads`);
  
  // Process each selected lead
  for (const lead of selectedLeads) {
    try {
      console.log("Processing lead to save:", lead.name);
      
      if (lead.raw_data) {
        // Process the direct Apollo.io data format
        const rawData = lead.raw_data;
        console.log("Found lead data:", rawData);
        
        // Create a comprehensive company object from all available fields
        const companyData: Partial<Company> = {
          name: rawData.organization_name || lead.company || "Unknown Company",
          website: rawData.organization?.website_url || lead.website || "",
          industry: rawData.organization?.industry || lead.industry || "",
          size: rawData.organization?.size || "",
          location: rawData.present_raw_address || lead.location || "",
          description: rawData.organization?.description || "",
          phone: rawData.phone || "",
          city: rawData.city || "",
          state: rawData.state || "",
          country: rawData.country || "",
          linkedin_url: rawData.organization?.linkedin_url || lead.linkedin_url || "",
          facebook_url: rawData.organization?.facebook_url || "",
          twitter_url: rawData.organization?.twitter_url || "",
          user_id: user?.id, // Associate with the current user
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Add company
        console.log("Adding company with enriched data:", companyData.name);
        const addedCompany = await handleEditCompany(companyData, addCompany);
        
        // Only proceed if we have a valid company object
        if (addedCompany && addedCompany.id) {
          // Add contact if this is a person search result with contact info
          if ((lead.type === 'person' || lead.raw_data.first_name) && addedCompany) {
            console.log("Adding contact:", `${lead.raw_data.first_name || ""} ${lead.raw_data.last_name || ""}`);
            const contactData: Partial<Contact> = {
              firstName: lead.raw_data.first_name || "",
              lastName: lead.raw_data.last_name || "",
              title: lead.raw_data.title || "",
              email: lead.raw_data.email || "",
              phone: lead.raw_data.sanitized_phone || lead.raw_data.phone || "",
              linkedin_url: lead.raw_data.linkedin_url || "",
              companyId: addedCompany.id,
              notes: `Imported from lead search on ${new Date().toLocaleDateString()}`
            };
            
            await addContact(contactData as Contact);
          }
          
          // Add company to list
          try {
            const { error } = await supabase
              .from('list_companies_new')
              .insert({
                list_id: listId,
                company_id: addedCompany.id
              });
            
            if (error) {
              console.error("Error adding company to list:", error);
            }
          } catch (error) {
            console.error("Error in list_companies_new insert:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error saving individual lead:", error);
    }
  }
  
  toast({
    title: "Leads Saved",
    description: `${selectedLeads.length} leads have been saved to your database and added to the selected list.`
  });
};

// Handle editing or creating a company
export const handleEditCompany = async (
  companyData: Partial<Company>,
  addCompany: (company: Company) => Promise<void>
): Promise<Company | null> => {
  try {
    // Convert companyData to match the Company type structure
    const formattedCompanyData: Company = {
      id: companyData.id || "",
      name: companyData.name || "",
      website: companyData.website || "",
      industry: companyData.industry || "",
      industry_vertical: companyData.industry_vertical || "",
      size: companyData.size || "",
      location: companyData.location || "",
      street: companyData.street || "",
      city: companyData.city || "",
      state: companyData.state || "",
      zip: companyData.zip || "",
      country: companyData.country || "",
      phone: companyData.phone || "",
      description: companyData.description || "",
      facebook_url: companyData.facebook_url || "",
      twitter_url: companyData.twitter_url || "",
      linkedin_url: companyData.linkedin_url || "",
      keywords: companyData.keywords || [],
      createdAt: companyData.createdAt || new Date().toISOString(),
      updatedAt: companyData.updatedAt || new Date().toISOString(),
      insights: companyData.insights || undefined,
      call_script: companyData.call_script || null,
      email_script: companyData.email_script || null,
      text_script: companyData.text_script || null,
      social_dm_script: companyData.social_dm_script || null,
      research_notes: companyData.research_notes || null,
      user_id: companyData.user_id || null,
    };
    
    // Call addCompany from AppContext
    await addCompany(formattedCompanyData);
    
    if (companyData && companyData.name) {
      // Find company by name in database
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('name', companyData.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        console.error("Error finding newly added company:", error);
        return formattedCompanyData;
      }
      
      if (data) {
        // Map the database fields to the Company type
        return {
          id: data.id,
          name: data.name || "",
          website: data.website || "",
          industry: data.industry || "",
          industry_vertical: data.industry_vertical || "",
          size: data.size || "",
          location: data.location || "",
          street: data.street || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          country: data.country || "",
          phone: data.phone || "",
          description: data.description || "",
          facebook_url: data.facebook_url || "",
          twitter_url: data.twitter_url || "",
          linkedin_url: data.linkedin_url || "",
          keywords: data.keywords || [],
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
          insights: undefined, // No insights property in the database schema
          call_script: data.call_script || null,
          email_script: data.email_script || null,
          text_script: data.text_script || null,
          social_dm_script: data.social_dm_script || null,
          research_notes: data.research_notes || null,
          user_id: data.user_id || null,
        };
      }
    }
    
    // Return the company data we have
    return formattedCompanyData;
  } catch (error) {
    console.error("Error adding company:", error);
    return null;
  }
};
