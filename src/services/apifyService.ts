
/**
 * Service to handle interactions with the Apify API for lead searches
 */

import { Company, Contact } from "@/types";

export type SearchType = 'people' | 'companies';

// Define what our transformed results will look like
export interface PeopleSearchResult {
  company: Company;
  contact: Partial<Contact>;
}

export interface CompanySearchResult {
  company: Company;
}

export type SearchResult = PeopleSearchResult | CompanySearchResult;

/**
 * Search for leads using the Apify Apollo Scraper API
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
    // Get the API key from localStorage
    const apiKey = localStorage.getItem('apifyApolloApiKey');
    
    if (!apiKey) {
      throw new Error("Apify API key is not configured");
    }
    
    // Default limit if not provided
    const limit = params.limit || 20;
    
    // Default location if not provided
    const location = params.location || "United States";
    
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
      
      endpoint = `https://api.apify.com/v2/acts/patXsmIVzLafH9GKD/run-sync-get-dataset-items?timeout=300`;
      
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
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      },
      body: body
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API response error:", errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API response:", data);
    
    return data;
  } catch (error) {
    console.error("Error searching for leads via Apify:", error);
    throw error;
  }
};

/**
 * Transform raw Apify data into a standardized leads format
 */
export const transformApifyResults = (results: any[], searchType: SearchType = 'people'): SearchResult[] => {
  if (!results || !Array.isArray(results)) {
    return [];
  }
  
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
