
// Search types for Apollo.io API integration
import { apolloApiRequest, formatApolloSearchUrl, parseApolloResponse } from "./apolloService";
import { archiveSearchResults, saveSearchHistory, updateSearchResultCount } from "./leadStorageService";

export enum SearchType {
  PEOPLE = 'people',
  COMPANY = 'company'
}

// Parameters for Apollo.io search
export interface SearchParams {
  searchType: SearchType;
  keywords?: string[];
  location?: string;
  departments?: string[];
  seniorities?: string[];
  employeeRanges?: string[];
  emailStatus?: string[];
  limit?: number;
  personTitles?: string[];
  organizationLocations?: string[];
  keywordFields?: string[];
}

// App settings interface
export interface AppSettings {
  apolloApiKey?: string;
  companyEnrichmentWebhook?: string;
  linkedinEnrichmentWebhook?: string;
  emailFinderWebhook?: string;
  companyResearchWebhook?: string;
  marketResearchWebhook?: string;
  techResearchWebhook?: string;
  growthResearchWebhook?: string;
  profileResearchWebhook?: string;
  contentWebhook?: string;
  jobsWebhook?: string;
  awardsWebhook?: string;
  idealCustomerWebhook?: string;
  outreachWebhook?: string;
}

// Person search result interface
export interface PeopleSearchResult {
  contact?: {
    firstName?: string;
    lastName?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
  };
  company?: {
    name?: string;
    industry?: string;
    location?: string;
    website?: string;
    description?: string;
    linkedin_url?: string;
    size?: string;
  };
  // Allow access to original Apollo.io response fields
  [key: string]: any;
}

// Company search result interface
export interface CompanySearchResult {
  company?: {
    name?: string;
    industry?: string;
    location?: string;
    website?: string;
    description?: string;
    linkedin_url?: string;
    size?: string;
  };
  // Allow access to original Apollo.io response fields
  [key: string]: any;
}

export type SearchResult = PeopleSearchResult | CompanySearchResult;

// Main search function that uses Apollo.io API directly
export const searchForLeads = async (params: SearchParams) => {
  console.log("searchForLeads called with params:", params);
  
  try {
    // Get Apollo API key from settings
    const settings = await getAppSettings();
    const apiKey = settings.apolloApiKey;
    
    if (!apiKey) {
      throw new Error("Apollo API key not configured");
    }
    
    // Use Apollo.io API to search for leads
    console.log("Using Apollo.io API for search");
    
    // Format the search URL using the helper function
    const searchUrl = formatApolloSearchUrl({
      personTitles: params.personTitles,
      location: params.location,
      organizationLocations: params.organizationLocations,
      seniorities: params.seniorities,
      emailStatus: params.emailStatus,
      employeeRanges: params.employeeRanges,
      keywords: params.keywords,
      limit: params.limit
    });
    
    console.log("Apollo API search URL:", searchUrl);
    
    // Make the API request
    const response = await apolloApiRequest(searchUrl, apiKey);
    console.log("Apollo API response received:", response);
    
    // Parse the response
    const parsedResponse = parseApolloResponse(response);
    
    // Fix: Check if parsedResponse has results property or is an array directly
    if (Array.isArray(parsedResponse)) {
      return parsedResponse;
    } else {
      return parsedResponse.results || [];
    }
  } catch (error) {
    console.error("Error in searchForLeads:", error);
    throw new Error(`Failed to search for leads: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to get app settings from Supabase
export const getAppSettings = async (): Promise<AppSettings> => {
  try {
    // Import supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Get the settings from the app_settings table
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'default')
      .limit(1)
      .single();
    
    if (error) {
      console.error("Error fetching app settings:", error);
      return {};
    }
    
    if (!data) {
      console.log("No app settings found, returning default empty object");
      return {};
    }
    
    // Convert snake_case to camelCase for consistency
    const settings: AppSettings = {
      apolloApiKey: data.apolloapikey,
      companyEnrichmentWebhook: data.companyenrichmentwebhook,
      linkedinEnrichmentWebhook: data.linkedinenrichmentwebhook,
      emailFinderWebhook: data.emailfinderwebhook,
      companyResearchWebhook: data.companyresearchwebhook,
      marketResearchWebhook: data.marketresearchwebhook,
      techResearchWebhook: data.techresearchwebhook,
      growthResearchWebhook: data.growthresearchwebhook,
      profileResearchWebhook: data.profile_research_webhook,
      contentWebhook: data.content_webhook,
      jobsWebhook: data.jobs_webhook,
      awardsWebhook: data.awards_webhook,
      idealCustomerWebhook: data.ideal_customer_webhook,
      outreachWebhook: data.outreach_webhook
    };
    
    return settings;
  } catch (error) {
    console.error("Error in getAppSettings:", error);
    return {};
  }
};

// Function to transform Apollo API results into consistent format
export const transformApifyResults = (results: any[], searchType: string) => {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return [];
  }
  
  console.log(`Transforming ${results.length} ${searchType} results`);
  
  try {
    if (searchType === 'people') {
      return results.map(result => transformPersonResult(result));
    } else if (searchType === 'companies' || searchType === 'organizations') {
      return results.map(result => transformCompanyResult(result));
    }
    
    return [];
  } catch (error) {
    console.error("Error transforming results:", error);
    return [];
  }
};

// Function to transform a person result from Apollo.io API format
const transformPersonResult = (result: any): PeopleSearchResult => {
  try {
    // Extract person/contact data
    const person = {
      firstName: result.first_name || "",
      lastName: result.last_name || "",
      title: result.title || "",
      email: result.email || "",
      phone: result.sanitized_phone || "",
      linkedin_url: result.linkedin_url || ""
    };
    
    // Extract company information
    const company = {
      name: result.organization_name || "",
      industry: result.organization?.industry || "",
      location: result.present_raw_address || `${result.city || ""} ${result.state || ""} ${result.country || ""}`.trim() || "",
      website: result.organization?.website_url || "",
      description: "",
      linkedin_url: result.organization?.linkedin_url || "",
      size: ""
    };
    
    // Return both the extracted data and the original data
    return {
      contact: person,
      company: company,
      ...result  // Include original Apollo.io data
    };
  } catch (error) {
    console.error("Error transforming person result:", error);
    return {
      contact: {
        firstName: "",
        lastName: "",
        title: "",
        email: "",
        phone: "",
        linkedin_url: ""
      },
      company: {
        name: "",
        industry: "",
        location: "",
        website: "",
        description: "",
        linkedin_url: "",
        size: ""
      }
    };
  }
};

// Function to transform a company result
const transformCompanyResult = (result: any): CompanySearchResult => {
  try {
    const organization = result.organization || {};
    
    const company = {
      name: organization.name || "",
      industry: organization.industry || "",
      location: organization.location || "",
      website: organization.website || "",
      description: organization.description || "",
      linkedin_url: organization.linkedin_url || "",
      size: organization.size || ""
    };
    
    return {
      company,
      ...result  // Include original Apollo.io data
    };
  } catch (error) {
    console.error("Error transforming company result:", error);
    return {
      company: {
        name: "",
        industry: "",
        location: "",
        website: "",
        description: "",
        linkedin_url: "",
        size: ""
      }
    };
  }
};
