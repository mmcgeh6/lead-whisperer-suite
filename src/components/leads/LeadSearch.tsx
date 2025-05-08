import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter } from "lucide-react";
import { 
  searchForLeads, 
  transformApifyResults, 
  getAppSettings, 
  SearchType, 
  AppSettings, 
  PeopleSearchResult 
} from "@/services/apifyService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DebugConsole from "@/components/dev/DebugConsole";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface LeadSearchProps {
  onLeadsFound?: (leads: any[]) => void;
}

export const LeadSearch = ({ onLeadsFound }: LeadSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("United States");
  const [personTitle, setPersonTitle] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [resultCount, setResultCount] = useState<string>("20");
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      // Get settings from Supabase
      const settings: AppSettings = await getAppSettings();
      console.log("Retrieved settings:", settings);
      
      // Check for Apify API key
      const apiKey = settings.apifyApolloApiKey || null;
      console.log(`Using Apify API key:`, apiKey ? `[Present, length: ${apiKey.length}]` : "Missing");
      
      if (!apiKey) {
        toast({
          title: "API Key Not Configured",
          description: `Please set up your Apify API key in API Settings`,
          variant: "destructive",
        });
        setIsSearching(false);
        return;
      }
      
      console.log(`Starting people search for "${searchQuery}" with limit ${resultCount}`);
      
      // Convert the search query into an array of keywords
      const keywords = searchQuery.split(',').map(k => k.trim()).filter(k => k);

      // Process person title if provided
      const personTitles = personTitle.trim() ? [personTitle.trim()] : [];
      
      // Use the search service with the new parameter structure
      const searchParams = {
        searchType: SearchType.PEOPLE,
        keywords: keywords,
        location: location, 
        limit: parseInt(resultCount, 10),
        personTitles: personTitles
      };

      // Save search history to Supabase if user is authenticated
      let searchHistoryId = null;
      if (user) {
        try {
          const { data: searchHistory, error } = await supabase
            .from('search_history')
            .insert({
              user_id: user.id,
              search_type: 'people',
              search_params: searchParams as any,
              person_titles: personTitles,
              result_count: 0 // Will be updated after results are received
            })
            .select('id');

          if (error) {
            console.error("Error saving search history:", error);
          } else if (searchHistory && searchHistory.length > 0) {
            searchHistoryId = searchHistory[0].id;
            console.log("Search history saved with ID:", searchHistoryId);
          }
        } catch (err) {
          console.error("Error in search history save:", err);
        }
      }
      
      const results = await searchForLeads(searchParams);
      
      console.log("Search results:", results);
      if (results && results.length > 0) {
        console.log("First result sample:", JSON.stringify(results[0]));
      }
      
      // Transform results
      const transformedLeads = transformApifyResults(results, 'people');
      
      console.log("Transformed leads:", transformedLeads);
      if (transformedLeads && transformedLeads.length > 0) {
        console.log("First transformed lead:", JSON.stringify(transformedLeads[0]));
        
        // Log detailed information about the first company
        const firstLead = transformedLeads[0] as PeopleSearchResult;
        if (firstLead && firstLead.company) {
          console.log("Company data extracted:", {
            name: firstLead.company.name,
            industry: firstLead.company.industry,
            location: firstLead.company.location,
            website: firstLead.company.website
          });
        }
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
          try {
            const archiveData = transformedLeads.map(lead => {
              // Create a unique identifier to prevent duplicates
              let uniqueId = "unknown-" + Date.now() + "-" + Math.random();
              
              // Type guard to check if this is a people search result
              const peopleResult = lead as PeopleSearchResult;
              
              // If it's a people search result with contact and company
              if (peopleResult && peopleResult.contact && peopleResult.company) {
                uniqueId = `${peopleResult.company.name || ''}-${peopleResult.contact.firstName || ''}-${peopleResult.contact.lastName || ''}`;
              }
              
              return {
                search_id: searchHistoryId,
                result_data: lead as any, // Type casting to any to avoid JSON compatibility issues
                unique_identifier: uniqueId
              };
            });
            
            // Use upsert with onConflict to handle duplicates
            if (archiveData.length > 0) {
              const { error } = await supabase
                .from('search_results_archive')
                .upsert(archiveData as any, {
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
        }
      }
      
      toast({
        title: "Lead Search Complete",
        description: `Found ${transformedLeads.length} potential leads.`,
      });
      
      if (onLeadsFound && transformedLeads.length > 0) {
        console.log("Calling onLeadsFound with transformed leads:", transformedLeads.length);
        onLeadsFound(transformedLeads);
      } else if (transformedLeads.length === 0) {
        toast({
          title: "No Results Found",
          description: "The search did not return any results. Try different keywords or check the console for debugging information.",
        });
      }
    } catch (error) {
      console.error("Error searching for leads:", error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search for leads. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Find New Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for people by industry, e.g. Software, Healthcare, Finance..."
                  className="w-full"
                />
              </div>
              <div>
                <Select
                  value={resultCount}
                  onValueChange={setResultCount}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="# of Results" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                    <SelectItem value="100">100 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location, e.g. United States, Tampa FL, etc."
                  className="w-full"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  value={personTitle}
                  onChange={(e) => setPersonTitle(e.target.value)}
                  placeholder="Job Title, e.g. Marketing Director, CEO, etc."
                  className="w-full"
                />
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  type="submit" 
                  disabled={isSearching}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                >
                  {isSearching ? "Searching..." : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Quick Search
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  className="w-full" 
                  asChild
                >
                  <Link to="/leads/search">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Search
                  </Link>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <DebugConsole />
    </>
  );
};
