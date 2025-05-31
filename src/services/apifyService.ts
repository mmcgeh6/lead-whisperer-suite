
import { apolloApiRequest, parseApolloResponse } from './apolloService';
import { supabase } from "@/integrations/supabase/client";

export enum SearchType {
  PEOPLE = 'people',
  COMPANIES = 'companies'
}

// Type definition for app settings
export interface AppSettings {
  apolloApiKey?: string | null;
  leadProvider?: string | null;
}

// People search result interface
export interface PeopleSearchResult {
  contact: {
    firstName?: string;
    lastName?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
  };
  company: {
    name?: string;
    industry?: string;
    location?: string;
    website?: string;
    description?: string;
    linkedin_url?: string;
    size?: string;
  };
}

// Company search result interface
export interface CompanySearchResult {
  company: {
    name?: string;
    industry?: string;
    location?: string;
    website?: string;
    description?: string;
    linkedin_url?: string;
    size?: string;
  };
}

// Get application settings from Supabase
export const getAppSettings = async (): Promise<AppSettings> => {
  try {
    // Fetch API settings from Supabase
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'default')
      .single();
      
    if (error) {
      console.error("Error fetching app settings:", error);
      return {};
    }
    
    // Format settings to match expected keys
    return {
      apolloApiKey: data?.apolloapikey || null,
      leadProvider: data?.leadprovider || null
    };
  } catch (error) {
    console.error("Failed to load app settings:", error);
    return {};
  }
};

// Main function to search for leads using Apollo.io API via Supabase Edge Function
export const searchForLeads = async (params: any) => {
  // Get settings from Supabase
  const settings = await getAppSettings();
  
  console.log("Using settings for search:", {
    leadProvider: settings.leadProvider,
    hasApolloKey: Boolean(settings.apolloApiKey)
  });
  
  // Check for Apollo API key
  if (!settings.apolloApiKey) {
    console.error("Apollo.io API key not found");
    throw new Error("Apollo.io API key is required. Please add it in API Settings.");
  }

  console.log("Searching with Apollo.io API via Supabase Edge Function");
  return await searchApollo(params, settings.apolloApiKey);
};

// Search using Apollo API via Supabase Edge Function
const searchApollo = async (params: any, apiKey: string) => {
  try {
    console.log("Starting Apollo search with params:", params);
    
    // Make the request via Supabase Edge Function
    const response = await apolloApiRequest(params, apiKey);
    console.log("Apollo.io API response received:", response ? "Response received" : "No response");
    
    // Parse the response
    const parsedResponse = parseApolloResponse(response);
    console.log("Parsed Apollo response:", parsedResponse);
    
    // Check if we have results
    if (parsedResponse && parsedResponse.people && parsedResponse.people.length > 0) {
      console.log(`Found ${parsedResponse.people.length} results from Apollo.io`);
      return parsedResponse.people;
    } else {
      console.log("No results found from Apollo.io");
      return [];
    }
  } catch (error) {
    console.error("Error in Apollo search:", error);
    throw error;
  }
};

// Helper function to extract current company from employment history
const getCurrentCompanyFromEmployment = (employment: any[]): any => {
  if (!employment || !Array.isArray(employment)) {
    return null;
  }
  
  // First try to find the current employment entry
  const currentJob = employment.find(job => job.current === true);
  
  if (currentJob) {
    console.log("Found current employment:", currentJob);
    // Prioritize organization_name from employment history
    const orgName = currentJob.organization_name || currentJob.organization?.name || "";
    return {
      name: orgName,
      industry: currentJob.organization?.industry || "",
      location: currentJob.organization?.location || "",
      website_url: currentJob.organization?.website_url || currentJob.organization?.primary_domain || "",
      short_description: currentJob.organization?.short_description || "",
      linkedin_url: currentJob.organization?.linkedin_url || "",
      estimated_num_employees: currentJob.organization?.estimated_num_employees || ""
    };
  }
  
  // If no current job is marked, use the first employment entry (most recent)
  if (employment.length > 0) {
    const firstJob = employment[0];
    console.log("No current job marked, using first employment entry:", firstJob);
    const orgName = firstJob.organization_name || firstJob.organization?.name || "";
    return {
      name: orgName,
      industry: firstJob.organization?.industry || "",
      location: firstJob.organization?.location || "",
      website_url: firstJob.organization?.website_url || firstJob.organization?.primary_domain || "",
      short_description: firstJob.organization?.short_description || "",
      linkedin_url: firstJob.organization?.linkedin_url || "",
      estimated_num_employees: firstJob.organization?.estimated_num_employees || ""
    };
  }
  
  return null;
};

// Helper function to get the best company information
const getBestCompanyInfo = (person: any) => {
  // Start with the primary organization
  let companyInfo = {
    name: person.organization?.name || person.organization_name || "",
    industry: person.organization?.industry || "",
    location: person.city ? `${person.city}${person.state ? `, ${person.state}` : ""}` : "",
    website: person.organization?.website_url || person.organization?.primary_domain || "",
    description: person.organization?.short_description || "",
    linkedin_url: person.organization?.linkedin_url || "",
    size: person.organization?.estimated_num_employees || ""
  };

  // If we don't have a company name, or if the company name looks like an industry, 
  // try to get it from employment history
  const hasValidCompanyName = companyInfo.name && 
    companyInfo.name.length > 0 && 
    !isIndustryName(companyInfo.name);

  if (!hasValidCompanyName && person.employment) {
    console.log("Primary company info missing or invalid, checking employment history for:", person.first_name, person.last_name);
    
    const currentCompany = getCurrentCompanyFromEmployment(person.employment);
    if (currentCompany) {
      // Update company info with employment data, prioritizing employment name over primary org
      companyInfo = {
        name: currentCompany.name || companyInfo.name,
        industry: currentCompany.industry || companyInfo.industry,
        location: currentCompany.location || companyInfo.location,
        website: currentCompany.website_url || companyInfo.website,
        description: currentCompany.short_description || companyInfo.description,
        linkedin_url: currentCompany.linkedin_url || companyInfo.linkedin_url,
        size: currentCompany.estimated_num_employees || companyInfo.size
      };
      console.log("Updated company info from employment:", companyInfo);
    }
  }

  return companyInfo;
};

// Helper function to detect if a string looks like an industry name rather than a company name
const isIndustryName = (name: string): boolean => {
  if (!name) return false;
  
  const industryKeywords = [
    'roofing', 'construction', 'technology', 'healthcare', 'finance', 'marketing',
    'software', 'consulting', 'real estate', 'insurance', 'education', 'retail',
    'manufacturing', 'telecommunications', 'automotive', 'agriculture', 'energy',
    'entertainment', 'hospitality', 'logistics', 'media', 'nonprofit', 'pharmaceutical',
    'transportation', 'utilities', 'banking', 'legal', 'accounting', 'engineering'
  ];
  
  const lowerName = name.toLowerCase();
  return industryKeywords.some(keyword => lowerName.includes(keyword) && lowerName.length < 30);
};

// Transform results based on search type
export const transformApifyResults = (results: any, searchType: string): any[] => {
  if (!results || !Array.isArray(results)) {
    console.error("Invalid results format:", results);
    return [];
  }
  
  console.log(`Transforming ${results.length} results from search type: ${searchType}`);
  
  if (searchType === SearchType.PEOPLE) {
    return results.map(person => {
      console.log("Processing person:", person.first_name, person.last_name, "with organization:", person.organization?.name);
      
      // Get the best company information using our helper function
      const companyInfo = getBestCompanyInfo(person);
      
      // Transform Apollo API person result to our standard format
      return {
        contact: {
          firstName: person.first_name || "",
          lastName: person.last_name || "",
          title: person.title || "",
          email: person.email || "",
          phone: person.phone_number || person.mobile_phone || "",
          linkedin_url: person.linkedin_url || ""
        },
        company: companyInfo
      };
    });
  } 
  else if (searchType === SearchType.COMPANIES) {
    return results.map(company => {
      // Transform Apollo API company result to our standard format
      return {
        company: {
          name: company.name || "",
          industry: company.industry || "",
          location: company.location || "",
          website: company.website_url || "",
          description: company.short_description || "",
          linkedin_url: company.linkedin_url || "",
          size: company.estimated_num_employees || ""
        }
      };
    });
  } 
  else {
    console.error("Unsupported search type:", searchType);
    return [];
  }
};
