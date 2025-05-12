
import { supabase } from "@/integrations/supabase/client";
import { 
  searchForLeads, 
  transformApifyResults,
  SearchType,
  getAppSettings,
  PeopleSearchResult,
  CompanySearchResult
} from "@/services/apifyService";

// Result types
export interface SearchResult {
  id: string;
  type: 'person' | 'company';
  name: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: string;
  website?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
  description?: string;
  selected: boolean;
  archived: boolean;
  // Additional data for detailed view
  raw_data: any;
}

export interface SearchParams {
  keywords: string[];
  location: string;
  emailStatus: string[];
  departments: string[];
  seniorities: string[];
  employeeRanges: string[];
  resultCount: number;
  organizationLocations: string[];
  keywordFields: string[];
  personTitles: string[];
}

// Interface for company data
interface CompanyData {
  name?: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  linkedin_url?: string;
  size?: string;
}

// Interface for contact data
interface ContactData {
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
}

export const handleSearch = async (searchParams: SearchParams, user: any, toast: any) => {
  // Get settings from Supabase
  const settings = await getAppSettings();
  console.log("Search page retrieved settings:", settings);
  
  // Check for Apollo API key
  const apiKey = settings.apolloApiKey || null;
  console.log(`Using Apollo API key:`, apiKey ? `[Present, length: ${apiKey.length}]` : "Missing");
  
  if (!apiKey) {
    toast({
      title: "API Key Not Configured",
      description: `Please set up your Apollo API key in API Settings`,
      variant: "destructive",
    });
    return [];
  }
  
  // Build search parameters for the API
  const apiParams = {
    searchType: SearchType.PEOPLE,
    keywords: searchParams.keywords,
    location: searchParams.location,
    departments: searchParams.departments,
    seniorities: searchParams.seniorities,
    emailStatus: searchParams.emailStatus,
    employeeRanges: searchParams.employeeRanges,
    limit: searchParams.resultCount,
    personTitles: searchParams.personTitles,
    organizationLocations: searchParams.organizationLocations,
    keywordFields: searchParams.keywordFields || ['tags', 'name'] // Default keyword fields
  };
  
  console.log("Final API search parameters:", apiParams);
  
  // Save search history to Supabase if user is authenticated
  let searchHistoryId = null;
  if (user) {
    try {
      const { data: searchHistory, error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          search_type: 'people',
          search_params: apiParams as any,
          person_titles: searchParams.personTitles || [],
          result_count: 0 // Will be updated after results are received
        })
        .select('id')
        .single();

      if (error) {
        console.error("Error saving search history:", error);
      } else if (searchHistory) {
        searchHistoryId = searchHistory.id;
        console.log("Search history saved with ID:", searchHistoryId);
      }
    } catch (err) {
      console.error("Error in search history save:", err);
    }
  }
  
  // Call the search service with the parameters
  const results = await searchForLeads(apiParams);
  
  console.log("Raw search results:", results);
  console.log("Results type:", Array.isArray(results) ? `Array with ${results.length} items` : typeof results);
  
  if (results && Array.isArray(results) && results.length > 0) {
    console.log("First result sample:", JSON.stringify(results[0]).substring(0, 200));
  }
  
  // Transform results
  const transformedLeads = transformApifyResults(results, 'people');
  
  console.log("Transformed leads:", transformedLeads);
  
  if (!transformedLeads || transformedLeads.length === 0) {
    return [];
  }
  
  // Update search history with result count
  if (user && searchHistoryId) {
    try {
      await supabase
        .from('search_history')
        .update({ result_count: transformedLeads.length })
        .eq('id', searchHistoryId);
    } catch (err) {
      console.error("Error updating search history:", err);
    }
    
    // Save results to archive
    if (transformedLeads.length > 0) {
      saveSearchResults(transformedLeads, searchHistoryId);
    }
  }
  
  // Map transformed leads to search results format
  return mapLeadsToSearchResults(transformedLeads);
};

// Save search results to archive
const saveSearchResults = async (transformedLeads: any[], searchHistoryId: string) => {
  try {
    const archiveData = transformedLeads.map(lead => {
      // Create a unique identifier to prevent duplicates
      let uniqueId = "unknown-" + Date.now() + "-" + Math.random();
      
      // Type guard to check if this is a people search result
      const peopleResult = lead as PeopleSearchResult;
      
      // If it has contact and company properties, it's a PeopleSearchResult
      if (peopleResult && peopleResult.contact && peopleResult.company) {
        uniqueId = `${peopleResult.company.name || ''}-${peopleResult.contact.firstName || ''}-${peopleResult.contact.lastName || ''}-${peopleResult.contact.title || ''}`;
      }
      
      return {
        search_id: searchHistoryId,
        result_data: lead as any, // Cast to any for JSON compatibility
        unique_identifier: uniqueId
      };
    });
    
    // Use upsert with onConflict to handle duplicates
    if (archiveData.length > 0) {
      const { error } = await supabase
        .from('search_results_archive')
        .upsert(archiveData, {
          onConflict: 'unique_identifier',
          ignoreDuplicates: true
        });
        
      if (error) {
        console.error("Error saving search results:", error);
      }
    }
  } catch (err) {
    console.error("Error in search results archive:", err);
  }
};

// Map leads to search results format
const mapLeadsToSearchResults = (transformedLeads: any[]): SearchResult[] => {
  try {
    return transformedLeads.map((item, index) => {
      console.log(`Mapping result ${index} to SearchResult format`);
      
      try {
        // Check if this is a people search result by checking if it has a contact property
        const peopleResult = item as PeopleSearchResult;
        const isPeopleResult = peopleResult && peopleResult.contact !== undefined;
        
        if (isPeopleResult) {
          // This is a people search result
          const contact = (peopleResult.contact || {}) as ContactData;
          const company = (peopleResult.company || {}) as CompanyData;
          
          const firstName = contact.firstName || "";
          const lastName = contact.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim() || "Unknown";
          
          console.log(`Creating SearchResult for person: ${fullName}, company: ${company?.name || "Unknown"}`);
          
          return {
            id: `result-${Date.now()}-${index}`,
            type: 'person' as const,
            name: fullName,
            title: contact.title || "N/A",
            company: company?.name || "Unknown",
            industry: company?.industry || "N/A",
            location: company?.location || "N/A",
            website: company?.website || "",
            linkedin_url: contact.linkedin_url || "",
            email: contact.email || "",
            phone: contact.phone || "",
            description: company?.description || "",
            selected: false,
            archived: false,
            raw_data: item
          };
        } else {
          // This is a company search result - should not occur now but keeping for backwards compatibility
          const companyItem = item as CompanySearchResult;
          const company = (companyItem.company || {}) as CompanyData;
          
          console.log(`Creating SearchResult for company: ${company?.name || "Unknown"}`);
          
          return {
            id: `result-${Date.now()}-${index}`,
            type: 'company' as const,
            name: company?.name || "Unknown",
            industry: company?.industry || "N/A",
            location: company?.location || "N/A",
            website: company?.website || "",
            linkedin_url: company?.linkedin_url || "",
            description: company?.description || "",
            selected: false,
            archived: false,
            raw_data: item
          };
        }
      } catch (error) {
        console.error(`Error mapping result ${index}:`, error);
        // Return a placeholder result on error
        return {
          id: `result-${Date.now()}-${index}`,
          type: 'person' as const,
          name: "Error Processing Result",
          industry: "N/A",
          location: "N/A",
          website: "",
          description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          selected: false,
          archived: false,
          raw_data: {}
        };
      }
    });
  } catch (error) {
    console.error("Error mapping search results:", error);
    return [];
  }
};
