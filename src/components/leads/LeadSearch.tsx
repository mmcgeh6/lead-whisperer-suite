
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
import { archiveSearchResults, saveSearchHistory, updateSearchResultCount } from "@/services/leadStorageService";
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
      
      // Check for Apollo API key
      const apiKey = settings.apolloApiKey || null;
      console.log(`Using Apollo API key:`, apiKey ? `[Present, length: ${apiKey.length}]` : "Missing");
      
      if (!apiKey) {
        toast({
          title: "API Key Not Configured",
          description: `Please set up your Apollo API key in API Settings`,
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
      
      // Use the search service with the parameter structure
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
        searchHistoryId = await saveSearchHistory(
          user.id,
          'people',
          searchParams,
          personTitles
        );
        
        if (searchHistoryId) {
          console.log("Search history saved with ID:", searchHistoryId);
        }
      }
      
      const results = await searchForLeads(searchParams);
      
      console.log("Search results:", results);
      if (results && results.length > 0) {
        console.log("First result sample:", JSON.stringify(results[0]).substring(0, 300));
      }
      
      // Transform results
      const transformedLeads = transformApifyResults(results, 'people');
      
      console.log("Transformed leads:", transformedLeads);
      if (transformedLeads && transformedLeads.length > 0) {
        console.log("First transformed lead:", JSON.stringify(transformedLeads[0]).substring(0, 300));
        
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
        await updateSearchResultCount(searchHistoryId, transformedLeads.length);
        
        // Save results to archive
        if (transformedLeads.length > 0) {
          await archiveSearchResults(searchHistoryId, transformedLeads);
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
