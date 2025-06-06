import { supabase } from "@/integrations/supabase/client";
import { isIndustryName } from "@/lib/utils";

// Interface for the enrichment webhook response
export interface EnrichmentResponse {
  person: {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    linkedin_url: string;
    title: string;
    email_status: string;
    photo_url: string;
    twitter_url?: string;
    facebook_url?: string;
    headline: string;
    email: string;
    state: string;
    city: string;
    country: string;
    seniority: string;
    employment_history: any[];
    organization: {
      id: string;
      name: string;
      website_url: string;
      linkedin_url: string;
      facebook_url: string;
      primary_phone: {
        number: string;
        sanitized_number: string;
      };
      phone: string;
      founded_year: number;
      logo_url: string;
      primary_domain: string;
      industry: string;
      estimated_num_employees: number;
      keywords: string[];
      raw_address: string;
      short_description: string;
      annual_revenue: number;
      annual_revenue_printed: string;
      technology_names: string[];
    };
  };
}

// Get company enrichment webhook URL from settings
export const getCompanyEnrichmentWebhookUrl = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('companyenrichmentwebhook')
      .eq('id', 'default')
      .single();
    
    if (error) {
      console.warn("Error fetching company enrichment webhook URL:", error);
    }
    
    // Return stored webhook or default to the URL you specified
    const webhookUrl = data?.companyenrichmentwebhook || "https://n8n-service-el78.onrender.com/webhook-test/ab4137c4-b90b-4bf8-9217-da587de82feb";
    console.log("Using company enrichment webhook URL:", webhookUrl);
    return webhookUrl;
  } catch (error) {
    console.error("Error getting company enrichment webhook URL:", error);
    return "https://n8n-service-el78.onrender.com/webhook-test/ab4137c4-b90b-4bf8-9217-da587de82feb";
  }
};

// Call the company enrichment webhook with contact ID
export const callCompanyEnrichmentWebhook = async (contactData: any): Promise<EnrichmentResponse | null> => {
  try {
    const webhookUrl = await getCompanyEnrichmentWebhookUrl();
    
    console.log("Calling company enrichment webhook for contact ID:", contactData.contactId);
    console.log("Webhook URL:", webhookUrl);
    
    const requestData = {
      contactId: contactData.contactId, // Pass contact ID from search results
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      companyName: contactData.companyName
    };

    console.log("Request data:", requestData);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log("Webhook response status:", response.status);

    if (!response.ok) {
      console.error(`Enrichment webhook failed with status: ${response.status}`);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Enrichment webhook failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Company enrichment data received:", data);

    // Handle array response format
    const enrichmentData = Array.isArray(data) ? data[0] : data;
    return enrichmentData;
  } catch (error) {
    console.error("Error calling company enrichment webhook:", error);
    return null;
  }
};

// Process and save enrichment data - now creates contact if it doesn't exist
export const processEnrichmentData = async (
  enrichmentData: EnrichmentResponse,
  searchContactId: string,
  companyId: string
): Promise<void> => {
  try {
    const person = enrichmentData.person;
    const organization = person.organization;

    console.log("Processing enrichment data for search contact ID:", searchContactId, "and company:", companyId);

    // Create or update contact with enrichment data
    const contactData = {
      first_name: person.first_name || "",
      last_name: person.last_name || "",
      email: person.email || null,
      phone: organization?.primary_phone?.sanitized_number || organization?.phone || null,
      position: person.title || "",
      linkedin_url: person.linkedin_url || "",
      external_id: person.id,
      email_status: person.email_status || null,
      photo_url: person.photo_url || null,
      twitter_url: person.twitter_url || null,
      facebook_url: person.facebook_url || null,
      headline: person.headline || null,
      city: person.city || null,
      country: person.country || null,
      seniority: person.seniority || null,
      linkedin_experience: person.employment_history || null,
      company_id: companyId,
      last_enriched: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: `Imported from lead search and enriched on ${new Date().toLocaleDateString()}`
    };

    console.log("Creating/updating contact with enrichment data:", contactData);

    // Insert the contact directly (not upsert since we don't have conflicts expected)
    const { data: savedContact, error: contactError } = await supabase
      .from('contacts')
      .insert(contactData)
      .select('id')
      .single();

    if (contactError) {
      console.error("Error creating contact with enrichment data:", contactError);
    } else {
      console.log("Successfully created contact with enrichment data:", savedContact);
    }

    // Update company with enrichment data including smart name handling
    if (organization) {
      // Fetch the current company name from the database
      const { data: currentCompanyData, error: fetchError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      if (fetchError) {
        console.warn("Error fetching current company data:", fetchError);
      }

      const existingCompanyName = currentCompanyData?.name;

      const companyUpdateData: any = {
        external_id: organization.id || null,
        website: organization.website_url || null,
        linkedin_url: organization.linkedin_url || null,
        facebook_url: organization.facebook_url || null,
        phone: organization.phone || organization.primary_phone?.sanitized_number || null,
        founded_year: organization.founded_year || null,
        logo_url: organization.logo_url || null,
        primary_domain: organization.primary_domain || null,
        industry: organization.industry || null,
        estimated_num_employees: organization.estimated_num_employees || null,
        keywords: organization.keywords || null,
        raw_address: organization.raw_address || null,
        description: organization.short_description || null,
        annual_revenue: organization.annual_revenue || null,
        annual_revenue_printed: organization.annual_revenue_printed || null,
        technology_names: organization.technology_names || null,
        updated_at: new Date().toISOString()
      };

      // Smart logic for updating the company name
      if (organization.name) {
        const newNameIsGeneric = isIndustryName(organization.name);
        const existingNameIsGeneric = existingCompanyName ? isIndustryName(existingCompanyName) : true;

        console.log("Name update analysis:", {
          newName: organization.name,
          existingName: existingCompanyName,
          newNameIsGeneric,
          existingNameIsGeneric
        });

        if (!newNameIsGeneric) {
          // New name is specific, use it
          companyUpdateData.name = organization.name;
          console.log("Using new specific name:", organization.name);
        } else if (newNameIsGeneric && !existingNameIsGeneric) {
          // New name is generic, existing is specific - keep existing
          console.log("Keeping existing specific name:", existingCompanyName);
          // Don't include name in update
        } else {
          // Both generic, or existing was generic/missing - use new name
          companyUpdateData.name = organization.name;
          console.log("Using new name (both generic or existing was generic):", organization.name);
        }
      }

      // Filter out undefined properties before updating
      const finalCompanyUpdateData = Object.fromEntries(
        Object.entries(companyUpdateData).filter(([_, v]) => v !== undefined && v !== null)
      );

      console.log("Updating company with enrichment data:", finalCompanyUpdateData);

      if (Object.keys(finalCompanyUpdateData).length > 1) { // Check if there's more than just updated_at
        const { error: companyError } = await supabase
          .from('companies')
          .update(finalCompanyUpdateData)
          .eq('id', companyId);

        if (companyError) {
          console.error("Error updating company with enrichment data:", companyError);
        } else {
          console.log("Successfully updated company with enrichment data");
        }
      } else {
        console.log("No meaningful company data to update");
      }
    }

    console.log("Successfully processed enrichment data for contact and company");
  } catch (error) {
    console.error("Error processing enrichment data:", error);
  }
};
