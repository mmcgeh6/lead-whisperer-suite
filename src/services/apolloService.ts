import { supabase } from "@/integrations/supabase/client";

/**
 * Apollo.io API Service via n8n Webhook
 * Handles integration with Apollo.io API through n8n webhook to avoid CORS issues
 */

// Helper function to get the lead search webhook URL from settings
const getLeadSearchWebhookUrl = async (): Promise<string> => {
  try {
    // Try to get from Supabase first
    const { data, error } = await supabase
      .from('app_settings')
      .select('lead_search_webhook')
      .eq('id', 'default')
      .single();
    
    if (!error && data?.lead_search_webhook) {
      console.log("Using lead search webhook from database:", data.lead_search_webhook);
      return data.lead_search_webhook;
    }
    
    // Fallback to localStorage
    const localWebhook = localStorage.getItem('lead_search_webhook');
    if (localWebhook) {
      console.log("Using lead search webhook from localStorage:", localWebhook);
      return localWebhook;
    }
    
    // Final fallback to hardcoded URL
    const fallbackUrl = "https://n8n-service-el78.onrender.com/webhook-test/c12e03c0-2618-4506-ab7d-2ced298ad959";
    console.log("Using fallback lead search webhook URL:", fallbackUrl);
    return fallbackUrl;
    
  } catch (error) {
    console.error("Error getting lead search webhook URL:", error);
    
    // Fallback to localStorage
    const localWebhook = localStorage.getItem('lead_search_webhook');
    if (localWebhook) {
      console.log("Using lead search webhook from localStorage (after error):", localWebhook);
      return localWebhook;
    }
    
    // Final fallback
    const fallbackUrl = "https://n8n-service-el78.onrender.com/webhook-test/c12e03c0-2618-4506-ab7d-2ced298ad959";
    console.log("Using fallback lead search webhook URL (after error):", fallbackUrl);
    return fallbackUrl;
  }
};

// Helper function to format search parameters for Apollo.io API
export const formatApolloSearchParams = (params: {
  personTitles?: string[];
  location?: string;
  organizationLocations?: string[];
  seniorities?: string[];
  emailStatus?: string[];
  employeeRanges?: string[];
  keywords?: string[];
  limit?: number;
}) => {
  return {
    personTitles: params.personTitles || [],
    location: params.location || '',
    organizationLocations: params.organizationLocations || [],
    seniorities: params.seniorities || [],
    emailStatus: params.emailStatus || [],
    employeeRanges: params.employeeRanges || [],
    keywords: params.keywords || [],
    limit: params.limit || 20
  };
};

// Function to build Apollo.io API URL
const buildApolloUrl = (params: any): string => {
  const searchParams = formatApolloSearchParams(params);
  
  // Start with base URL
  let apolloUrl = 'https://api.apollo.io/api/v1/mixed_people/search?';
  const urlParams: string[] = [];
  
  // Add person_titles[] parameter (empty if no titles provided)
  if (searchParams.personTitles && searchParams.personTitles.length > 0) {
    searchParams.personTitles.forEach((title: string) => {
      urlParams.push(`person_titles[]=${encodeURIComponent(title)}`);
    });
  } else {
    urlParams.push('person_titles[]=');
  }
  
  // Add person_locations[] parameter (use location for person location)
  if (searchParams.location) {
    urlParams.push(`person_locations[]=${encodeURIComponent(searchParams.location)}`);
  }
  
  // Add person_seniorities[] parameter
  if (searchParams.seniorities && searchParams.seniorities.length > 0) {
    searchParams.seniorities.forEach((seniority: string) => {
      urlParams.push(`person_seniorities[]=${encodeURIComponent(seniority)}`);
    });
  }
  
  // Add contact_email_status[] parameter
  if (searchParams.emailStatus && searchParams.emailStatus.length > 0) {
    searchParams.emailStatus.forEach((status: string) => {
      urlParams.push(`contact_email_status[]=${encodeURIComponent(status)}`);
    });
  }
  
  // Add organization_num_employees_ranges[] parameter
  if (searchParams.employeeRanges && searchParams.employeeRanges.length > 0) {
    searchParams.employeeRanges.forEach((range: string) => {
      urlParams.push(`organization_num_employees_ranges[]=${encodeURIComponent(range)}`);
    });
  }

  // Add q_keywords parameter (combine keywords into single string)
  if (searchParams.keywords && searchParams.keywords.length > 0) {
    const keywordsString = searchParams.keywords.join(" ");
    urlParams.push(`q_keywords=${encodeURIComponent(keywordsString)}`);
  }
  
  // Add pagination parameters (default to page 1, max 100 per page)
  const limit = Math.min(searchParams.limit, 100);
  urlParams.push('page=1');
  urlParams.push(`per_page=${limit}`);

  // Join all parameters and return the final URL
  return apolloUrl + urlParams.join('&');
};

// Function to make Apollo.io API requests via n8n webhook
export const apolloApiRequest = async (params: any, apiKey: string): Promise<any> => {
  try {
    console.log("Making Apollo.io API request via n8n webhook");
    console.log("Request params:", params);
    
    // Get the webhook URL from settings
    const webhookUrl = await getLeadSearchWebhookUrl();
    console.log("Using webhook URL:", webhookUrl);
    
    // Build the Apollo.io API URL
    const apolloQuery = buildApolloUrl(params);
    console.log("Built Apollo query URL:", apolloQuery);
    
    // Prepare webhook payload
    const webhookPayload = [
      {
        "query": apolloQuery
      }
    ];
    
    console.log("Sending to n8n webhook:", webhookPayload);

    // Make the request to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`n8n webhook error: ${response.status} - ${errorText}`);
      throw new Error(`n8n webhook request failed: ${errorText}`);
    }

    const data = await response.json();
    console.log("n8n webhook response received successfully");
    console.log("Response data:", JSON.stringify(data).substring(0, 500));

    return data;
    
  } catch (error) {
    console.error("n8n webhook request failed:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to n8n webhook. Please check your internet connection and webhook settings.');
      } else {
        throw new Error(`n8n webhook error: ${error.message}`);
      }
    } else {
      throw new Error('n8n webhook error: Unknown error occurred');
    }
  }
};

// Interface for Apollo API response
export interface ApolloResponse {
  people: any[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

// Parse Apollo API response into a standardized format
export const parseApolloResponse = (response: any): ApolloResponse => {
  // Check if we have a valid response structure
  if (!response) {
    console.warn("No response from n8n webhook");
    return {
      people: [],
      pagination: { 
        page: 1,
        per_page: 0,
        total_entries: 0,
        total_pages: 1
      }
    };
  }
  
  // Apollo.io API returns data in this format directly
  const people = response.people || [];
  const pagination = response.pagination || {
    page: 1,
    per_page: people.length,
    total_entries: people.length,
    total_pages: 1
  };
  
  console.log(`Found ${people.length} people results from Apollo.io via n8n webhook`);
  
  return {
    people: people,
    pagination: pagination
  };
};
