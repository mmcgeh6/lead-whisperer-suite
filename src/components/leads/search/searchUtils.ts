import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface SearchParams {
  searchType: SearchType;
  keywords: string[];
  location: string;
  industry?: string;
  personTitles?: string[];
  companyTypes?: string[];
  companySize?: string;
  companyRevenue?: string;
  technologies?: string[];
  fundingRounds?: string[];
  employeeCountRange?: string;
  yearFoundedRange?: string;
  limit: number;
}

export interface ApifyResult {
    [key: string]: any;
}

export interface SearchResult {
  id: string;
  type: 'person' | 'company';
  name: string;
  title?: string;
  company?: string;
  location?: string;
  website?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
  industry?: string;
  selected?: boolean;
  archived?: boolean;
  raw_data?: any;
  apolloContactId?: string; // Add this to store the Apollo contact ID
}

export enum SearchType {
  PEOPLE = 'people',
  COMPANIES = 'companies',
}

export type PeopleSearchResult = {
  type: 'person';
  name: string;
  title: string;
  company: string;
  location: string;
  linkedin_url: string;
  email: string;
  phone: string;
  industry: string;
  website: string;
  selected: boolean;
  archived: boolean;
  raw_data: any;
};

export type CompanySearchResult = {
  type: 'company';
  name: string;
  industry: string;
  location: string;
  website: string;
  linkedin_url: string;
  email: string;
  phone: string;
  selected: boolean;
  archived: boolean;
  raw_data: any;
};

export const transformApifyResults = (results: any[], searchType: 'people' | 'companies'): SearchResult[] => {
  if (!results || !Array.isArray(results)) {
    console.warn("Invalid results format:", results);
    return [];
  }

  const transformedResults: SearchResult[] = [];

  results.forEach((result, index) => {
    try {
      // Handle the response structure - look for contacts array
      let contactsArray = [];
      
      if (result.contacts && Array.isArray(result.contacts)) {
        contactsArray = result.contacts;
      } else if (Array.isArray(result)) {
        contactsArray = result;
      } else {
        contactsArray = [result];
      }

      contactsArray.forEach((contact, contactIndex) => {
        if (!contact) return;

        // Extract Apollo contact ID from the contact data
        const apolloContactId = contact.id || contact.person_id;
        
        const transformedResult: SearchResult = {
          id: `${index}-${contactIndex}-${Date.now()}`,
          type: searchType === 'people' ? 'person' : 'company',
          name: contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
          title: contact.title || contact.headline || '',
          company: contact.organization_name || contact.organization?.name || '',
          location: contact.present_raw_address || contact.city || contact.state || '',
          website: contact.organization?.website_url || contact.organization?.primary_domain || '',
          linkedin_url: contact.linkedin_url || '',
          email: contact.email || '',
          phone: contact.phone || contact.organization?.phone || '',
          industry: contact.organization?.industry || '',
          selected: false,
          archived: false,
          raw_data: contact,
          apolloContactId: apolloContactId // Store the Apollo contact ID
        };

        transformedResults.push(transformedResult);
      });
    } catch (error) {
      console.error(`Error transforming result ${index}:`, error);
    }
  });

  console.log(`Transformed ${transformedResults.length} results from ${searchType} search`);
  return transformedResults;
};

export const handleSearch = async (
  searchParams: SearchParams,
  user: any,
  toast: any
): Promise<SearchResult[]> => {
  try {
    // Dynamically import the search service based on the search type
    const { searchForLeads } = await import('@/services/apifyService');
    const { saveSearchHistory, updateSearchResultCount, archiveSearchResults } = await import('@/services/leadStorageService');
    
    // Save search history to Supabase if user is authenticated
    let searchHistoryId = null;
    if (user) {
      searchHistoryId = await saveSearchHistory(
        user.id,
        searchParams.searchType,
        searchParams,
        searchParams.personTitles
      );
      
      if (searchHistoryId) {
        console.log("Search history saved with ID:", searchHistoryId);
      }
    }
    
    // Perform the search
    const results = await searchForLeads(searchParams);
    
    console.log("Search results:", results);
    if (results && results.length > 0) {
      console.log("First result sample:", JSON.stringify(results[0]).substring(0, 300));
    }
    
    // Transform results
    const transformedLeads = transformApifyResults(results, searchParams.searchType);
    
    console.log("Transformed leads:", transformedLeads);
    if (transformedLeads && transformedLeads.length > 0) {
      console.log("First transformed lead:", JSON.stringify(transformedLeads[0]).substring(0, 300));
    }

    // Update search history with result count
    if (user && searchHistoryId) {
      await updateSearchResultCount(searchHistoryId, transformedLeads.length);
      
      // Save results to archive
      if (transformedLeads.length > 0) {
        await archiveSearchResults(searchHistoryId, transformedLeads);
      }
    }
    
    return transformedLeads;
  } catch (error) {
    console.error("Error in handleSearch:", error);
    toast({
      title: "Search Failed",
      description: error instanceof Error ? error.message : "Failed to search for leads. Please try again later.",
      variant: "destructive",
    });
    return [];
  }
};
