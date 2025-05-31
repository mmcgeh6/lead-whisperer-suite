import { supabase } from "@/integrations/supabase/client";
import { Company, Contact } from "@/types";
import { SearchResult } from "./searchUtils";
import { callCompanyEnrichmentWebhook, processEnrichmentData } from "@/services/enrichmentService";

// Handle saving the selected leads to the database
export const saveSelectedLeads = async (
  selectedLeads: SearchResult[],
  user: any,
  addCompany: (company: Company) => Promise<void>,
  addContact: (contact: Contact) => Promise<void>,
  toast: any,
  listId: string
) => {
  console.log(`Saving ${selectedLeads.length} leads to list ${listId}`);
  
  const savedCompanyIds: string[] = [];
  
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
          phone: rawData.organization?.phone || rawData.phone || "",
          city: rawData.city || "",
          state: rawData.state || "",
          country: rawData.country || "",
          linkedin_url: rawData.organization?.linkedin_url || lead.linkedin_url || "",
          facebook_url: rawData.organization?.facebook_url || "",
          twitter_url: rawData.organization?.twitter_url || "",
          logo_url: rawData.organization?.logo_url || "",
          primary_domain: rawData.organization?.primary_domain || "",
          user_id: user?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Add company and get its ID
        console.log("Adding company with enriched data:", companyData.name);
        const companyId = await addCompanyAndGetId(companyData, user?.id);
        
        if (companyId) {
          savedCompanyIds.push(companyId);
          
          // Check if this is a person search result with contact info
          if ((lead.type === 'person' || rawData.first_name) && companyId) {
            console.log("Found person lead, calling enrichment webhook with contact ID:", rawData.id);
            
            // Call company enrichment webhook immediately with contact ID from search results
            setTimeout(async () => {
              try {
                const enrichmentData = await callCompanyEnrichmentWebhook({
                  contactId: rawData.id, // Use contact ID from search results
                  firstName: rawData.first_name || "",
                  lastName: rawData.last_name || "",
                  companyName: companyData.name
                });
                
                if (enrichmentData) {
                  console.log("Processing enrichment data for contact and company...");
                  await processEnrichmentData(enrichmentData, rawData.id, companyId);
                  console.log("Enrichment completed successfully");
                } else {
                  console.log("No enrichment data returned");
                }
              } catch (enrichmentError) {
                console.error("Error during enrichment process:", enrichmentError);
              }
            }, 1000); // Delay by 1 second to ensure save completes first
          }
        }
      }
    } catch (error) {
      console.error("Error saving individual lead:", error);
    }
  }
  
  // Add all companies to the selected list in one batch operation
  if (savedCompanyIds.length > 0 && listId) {
    try {
      console.log(`Adding ${savedCompanyIds.length} companies to list ${listId}:`, savedCompanyIds);
      
      const listCompanies = savedCompanyIds.map(companyId => ({
        list_id: listId,
        company_id: companyId
      }));
      
      // First check if entries already exist to avoid duplicate errors
      const { data: existingEntries, error: checkError } = await supabase
        .from('list_companies_new')
        .select('company_id')
        .eq('list_id', listId)
        .in('company_id', savedCompanyIds);
        
      if (checkError) {
        console.error("Error checking existing list entries:", checkError);
        throw checkError;
      }
      
      // Filter out any companies that are already in the list
      const existingCompanyIds = existingEntries?.map(entry => entry.company_id) || [];
      const newCompanies = listCompanies.filter(
        company => !existingCompanyIds.includes(company.company_id)
      );
      
      if (newCompanies.length === 0) {
        console.log("All companies already in the list, nothing to add");
        return true;
      }
      
      // Insert new entries without using onConflict
      const { error } = await supabase
        .from('list_companies_new')
        .insert(newCompanies);
      
      if (error) {
        console.error("Error adding companies to list:", error);
        throw error;
      }
      
      console.log(`Successfully added ${newCompanies.length} companies to list ${listId}`);
      return true;
    } catch (error) {
      console.error("Error in list_companies_new batch insert:", error);
    }
  }
  
  toast({
    title: "Leads Saved & Enrichment Started",
    description: `${selectedLeads.length} leads have been saved to your database and added to the selected list. Enrichment is running in the background.`
  });
  
  return savedCompanyIds.length > 0;
};

// New function to directly save company and get its ID
async function addCompanyAndGetId(companyData: Partial<Company>, userId: string | undefined): Promise<string | null> {
  if (!userId || !companyData.name) {
    console.error("Missing required fields for company creation");
    return null;
  }

  try {
    // First check if the company already exists for this user
    const { data: existingCompany, error: searchError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', companyData.name)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (searchError) {
      console.error("Error checking for existing company:", searchError);
    }

    if (existingCompany?.id) {
      console.log("Company already exists with ID:", existingCompany.id);
      return existingCompany.id;
    }

    // Company doesn't exist, insert it directly with all the new fields
    const { data: newCompany, error: insertError } = await supabase
      .from('companies')
      .insert({
        name: companyData.name,
        website: companyData.website || '',
        industry: companyData.industry || '',
        size: companyData.size || '',
        location: companyData.location || '',
        description: companyData.description || '',
        phone: companyData.phone || '',
        city: companyData.city || '',
        state: companyData.state || '',
        country: companyData.country || '',
        linkedin_url: companyData.linkedin_url || '',
        facebook_url: companyData.facebook_url || '',
        twitter_url: companyData.twitter_url || '',
        logo_url: companyData.logo_url || '',
        primary_domain: companyData.primary_domain || '',
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      console.error("Error inserting company:", insertError);
      return null;
    }

    console.log("Successfully created new company with ID:", newCompany.id);
    return newCompany.id;
  } catch (error) {
    console.error("Error in addCompanyAndGetId:", error);
    return null;
  }
}

// This function is still used by other parts of the app
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
      tags: companyData.tags || [],
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
        console.log("Found company in database with ID:", data.id);
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
          tags: data.tags || [],
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

// Updated function to add contact directly to the database and return contact ID
async function addContactToDatabase(contactData: Partial<Contact>, companyId: string): Promise<string | null> {
  try {
    console.log("Saving contact data:", contactData);
    
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        first_name: contactData.firstName || '',
        last_name: contactData.lastName || '',
        email: contactData.email || '',
        phone: contactData.phone || '',
        position: contactData.title || '',
        linkedin_url: contactData.linkedin_url || '',
        twitter_url: contactData.twitter_url || '',
        facebook_url: contactData.facebook_url || '',
        headline: contactData.headline || '',
        email_status: contactData.email_status || '',
        company_id: companyId,
        notes: contactData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error inserting contact:", error);
      throw error;
    }

    console.log("Successfully created contact with ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Error in addContactToDatabase:", error);
    return null;
  }
}
