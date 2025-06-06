
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdvancedSearch } from "@/components/leads/search/AdvancedSearch";
import { SearchResults } from "@/components/leads/search/SearchResults";
import { SavedSearches } from "@/components/leads/search/SavedSearches";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Company, Contact } from "@/types";
import { SearchResult, SearchParams as UtilsSearchParams, handleSearch, SearchType } from "@/components/leads/search/searchUtils";
import { saveSelectedLeads } from "@/components/leads/search/leadSaveUtils";

export const SearchContainer = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [lastSavedListId, setLastSavedListId] = useState<string | null>(null);
  const { toast } = useToast();
  const { addCompany, addContact } = useAppContext();

  // Create wrapper functions that return Promises to satisfy TypeScript
  const addCompanyAsync = async (company: Company): Promise<void> => {
    return Promise.resolve(addCompany(company));
  };

  const addContactAsync = async (contact: Contact): Promise<void> => {
    return Promise.resolve(addContact(contact));
  };

  const { user } = useAuth();

  const handleSearchSubmit = async (searchParams: any): Promise<void> => {
    if (!searchParams.keywords || searchParams.keywords.length === 0) {
      toast({
        title: "Search query required",
        description: "Please enter search keywords",
        variant: "destructive",
      });
      return;
    }
    
    // Convert the search params to include required fields
    const fullSearchParams: UtilsSearchParams = {
      ...searchParams,
      searchType: SearchType.PEOPLE, // Default to people search
      limit: searchParams.limit || 50 // Default limit
    };
    
    setIsSearching(true);
    console.log("Starting search with parameters:", fullSearchParams);
    
    try {
      const results = await handleSearch(fullSearchParams, user, toast);
      setSearchResults(results);
      
      if (results && results.length > 0) {
        toast({
          title: "Search Complete",
          description: `Found ${results.length} results.`
        });
      } else {
        toast({
          title: "No Results Found",
          description: "Your search did not return any results. Try different keywords or check the browser console for more information.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "There was an error performing your search.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultSelection = (id: string, selected: boolean) => {
    // Update selected state in results
    setSearchResults(prevResults => 
      prevResults.map(result => 
        result.id === id ? { ...result, selected } : result
      )
    );
    
    // Update selected IDs array
    setSelectedResults(prev => {
      if (selected) {
        return [...prev, id];
      } else {
        return prev.filter(resultId => resultId !== id);
      }
    });
  };

  const handleSaveSelectedLeads = async (listId: string) => {
    const selectedLeads = searchResults.filter(result => result.selected);
    
    if (selectedLeads.length === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select at least one lead to save.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const saveSuccessful = await saveSelectedLeads(
        selectedLeads, 
        user, 
        addCompanyAsync, 
        addContactAsync, 
        toast, 
        listId
      );
      
      if (saveSuccessful) {
        // Store the list ID for reference
        setLastSavedListId(listId);
        
        // Archive selected results and clear selection
        setSearchResults(prevResults => 
          prevResults.map(result => ({
            ...result,
            archived: result.selected ? true : result.archived,
            selected: false
          }))
        );
        
        // Clear selection
        setSelectedResults([]);
      }
    } catch (error) {
      console.error("Error saving leads:", error);
      toast({
        title: "Error Saving Leads",
        description: "There was an error saving your leads.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left sidebar with saved searches */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Saved Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <SavedSearches />
          </CardContent>
        </Card>
      </div>
      
      {/* Main content */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Search People</CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedSearch 
              onSearch={handleSearchSubmit}
              isSearching={isSearching}
            />
          </CardContent>
        </Card>
        
        {searchResults.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchResults 
                results={searchResults.filter(r => !r.archived)}
                onResultSelection={handleResultSelection}
                onSaveToList={handleSaveSelectedLeads}
                selectedCount={selectedResults.length}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
