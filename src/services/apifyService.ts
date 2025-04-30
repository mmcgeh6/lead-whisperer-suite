
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
export interface AppSettings {
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
      .eq('id', 'default')
      .single();
    
    if (error) {
      console.error("Error fetching settings from Supabase:", error);
      // Fallback to localStorage if Supabase fails
      return getLocalStorageSettings();
    }
    
    if (data) {
      console.log("Using settings from Supabase:", data);
      // Cast the data to the expected type
      const settings: Partial<AppSettings> = {
        leadProvider: data.leadprovider as LeadProvider,
        apolloApiKey: data.apolloapikey || '',
        apifyApolloApiKey: data.apifyapolloapikey || '',
        companyResearchWebhook: data.companyresearchwebhook || '',
        marketResearchWebhook: data.marketresearchwebhook || '',
        growthResearchWebhook: data.growthresearchwebhook || '',
        techResearchWebhook: data.techresearchwebhook || '',
      };
      return settings;
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
 * Build the Apollo.io URL for search based on provided parameters
 */
export const buildApolloSearchUrl = (params: {
  searchType: SearchType;
  keywords: string[];
  location?: string;
  departments?: string[];
  seniorities?: string[];
  employeeRanges?: string[];
  emailStatus?: string[];
}): string => {
  // Start with the base URL
  let baseUrl = 'https://app.apollo.io/#/';
  
  // Determine if searching people or companies
  baseUrl += params.searchType === 'people' ? 'people' : 'companies';
  
  // Create URL search params
  const urlParams = new URLSearchParams();
  
  // Fixed params
  urlParams.append('sortAscending', 'false');
  urlParams.append('sortByField', '%5Bnone%5D');
  urlParams.append('page', '1');
  
  // Always include these organization keyword fields
  urlParams.append('includedOrganizationKeywordFields[]', 'tags');
  urlParams.append('includedOrganizationKeywordFields[]', 'name');
  urlParams.append('includedOrganizationKeywordFields[]', 'seo_description');
  
  // Include existFields for organization_id (needed for proper search execution)
  urlParams.append('existFields[]', 'organization_id');
  
  // Add keywords (for industry/tags)
  if (params.keywords && params.keywords.length > 0) {
    params.keywords.forEach(keyword => {
      if (keyword && keyword.trim()) {
        urlParams.append('qOrganizationKeywordTags[]', keyword.trim());
      }
    });
  }
  
  // Add location
  if (params.location) {
    urlParams.append('organizationLocations[]', params.location);
  }
  
  // Add employee ranges
  if (params.employeeRanges && params.employeeRanges.length > 0) {
    params.employeeRanges.forEach(range => {
      urlParams.append('organizationNumEmployeesRanges[]', range);
    });
  }
  
  // People-specific parameters
  if (params.searchType === 'people') {
    // Add departments
    if (params.departments && params.departments.length > 0) {
      params.departments.forEach(dept => {
        urlParams.append('personDepartmentOrSubdepartments[]', dept);
      });
    }
    
    // Add seniority levels
    if (params.seniorities && params.seniorities.length > 0) {
      params.seniorities.forEach(seniority => {
        urlParams.append('personSeniorities[]', seniority);
      });
    }
    
    // Add email status
    if (params.emailStatus && params.emailStatus.length > 0) {
      params.emailStatus.forEach(status => {
        urlParams.append('contactEmailStatusV2[]', status);
      });
    }
  }
  
  // Construct the final URL
  const finalUrl = `${baseUrl}?${urlParams.toString()}`;
  console.log(`Built Apollo URL: ${finalUrl}`);
  return finalUrl;
};

/**
 * Search for leads using the selected lead provider
 * @param params Search parameters
 * @returns Search results
 */
export const searchForLeads = async (params: {
  searchType: SearchType;
  industry?: string;
  keywords?: string[];
  location?: string;
  departments?: string[];
  seniorities?: string[];
  employeeRanges?: string[];
  emailStatus?: string[];
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
    
    // Convert single industry string to keywords array if needed
    const keywords = params.keywords || 
      (params.industry ? params.industry.split(',').map(k => k.trim()).filter(k => k) : []);
    
    if (leadProvider === 'apollo') {
      // Apollo.io direct API implementation (placeholder for now)
      throw new Error("Direct Apollo.io API integration is not implemented yet. Please use Apify Apollo scraper instead.");
    } else {
      // Use Apify Apollo scraper
      console.log(`Searching with Apify Apollo for ${params.searchType} with keywords: ${keywords.join(', ')} and limit ${limit}`);
      
      // Prepare search parameters for URL building
      const searchParams = {
        searchType: params.searchType,
        keywords: keywords,
        location: location,
        departments: params.departments || [],
        seniorities: params.seniorities || [],
        employeeRanges: params.employeeRanges || [],
        emailStatus: params.emailStatus || []
      };
      
      // Build the Apollo URL dynamically
      const apolloUrl = buildApolloSearchUrl(searchParams);
      console.log("Dynamic Apollo URL:", apolloUrl);
      
      return searchWithApifyApollo(params.searchType, apolloUrl, apiKey, limit);
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
  searchType: SearchType,
  apolloUrl: string,
  apiKey: string,
  limit: number
) => {
  let endpoint: string;
  let body: any;
  
  if (searchType === 'people') {
    endpoint = `https://api.apify.com/v2/acts/jljBwyyQakqrL1wae/run-sync-get-dataset-items?timeout=300&limit=${limit}`;
    body = JSON.stringify({ url: apolloUrl });
    console.log("People Search URL:", apolloUrl);
  } else {
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
    console.log(`Starting API call to Apify with key (first few chars): ${apiKey.substring(0, 5)}...`);
    
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
    console.log("API Response Status:", response.status, response.statusText);
    console.log("Raw API response (first 500 chars):", responseText.substring(0, 500));
    
    if (!response.ok) {
      console.error("API response error:", response.status, responseText);
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }
    
    // Try to parse the JSON response
    try {
      const data = JSON.parse(responseText);
      console.log("API parsed response type:", Array.isArray(data) ? "Array" : typeof data);
      console.log("API parsed response items count:", Array.isArray(data) ? data.length : "N/A");
      
      // Check if we have a valid array with some items
      if (!Array.isArray(data)) {
        console.error("Expected array response but got:", typeof data);
        return [];
      }
      
      if (data.length === 0) {
        console.log("API returned empty array - no results found");
      } else {
        console.log("First item sample:", JSON.stringify(data[0]).substring(0, 200));
      }
      
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
  
  try {
    if (searchType === 'people') {
      return results.map((item, index) => {
        try {
          console.log(`Processing people item ${index}:`, typeof item);
          
          // First, extract the correct company data, handling different possible formats
          let companyName = "";
          let companyWebsite = "";
          let companyIndustry = "";
          let companySize = "";
          let companyLocation = "";
          let companyDescription = "";
          let companyLinkedinUrl = "";
          
          // Check for top-level organization field which contains the company name
          if (typeof item.organization === 'string') {
            companyName = item.organization;
            console.log(`Found company name '${companyName}' in organization field`);
          } else if (typeof item.organization_name === 'string') {
            companyName = item.organization_name;
            console.log(`Found company name '${companyName}' in organization_name field`);
          } else if (typeof item.company_name === 'string') {
            companyName = item.company_name;
            console.log(`Found company name '${companyName}' in company_name field`);
          } else if (item.organization && typeof item.organization === 'object' && item.organization.name) {
            companyName = item.organization.name;
            console.log(`Found company name '${companyName}' in organization.name field`);
          }
          
          // Website URL
          if (typeof item.website_url === 'string') {
            companyWebsite = item.website_url;
          } else if (typeof item.organization_website === 'string') {
            companyWebsite = item.organization_website;
          } else if (typeof item.website === 'string') {
            companyWebsite = item.website;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.website_url) {
            companyWebsite = item.organization.website_url;
          }
          
          // Industry
          if (typeof item.industry === 'string') {
            companyIndustry = item.industry;
          } else if (typeof item.organization_industry === 'string') {
            companyIndustry = item.organization_industry;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.industry) {
            companyIndustry = item.organization.industry;
          }
          
          // Size
          if (typeof item.organization_size === 'string') {
            companySize = item.organization_size;
          } else if (typeof item.company_size === 'string') {
            companySize = item.company_size;
          } else if (typeof item.size === 'string') {
            companySize = item.size;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.size) {
            companySize = item.organization.size;
          }
          
          // Location
          if (typeof item.city === 'string') {
            companyLocation = item.city;
          } else if (typeof item.location === 'string') {
            companyLocation = item.location;
          } else if (typeof item.organization_location === 'string') {
            companyLocation = item.organization_location;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.location) {
            companyLocation = item.organization.location;
          }
          
          // Description
          if (typeof item.organization_description === 'string') {
            companyDescription = item.organization_description;
          } else if (typeof item.company_description === 'string') {
            companyDescription = item.company_description;
          } else if (typeof item.description === 'string') {
            companyDescription = item.description;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.description) {
            companyDescription = item.organization.description;
          }
          
          // LinkedIn URL
          if (typeof item.organization_linkedin_url === 'string') {
            companyLinkedinUrl = item.organization_linkedin_url;
          } else if (typeof item.company_linkedin_url === 'string') {
            companyLinkedinUrl = item.company_linkedin_url;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.linkedin_url) {
            companyLinkedinUrl = item.organization.linkedin_url;
          }
          
          // Create company object with extracted data
          const company: Company = {
            id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: companyName || "Unknown Company",
            website: companyWebsite || "",
            industry: companyIndustry || "",
            size: companySize || "Unknown",
            location: companyLocation || "",
            description: companyDescription || "",
            linkedin_url: companyLinkedinUrl || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          console.log(`Built company object for '${company.name}'`);
          
          // Extract contact data
          let firstName = "";
          let lastName = "";
          let title = "";
          let email = "";
          let phone = "";
          let contactLinkedinUrl = "";
          
          // First and last name
          if (typeof item.first_name === 'string') {
            firstName = item.first_name;
          } else if (item.contact && typeof item.contact.firstName === 'string') {
            firstName = item.contact.firstName;
          }
          
          if (typeof item.last_name === 'string') {
            lastName = item.last_name;
          } else if (item.contact && typeof item.contact.lastName === 'string') {
            lastName = item.contact.lastName;
          }
          
          // Title
          if (typeof item.title === 'string') {
            title = item.title;
          } else if (item.contact && typeof item.contact.title === 'string') {
            title = item.contact.title;
          }
          
          // Email
          if (typeof item.email === 'string') {
            email = item.email;
          } else if (item.contact && typeof item.contact.email === 'string') {
            email = item.contact.email;
          }
          
          // Phone
          if (typeof item.phone === 'string') {
            phone = item.phone;
          } else if (item.contact && typeof item.contact.phone === 'string') {
            phone = item.contact.phone;
          }
          
          // LinkedIn URL
          if (typeof item.linkedin_url === 'string') {
            contactLinkedinUrl = item.linkedin_url;
          } else if (item.contact && typeof item.contact.linkedin_url === 'string') {
            contactLinkedinUrl = item.contact.linkedin_url;
          }
          
          const contact = {
            id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            firstName: firstName || "",
            lastName: lastName || "",
            title: title || "",
            email: email || "",
            phone: phone || "",
            linkedin_url: contactLinkedinUrl || "",
            companyId: company.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          console.log(`Built contact object for '${firstName} ${lastName}'`);
          
          return { company, contact } as PeopleSearchResult;
        } catch (error) {
          console.error(`Error processing people item ${index}:`, error);
          // Return a default object to avoid breaking the entire transformation
          return {
            company: {
              id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: "Error Processing Company",
              website: "",
              industry: "",
              size: "Unknown",
              location: "",
              description: `Error processing: ${error.message}`,
              linkedin_url: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            contact: {
              id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              firstName: "Error",
              lastName: "Processing",
              title: "",
              email: "",
              phone: "",
              linkedin_url: "",
              companyId: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          } as PeopleSearchResult;
        }
      });
    } else {
      // Company search results transformation
      return results.map((item, index) => {
        try {
          console.log(`Processing company item ${index}:`, typeof item);
          
          // Extract company data with explicit field checking
          let companyName = "";
          let companyWebsite = "";
          let companyIndustry = "";
          let companySize = "";
          let companyLocation = "";
          let companyDescription = "";
          let companyLinkedinUrl = "";
          
          // Company name
          if (typeof item.organization === 'string') {
            companyName = item.organization;
          } else if (typeof item.name === 'string') {
            companyName = item.name;
          } else if (typeof item.organization_name === 'string') {
            companyName = item.organization_name;
          } else if (typeof item.company_name === 'string') {
            companyName = item.company_name;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.name) {
            companyName = item.organization.name;
          }
          
          // Website URL
          if (typeof item.website_url === 'string') {
            companyWebsite = item.website_url;
          } else if (typeof item.website === 'string') {
            companyWebsite = item.website;
          } else if (typeof item.organization_website === 'string') {
            companyWebsite = item.organization_website;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.website_url) {
            companyWebsite = item.organization.website_url;
          }
          
          // Industry
          if (typeof item.industry === 'string') {
            companyIndustry = item.industry;
          } else if (typeof item.organization_industry === 'string') {
            companyIndustry = item.organization_industry;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.industry) {
            companyIndustry = item.organization.industry;
          }
          
          // Size
          if (typeof item.size === 'string') {
            companySize = item.size;
          } else if (typeof item.organization_size === 'string') {
            companySize = item.organization_size;
          } else if (typeof item.company_size === 'string') {
            companySize = item.company_size;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.size) {
            companySize = item.organization.size;
          }
          
          // Location
          if (typeof item.city === 'string') {
            companyLocation = item.city;
          } else if (typeof item.location === 'string') {
            companyLocation = item.location;
          } else if (typeof item.organization_location === 'string') {
            companyLocation = item.organization_location;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.location) {
            companyLocation = item.organization.location;
          }
          
          // Description
          if (typeof item.description === 'string') {
            companyDescription = item.description;
          } else if (typeof item.organization_description === 'string') {
            companyDescription = item.organization_description;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.description) {
            companyDescription = item.organization.description;
          }
          
          // LinkedIn URL
          if (typeof item.linkedin_url === 'string') {
            companyLinkedinUrl = item.linkedin_url;
          } else if (typeof item.organization_linkedin_url === 'string') {
            companyLinkedinUrl = item.organization_linkedin_url;
          } else if (item.organization && typeof item.organization === 'object' && item.organization.linkedin_url) {
            companyLinkedinUrl = item.organization.linkedin_url;
          }
          
          // Create company object with extracted data
          const company: Company = {
            id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: companyName || "Unknown Company",
            website: companyWebsite || "",
            industry: companyIndustry || "",
            size: companySize || "Unknown",
            location: companyLocation || "",
            description: companyDescription || "",
            linkedin_url: companyLinkedinUrl || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          console.log(`Built company object for '${company.name}'`);
          
          return { company } as CompanySearchResult;
        } catch (error) {
          console.error(`Error processing company item ${index}:`, error);
          // Return a default object to avoid breaking the entire transformation
          return {
            company: {
              id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: "Error Processing Company",
              website: "",
              industry: "",
              size: "Unknown",
              location: "",
              description: `Error processing: ${error.message}`,
              linkedin_url: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          } as CompanySearchResult;
        }
      });
    }
  } catch (error) {
    console.error("Error in transformApifyResults:", error);
    return [];
  }
};
