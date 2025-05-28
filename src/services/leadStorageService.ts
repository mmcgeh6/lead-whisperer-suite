
import { supabase } from "@/integrations/supabase/client";

// Save search history to Supabase
export const saveSearchHistory = async (
  userId: string,
  searchType: string,
  searchParams: any,
  personTitles?: string[]
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('search_history')
      .insert({
        user_id: userId,
        search_type: searchType,
        search_params: searchParams,
        person_titles: personTitles || [],
        result_count: 0 // Will be updated later
      })
      .select('id')
      .single();
      
    if (error) {
      console.error("Error saving search history:", error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error("Exception saving search history:", error);
    return null;
  }
};

// Update search result count
export const updateSearchResultCount = async (
  searchId: string,
  resultCount: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('search_history')
      .update({ result_count: resultCount })
      .eq('id', searchId);
      
    if (error) {
      console.error("Error updating search result count:", error);
    }
  } catch (error) {
    console.error("Exception updating search result count:", error);
  }
};

// Archive search results to Supabase
export const archiveSearchResults = async (
  searchId: string,
  results: any[]
): Promise<void> => {
  try {
    console.log(`Archiving ${results.length} search results for search ${searchId}`);
    
    // Prepare data for bulk insert
    const archiveData = results.map(result => ({
      search_id: searchId,
      result_data: result,
      unique_identifier: `${searchId}-${result.id || Math.random()}`,
      added_to_list: false
    }));
    
    console.log("Archive data prepared:", archiveData.length, "records");
    
    const { data, error } = await supabase
      .from('search_results_archive')
      .insert(archiveData)
      .select('id');
      
    if (error) {
      console.error("Error archiving search results:", error);
      throw error;
    }
    
    console.log(`Successfully archived ${data?.length || 0} search results`);
  } catch (error) {
    console.error("Exception archiving search results:", error);
    throw error;
  }
};

// Get archived search results
export const getArchivedSearchResults = async (
  searchId: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('search_results_archive')
      .select('*')
      .eq('search_id', searchId);
      
    if (error) {
      console.error("Error getting archived search results:", error);
      return [];
    }
    
    return data?.map(item => item.result_data) || [];
  } catch (error) {
    console.error("Exception getting archived search results:", error);
    return [];
  }
};
