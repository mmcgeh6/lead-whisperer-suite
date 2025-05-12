// Add a proper SearchType enum to address the type issues
export enum SearchType {
  PEOPLE = 'people',
  COMPANY = 'company'
}

// Update the searchForLeads function parameter type
export interface SearchParams {
  searchType: SearchType;
  industry?: string;
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

// Add AppSettings interface for proper typing
export interface AppSettings {
  apifyApolloApiKey?: string;
  apolloApiKey?: string;
  leadProvider?: string;
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

export const searchForLeads = async (params: SearchParams) => {
  console.log("searchForLeads called with params:", params);
  
  try {
    // Get the API settings
    const settings = await getAppSettings();
    
    // Use Apollo.io API directly
    return await searchWithApollo(params);
  } catch (error) {
    console.error("Error in searchForLeads:", error);
    throw new Error(`Failed to search for leads: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to search using Apollo API directly
const searchWithApollo = async (params: SearchParams) => {
  console.log("Using Apollo API for search");
  
  // Get the API key from settings
  const settings = await getAppSettings();
  const apiKey = settings.apolloApiKey;
  
  if (!apiKey) {
    throw new Error("Apollo API key not configured");
  }
  
  // Prepare the search URL
  let searchUrl = 'https://api.apollo.io/api/v1/mixed_people/search?';
  
  // Add parameters to the URL
  
  // Add person titles if available
  if (params.personTitles && params.personTitles.length > 0) {
    params.personTitles.forEach(title => {
      // Replace spaces with underscores for Apollo API
      const formattedTitle = title.replace(/ /g, '_');
      searchUrl += `person_titles[]=${encodeURIComponent(formattedTitle)}&`;
    });
  }
  
  // Add location if available - using personLocations[] parameter
  if (params.location) {
    searchUrl += `person_locations[]=${encodeURIComponent(params.location)}&`;
  }
  
  // Add organization locations if available
  if (params.organizationLocations && params.organizationLocations.length > 0) {
    params.organizationLocations.forEach(location => {
      searchUrl += `organization_locations[]=${encodeURIComponent(location)}&`;
    });
  }
  
  // Add email status if available
  if (params.emailStatus && params.emailStatus.length > 0) {
    params.emailStatus.forEach(status => {
      searchUrl += `contact_email_status[]=${encodeURIComponent(status)}&`;
    });
  }
  
  // Add seniorities if available
  if (params.seniorities && params.seniorities.length > 0) {
    params.seniorities.forEach(seniority => {
      searchUrl += `person_seniorities[]=${encodeURIComponent(seniority)}&`;
    });
  }
  
  // Add employee ranges if available
  if (params.employeeRanges && params.employeeRanges.length > 0) {
    params.employeeRanges.forEach(range => {
      searchUrl += `organization_num_employees_ranges[]=${encodeURIComponent(range)}&`;
    });
  }

  // Add keywords (using q_keywords for Apollo's API)
  if (params.keywords && params.keywords.length > 0) {
    const keywordsString = params.keywords.join(" ");
    searchUrl += `q_keywords=${encodeURIComponent(keywordsString)}&`;
  }
  
  // Add page and per_page parameters
  searchUrl += `page=1&per_page=${params.limit || 20}`;
  
  console.log("Apollo API search URL:", searchUrl);
  
  try {
    // Make the API call to Apollo
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Accept': 'application/json',
        'x-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apollo API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Apollo API search results:", data);
    
    // Return the contacts array from the Apollo response
    return data.contacts || [];
    
  } catch (error) {
    console.error("Error in searchWithApollo:", error);
    throw new Error(`Apollo search failed: ${error instanceof Error ? error.message : String(error)}`);
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
      // Return a default object with all optional fields
      return {
        profileResearchWebhook: undefined,
        contentWebhook: undefined,
        jobsWebhook: undefined,
        awardsWebhook: undefined,
        idealCustomerWebhook: undefined,
        outreachWebhook: undefined
      };
    }
    
    if (!data) {
      console.log("No app settings found, returning default empty object");
      // Return a default object with all optional fields
      return {
        profileResearchWebhook: undefined,
        contentWebhook: undefined,
        jobsWebhook: undefined,
        awardsWebhook: undefined,
        idealCustomerWebhook: undefined,
        outreachWebhook: undefined
      };
    }
    
    // Convert snake_case to camelCase for consistency
    const settings: AppSettings = {
      apifyApolloApiKey: data.apifyapolloapikey,
      apolloApiKey: data.apolloapikey,
      leadProvider: data.leadprovider,
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
    // Return a default object with all optional fields
    return {
      profileResearchWebhook: undefined,
      contentWebhook: undefined,
      jobsWebhook: undefined,
      awardsWebhook: undefined,
      idealCustomerWebhook: undefined,
      outreachWebhook: undefined
    };
  }
};

// Function to transform Apollo API results into a consistent format
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

// Keep existing export interfaces but ensure they are compatible with our SearchResult type
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
}

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
}

export type SearchResult = PeopleSearchResult | CompanySearchResult;

// Function to transform a person result from Apollo.io API format
const transformPersonResult = (result: any): PeopleSearchResult => {
  try {
    // Log the structure of the incoming result to understand its format
    console.log("Raw person result structure:", JSON.stringify(result).substring(0, 300));
    
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
    
    // Return both the extracted data and the full result to ensure no information is lost
    return {
      contact: person,
      company: company,
      ...result  // Keep all original fields
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

// Helper function to transform a company result
const transformCompanyResult = (result: any): CompanySearchResult => {
  try {
    // Extract company data
    const organization = result.organization || {};
    
    // Create company object
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
      company
    };
  } catch (error) {
    console.error("Error transforming company result:", error);
    return {};
  }
};
