
/**
 * Lead Storage Service
 * Handles storing, retrieving, and archiving lead data in Supabase
 */

import { supabase } from "@/integrations/supabase/client";
import { PeopleSearchResult } from "./apifyService";

// Save search history to Supabase
export const saveSearchHistory = async (
  userId: string,
  searchType: string,
  searchParams: any,
  titles: string[] = []
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('search_history')
      .insert({
        user_id: userId,
        search_type: searchType,
        search_params: searchParams,
        person_titles: titles,
        result_count: 0 // Will be updated after results are received
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error saving search history:", error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error("Error in saveSearchHistory:", error);
    return null;
  }
};

// Update search history record with result count
export const updateSearchResultCount = async (
  searchId: string,
  resultCount: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('search_history')
      .update({ result_count: resultCount })
      .eq('id', searchId);
      
    if (error) {
      console.error("Error updating search history count:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateSearchResultCount:", error);
    return false;
  }
};

// Archive search results to prevent duplicate processing
export const archiveSearchResults = async (
  searchId: string,
  results: any[]
): Promise<boolean> => {
  if (!results || results.length === 0) {
    return false;
  }

  try {
    const archiveData = results.map(lead => {
      // Create a unique identifier to prevent duplicates
      let uniqueId = `unknown-${Date.now()}-${Math.random()}`;
      
      // Type guard for PeopleSearchResult
      const peopleResult = lead as PeopleSearchResult;
      
      // If it has contact and company properties
      if (peopleResult && peopleResult.contact && peopleResult.company) {
        uniqueId = `${peopleResult.company.name || ''}-${peopleResult.contact.firstName || ''}-${peopleResult.contact.lastName || ''}-${peopleResult.contact.title || ''}`;
      }
      
      return {
        search_id: searchId,
        result_data: lead,
        unique_identifier: uniqueId
      };
    });
    
    // Use upsert with onConflict to handle duplicates
    const { error } = await supabase
      .from('search_results_archive')
      .upsert(archiveData, {
        onConflict: 'unique_identifier',
        ignoreDuplicates: true
      });
      
    if (error) {
      console.error("Error archiving search results:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in archiveSearchResults:", error);
    return false;
  }
};
