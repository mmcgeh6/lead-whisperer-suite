
import { formatApolloSearchUrl, apolloApiRequest, parseApolloResponse } from './apolloService';
import { supabase } from "@/integrations/supabase/client";

export enum SearchType {
  PEOPLE = 'people',
  COMPANIES = 'companies'
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
export const getAppSettings = async () => {
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
      apifyApiKey: data?.apifyapikey || null,
      apolloApiKey: data?.apolloapikey || null,
      apifyApolloApiKey: data?.apifyapolloapikey || null,
      leadProvider: data?.leadprovider || null
    };
  } catch (error) {
    console.error("Failed to load app settings:", error);
    return {};
  }
};

// Main function to search for leads
export const searchForLeads = async (params: any) => {
  // Get settings from Supabase
  const settings = await getAppSettings();
  
  console.log("Using settings for search:", {
    leadProvider: settings.leadProvider,
    hasApolloKey: Boolean(settings.apolloApiKey),
    hasApifyApolloKey: Boolean(settings.apifyApolloApiKey)
  });
  
  // Use Apollo API by default or if specified
  if (!settings.leadProvider || settings.leadProvider === 'apollo') {
    if (settings.apolloApiKey) {
      console.log("Searching with Apollo.io API");
      return await searchApollo(params, settings.apolloApiKey);
    } else {
      console.error("Apollo.io API key not found");
      throw new Error("Apollo.io API key is required. Please add it in API Settings.");
    }
  } else {
    console.error("Unsupported lead provider:", settings.leadProvider);
    throw new Error(`Unsupported lead provider: ${settings.leadProvider}`);
  }
};

// Search using Apollo API
const searchApollo = async (params: any, apiKey: string) => {
  try {
    console.log("Formatting Apollo search URL with params:", params);
    
    // Format search URL for Apollo API
    const url = formatApolloSearchUrl({
      personTitles: params.personTitles,
      location: params.location,
      organizationLocations: params.organizationLocations,
      seniorities: params.seniorities,
      emailStatus: params.emailStatus,
      employeeRanges: params.employeeRanges,
      keywords: params.keywords,
      limit: params.limit
    });
    
    console.log("Searching Apollo with URL:", url);
    
    // Make the request via our n8n webhook
    const response = await apolloApiRequest(url, apiKey);
    console.log("Apollo API response received:", response ? "Response received" : "No response");
    
    // Parse the response
    const parsedResponse = parseApolloResponse(response);
    
    // Check if we have results
    if (parsedResponse && parsedResponse.results) {
      console.log(`Found ${parsedResponse.results.length} results from Apollo`);
      return parsedResponse.results;
    } else {
      console.log("No results found or response format error");
      return [];
    }
  } catch (error) {
    console.error("Error in Apollo search:", error);
    throw error;
  }
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
      // Transform Apollo API contact result to our standard format
      return {
        contact: {
          firstName: person.first_name || "",
          lastName: person.last_name || "",
          title: person.title || "",
          email: person.email || "",
          phone: person.phone_number || person.mobile_phone || "",
          linkedin_url: person.linkedin_url || ""
        },
        company: {
          name: person.organization_name || "",
          industry: person.organization?.industry || "",
          location: person.city ? `${person.city}${person.state ? `, ${person.state}` : ""}` : "",
          website: person.organization?.website_url || "",
          description: person.organization?.short_description || "",
          linkedin_url: person.organization?.linkedin_url || "",
          size: person.organization?.estimated_num_employees || ""
        }
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
