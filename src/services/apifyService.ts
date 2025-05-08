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
    
    // Use the new Supremecoder actor instead of Codecrafter
    return await searchWithSupremecoder(params);
  } catch (error) {
    console.error("Error in searchForLeads:", error);
    throw new Error(`Failed to search for leads: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to search using Apollo API directly - COMMENTED OUT FOR NOW
/* 
const searchWithApollo = async (params: SearchParams) => {
  console.log("Using Apollo API for search");
  
  // Get the API key from settings
  const settings = await getAppSettings();
  const apiKey = settings.apolloApiKey;
  
  if (!apiKey) {
    throw new Error("Apollo API key not configured");
  }
  
  // Implement Apollo API search here
  throw new Error("Apollo API search not yet implemented");
};
*/

// Keep the old Codecrafter actor function, but commented out for potential future use
/* 
const searchWithApify = async (params: SearchParams) => {
  console.log("Using Apify Codecrafter for search");
  
  // Get the API key from settings
  const settings = await getAppSettings();
  const apiKey = settings.apifyApolloApiKey;
  
  if (!apiKey) {
    throw new Error("Apify API key not configured");
  }
  
  // Use the correct actor name for Apollo.io scraper
  const actorName = 'jljBwyyQakqrL1wae';  // Codecrafter actor ID
  
  // Build proper Apollo.io search URL with parameters
  let apolloSearchUrl = "https://app.apollo.io/#/people?sortByField=%5Bnone%5D&sortAscending=false&page=1";
  
  // Add person titles if available
  if (params.personTitles && params.personTitles.length > 0) {
    params.personTitles.forEach(title => {
      apolloSearchUrl += `&personTitles[]=${encodeURIComponent(title)}`;
    });
  }
  
  // Add keywords as organization tags for better matching
  if (params.keywords && params.keywords.length > 0) {
    params.keywords.forEach(keyword => {
      apolloSearchUrl += `&qOrganizationKeywordTags[]=${encodeURIComponent(keyword)}`;
    });
  }
  
  // Add location if available
  if (params.location) {
    apolloSearchUrl += `&location=${encodeURIComponent(params.location)}`;
  }
  
  // Add keyword fields if available
  if (params.keywordFields && params.keywordFields.length > 0) {
    params.keywordFields.forEach(field => {
      apolloSearchUrl += `&includedOrganizationKeywordFields[]=${encodeURIComponent(field)}`;
    });
  } else {
    // Default keyword fields if none specified
    apolloSearchUrl += "&includedOrganizationKeywordFields[]=tags&includedOrganizationKeywordFields[]=name";
  }
  
  console.log("Apollo search URL constructed:", apolloSearchUrl);
  
  // Prepare the input for the Apify actor with required URL field
  const input: any = {
    url: apolloSearchUrl, // Using the constructed Apollo search URL
    queries: [],
    maxResults: params.limit || 20,
    saveHtml: false,
    includeWebData: true
  };
  
  // Handle people search
  if (params.searchType === SearchType.PEOPLE) {
    // Create a query for people search
    const query: any = {
      type: "people"
    };
    
    // Add optional parameters if they exist
    if (params.departments && params.departments.length > 0) {
      query.departments = params.departments;
    }
    
    if (params.seniorities && params.seniorities.length > 0) {
      query.seniorities = params.seniorities;
    }
    
    if (params.emailStatus && params.emailStatus.length > 0) {
      query.emailStatus = params.emailStatus;
    }
    
    if (params.employeeRanges && params.employeeRanges.length > 0) {
      query.employeeRanges = params.employeeRanges;
    }
    
    if (params.organizationLocations && params.organizationLocations.length > 0) {
      query.organizationLocations = params.organizationLocations;
    }
    
    input.queries.push(query);
  } 
  // Handle company search
  else if (params.searchType === SearchType.COMPANY) {
    // Create a query for company search
    const query: any = {
      type: "organizations"
    };
    
    // Add optional parameters if they exist
    if (params.industry) {
      query.industry = params.industry;
    }
    
    if (params.employeeRanges && params.employeeRanges.length > 0) {
      query.employeeRanges = params.employeeRanges;
    }
    
    input.queries.push(query);
  }
  
  console.log("Apify input:", JSON.stringify(input, null, 2));
  
  try {
    // Make the API call to Apify
    const response = await fetch(`https://api.apify.com/v2/acts/${actorName}/runs?token=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        "startUrls": [],
        ...input
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Apify run started:", data);
    
    // Wait for the run to finish
    const runId = data.data.id;
    const result = await waitForApifyRun(runId, apiKey);
    
    return result;
  } catch (error) {
    console.error("Error in searchWithApify:", error);
    throw new Error(`Apify search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
*/

// New function to search using the Supremecoder Apify actor
const searchWithSupremecoder = async (params: SearchParams) => {
  console.log("Using Apify Supremecoder for search");
  
  // Get the API key from settings
  const settings = await getAppSettings();
  const apiKey = settings.apifyApolloApiKey;
  
  if (!apiKey) {
    throw new Error("Apify API key not configured");
  }
  
  // Use the correct actor ID for Supremecoder's Apollo.io scraper
  const actorId = "dx0856bVYoGUkmXAo"; // Supremecoder actor ID
  
  // Build proper Apollo.io search URL with parameters
  let apolloSearchUrl = "https://app.apollo.io/#/people?sortByField=%5Bnone%5D&sortAscending=false&page=1";
  
  // Add person titles if available
  if (params.personTitles && params.personTitles.length > 0) {
    params.personTitles.forEach(title => {
      apolloSearchUrl += `&personTitles[]=${encodeURIComponent(title)}`;
    });
  }
  
  // Add keywords as organization tags for better matching
  if (params.keywords && params.keywords.length > 0) {
    params.keywords.forEach(keyword => {
      apolloSearchUrl += `&qOrganizationKeywordTags[]=${encodeURIComponent(keyword)}`;
    });
  }
  
  // Add location if available - FIXED to use personLocations[] as requested
  if (params.location) {
    apolloSearchUrl += `&personLocations[]=${encodeURIComponent(params.location)}`;
  }
  
  // Add keyword fields if available
  if (params.keywordFields && params.keywordFields.length > 0) {
    params.keywordFields.forEach(field => {
      apolloSearchUrl += `&includedOrganizationKeywordFields[]=${encodeURIComponent(field)}`;
    });
  } else {
    // Default keyword fields if none specified
    apolloSearchUrl += "&includedOrganizationKeywordFields[]=tags&includedOrganizationKeywordFields[]=name";
  }
  
  console.log("Apollo search URL constructed:", apolloSearchUrl);
  
  // Prepare the input for the Supremecoder Apify actor based on Python example
  const input = {
    "searchUrl": apolloSearchUrl,
    "startPage": 1,
    "getEmails": true,
    "excludeGuessedEmails": false,
    "excludeNoEmails": false,
    "count": params.limit || 20,
  };
  
  console.log("Apify Supremecoder input:", JSON.stringify(input, null, 2));
  
  try {
    // Make the API call to Apify
    const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Apify run started:", data);
    
    // Wait for the run to finish
    const runId = data.data.id;
    const result = await waitForApifyRun(runId, apiKey);
    
    return result;
  } catch (error) {
    console.error("Error in searchWithSupremecoder:", error);
    throw new Error(`Apify search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to wait for an Apify run to finish and get the results
const waitForApifyRun = async (runId: string, apiKey: string) => {
  console.log(`Waiting for Apify run ${runId} to finish...`);
  
  // Poll the run status every few seconds
  let isFinished = false;
  let retries = 0;
  const maxRetries = 30; // Maximum number of retries (5 minutes with 10-second intervals)
  
  while (!isFinished && retries < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
    
    try {
      // Check the run status
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`);
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        throw new Error(`Apify API error (${statusResponse.status}): ${errorText}`);
      }
      
      const statusData = await statusResponse.json();
      console.log(`Run status: ${statusData.data.status}`);
      
      if (statusData.data.status === 'SUCCEEDED') {
        isFinished = true;
        
        // Get the dataset items
        const datasetId = statusData.data.defaultDatasetId;
        const itemsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`);
        
        if (!itemsResponse.ok) {
          const errorText = await itemsResponse.text();
          throw new Error(`Apify API error (${itemsResponse.status}): ${errorText}`);
        }
        
        const items = await itemsResponse.json();
        console.log(`Retrieved ${items.length} items from dataset`);
        
        return items;
      } else if (statusData.data.status === 'FAILED' || statusData.data.status === 'ABORTED' || statusData.data.status === 'TIMED-OUT') {
        throw new Error(`Apify run failed with status: ${statusData.data.status}`);
      }
    } catch (error) {
      console.error("Error checking Apify run status:", error);
    }
    
    retries++;
  }
  
  if (retries >= maxRetries) {
    throw new Error("Timed out waiting for Apify run to finish");
  }
  
  return [];
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
    return {};
  }
};

// Function to transform Apify results into a consistent format
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

// Helper function to transform a person result
const transformPersonResult = (result: any): PeopleSearchResult => {
  try {
    // Log the structure of the incoming result to understand its format
    console.log("Raw person result structure:", JSON.stringify(result).substring(0, 300));
    
    // Extract data based on the Supremecoder actor format
    // Adjust these fields based on the actual structure returned by the actor
    const person = {
      firstName: result.firstName || result.first_name || "",
      lastName: result.lastName || result.last_name || "",
      title: result.title || result.jobTitle || result.headline || "",
      email: result.emailAddress || result.email || "",
      phone: result.phone || "",
      linkedin_url: result.linkedInProfileUrl || result.linkedinUrl || result.url || ""
    };
    
    // Extract company information
    const organization = result.organization || {};
    const company = {
      name: result.companyName || organization.name || "",
      industry: result.industry || organization.industry || "",
      location: result.location || organization.location || "",
      website: result.website || organization.website || "",
      description: result.description || organization.description || "",
      linkedin_url: result.companyLinkedInUrl || organization.linkedInUrl || organization.linkedin_url || "",
      size: result.companySize || organization.size || ""
    };
    
    return {
      contact: person,
      company: company
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
      linkedin_url: organization.linkedInUrl || "",
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
