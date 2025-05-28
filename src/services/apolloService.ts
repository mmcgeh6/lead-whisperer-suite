
import { supabase } from "@/integrations/supabase/client";

/**
 * Apollo.io API Service
 * Handles integration with the Apollo.io API via Supabase Edge Function
 */

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

// Function to make Apollo.io API requests via Supabase Edge Function
export const apolloApiRequest = async (params: any, apiKey: string): Promise<any> => {
  try {
    console.log("Making Apollo.io API request via Supabase Edge Function");
    console.log("Request params:", params);
    
    // Format search parameters
    const searchParams = formatApolloSearchParams(params);
    
    console.log("Formatted search params:", searchParams);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('apollo-search', {
      body: {
        searchParams,
        apiKey
      }
    });
    
    if (error) {
      console.error("Supabase Edge Function error:", error);
      throw new Error(`Edge Function error: ${error.message}`);
    }
    
    if (data.error) {
      console.error("Apollo.io API error from Edge Function:", data.error);
      throw new Error(data.error);
    }
    
    console.log("Successfully received response from Apollo.io API via Edge Function");
    return data;
    
  } catch (error) {
    console.error("Apollo.io API request failed:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Edge Function error')) {
        throw new Error(`Apollo.io API error: ${error.message}`);
      } else if (error.message.includes('Invalid Apollo.io API key')) {
        throw new Error('Invalid Apollo.io API key. Please check your API key in settings.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('Apollo.io API rate limit exceeded. Please try again later.');
      } else if (error.message.includes('access forbidden')) {
        throw new Error('Access forbidden. Please check your Apollo.io API permissions.');
      } else {
        throw new Error(`Apollo.io API error: ${error.message}`);
      }
    } else {
      throw new Error('Apollo.io API error: Unknown error occurred');
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
    console.warn("No response from Apollo.io API");
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
  
  console.log(`Found ${people.length} people results from Apollo.io`);
  
  return {
    people: people,
    pagination: pagination
  };
};
