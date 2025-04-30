
/**
 * Service to handle interactions with the Apify API for lead searches
 */

import { Company, Contact } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export type SearchType = 'people' | 'companies';
export type LeadProvider = 'apollo' | 'apify-apollo';

// Define what our transformed results will look like
export interface PeopleSearchResult {
  company: Company;
  contact: Partial<Contact>;
}

export interface CompanySearchResult {
  company: Company;
}

export type SearchResult = PeopleSearchResult | CompanySearchResult;

// Define an interface for the app settings
interface AppSettings {
  leadProvider: LeadProvider;
  apolloApiKey: string;
  apifyApolloApiKey: string;
  companyResearchWebhook: string;
  marketResearchWebhook: string;
  growthResearchWebhook: string;
  techResearchWebhook: string;
}

/**
 * Get application settings from Supabase or fallback to localStorage
 */
export const getAppSettings = async (): Promise<Partial<AppSettings>> => {
  try {
    // First try to get settings from Supabase
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching settings from Supabase:", error);
      // Fallback to localStorage if Supabase fails
      return getLocalStorageSettings();
    }
    
    if (data) {
      console.log("Using settings from Supabase:", data);
      return data as AppSettings;
    } else {
      // Fallback to localStorage if no data in Supabase
      return getLocalStorageSettings();
    }
  } catch (error) {
    console.error("Exception getting settings:", error);
    // Fallback to localStorage on any exception
    return getLocalStorageSettings();
  }
};

/**
 * Get settings from localStorage as fallback
 */
const getLocalStorageSettings = (): Partial<AppSettings> => {
  console.log("Using settings from localStorage");
  return {
    leadProvider: localStorage.getItem('leadProvider') as LeadProvider || 'apify-apollo',
    apolloApiKey: localStorage.getItem('apollioApiKey') || '',
    apifyApolloApiKey: localStorage.getItem('apifyApolloApiKey') || '',
    companyResearchWebhook: localStorage.getItem('companyResearchWebhook') || '',
    marketResearchWebhook: localStorage.getItem('marketResearchWebhook') || '',
    growthResearchWebhook: localStorage.getItem('growthResearchWebhook') || '',
    techResearchWebhook: localStorage.getItem('techResearchWebhook') || ''
  };
};

/**
 * Search for leads using the selected lead provider
 * @param params Search parameters
 * @returns Search results
 */
export const searchForLeads = async (params: {
  searchType: SearchType;
  industry: string;
  location?: string;
  limit?: number;
}) => {
  try {
    // Get settings from Supabase
    const settings = await getAppSettings();
    
    // Get the lead provider
    const leadProvider = settings.leadProvider || 'apify-apollo';
    
    // Get the appropriate API key based on the selected provider
    let apiKey: string | null = null;
    
    if (leadProvider === 'apollo') {
      apiKey = settings.apolloApiKey || null;
    } else {
      apiKey = settings.apifyApolloApiKey || null;
    }
    
    if (!apiKey || apiKey.trim() === '') {
      throw new Error(`${leadProvider === 'apollo' ? 'Apollo.io' : 'Apify'} API key is not configured. Please set up your API key in API Settings.`);
    }
    
    // Default limit if not provided
    const limit = params.limit || 20;
    
    // Default location if not provided
    const location = params.location || "United States";
    
    if (leadProvider === 'apollo') {
      // Apollo.io direct API implementation (placeholder for now)
      throw new Error("Direct Apollo.io API integration is not implemented yet. Please use Apify Apollo scraper instead.");
    } else {
      // Use Apify Apollo scraper
      console.log(`Searching with Apify Apollo for ${params.searchType} in ${params.industry} with limit ${limit}`);
      return searchWithApifyApollo(params, apiKey, limit, location);
    }
  } catch (error) {
    console.error("Error searching for leads:", error);
    throw error;
  }
};

/**
 * Search using the Apify Apollo Scraper
 */
const searchWithApifyApollo = async (
  params: { searchType: SearchType; industry: string },
  apiKey: string,
  limit: number,
  location: string
) => {
  let endpoint: string;
  let body: any;
  
  if (params.searchType === 'people') {
    // Format the search URL for Apollo.io people search
    const apolloUrl = `https://app.apollo.io/#/people?page=1&existFields[]=organization_id&includedOrganizationKeywordFields[]=tags&includedOrganizationKeywordFields[]=name&includedOrganizationKeywordFields[]=seo_description&organizationLocations[]=${encodeURIComponent(location)}&sortByField=%5Bnone%5D&sortAscending=false&qOrganizationKeywordTags[]=${encodeURIComponent(params.industry)}&personSeniorities[]=director&personDepartmentOrSubdepartments[]=master_marketing&personDepartmentOrSubdepartments[]=master_sales`;
    
    endpoint = `https://api.apify.com/v2/acts/jljBwyyQakqrL1wae/run-sync-get-dataset-items?timeout=300&limit=${limit}`;
    
    body = JSON.stringify({ url: apolloUrl });
    
    console.log("People Search URL:", apolloUrl);
  } else {
    // Format the search URL for Apollo.io company search
    const apolloUrl = `https://app.apollo.io/#/companies?page=1&organizationLocations[]=${encodeURIComponent(location)}&organizationIndustryTagIds[]=${encodeURIComponent(params.industry)}`;
    
    endpoint = `https://api.apify.com/v2/acts/patXsmIVzLafH9GKD/run-sync-get-dataset-items?timeout=300&limit=${limit}`;
    
    body = JSON.stringify({
      searchUrl: apolloUrl,
      count: limit,
      deepScrape: false,
      maxDelay: 7,
      minDelay: 2,
      scrapeJobs: false,
      scrapeNews: false,
      startPage: 1
    });
    
    console.log("Company Search URL:", apolloUrl);
  }
  
  console.log("API endpoint:", endpoint);
  console.log("API request body:", body);
  
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      },
      body: body
    });
    
    const responseText = await response.text();
    console.log("Raw API response:", responseText);
    
    if (!response.ok) {
      console.error("API response error:", response.status, responseText);
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }
    
    // Try to parse the JSON response
    try {
      const data = JSON.parse(responseText);
      console.log("API parsed response:", data);
      return data;
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      throw new Error(`Failed to parse API response: ${responseText.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error("Error making API request:", error);
    throw error;
  }
};

/**
 * Transform raw Apify data into a standardized leads format
 */
export const transformApifyResults = (results: any[], searchType: SearchType = 'people'): SearchResult[] => {
  if (!results || !Array.isArray(results)) {
    console.log("No results or invalid results format:", results);
    return [];
  }
  
  console.log(`Transforming ${results.length} ${searchType} results`);
  
  if (searchType === 'people') {
    return results.map(item => {
      // Extract company data
      const company: Company = {
        id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.organization_name || "Unknown Company",
        website: item.organization_website || "",
        industry: item.organization_industry || "",
        size: item.organization_size || "Unknown",
        location: item.organization_location || "",
        description: item.organization_description || "",
        linkedin_url: item.organization_linkedin_url || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Extract contact data
      const contact = {
        id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        firstName: item.first_name || "",
        lastName: item.last_name || "",
        title: item.title || "",
        email: item.email || "",
        phone: item.phone || "",
        linkedin_url: item.linkedin_url || "",
        companyId: company.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return { company, contact } as PeopleSearchResult;
    });
  } else {
    // Company search results transformation
    return results.map(item => {
      // Extract company data only
      const company: Company = {
        id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name || "Unknown Company",
        website: item.website || "",
        industry: item.industry || "",
        size: item.size || "Unknown",
        location: item.location || "",
        description: item.description || "",
        linkedin_url: item.linkedin_url || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return { company } as CompanySearchResult;
    });
  }
};
