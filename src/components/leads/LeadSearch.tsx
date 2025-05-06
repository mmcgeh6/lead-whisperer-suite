
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter } from "lucide-react";
import { searchForLeads, transformApifyResults, getAppSettings } from "@/services/apifyService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DebugConsole from "@/components/dev/DebugConsole";
import { Link } from "react-router-dom";

interface LeadSearchProps {
  onLeadsFound?: (leads: any[]) => void;
}

export const LeadSearch = ({ onLeadsFound }: LeadSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("United States");
  const [isSearching, setIsSearching] = useState(false);
  const [resultCount, setResultCount] = useState<string>("20");
  const { toast } = useToast();

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
      const settings = await getAppSettings();
      console.log("Retrieved settings:", settings);
      
      // Get the lead provider from settings
      const leadProvider = settings.leadProvider || 'apify-apollo';
      
      // Check for appropriate API key based on the selected provider
      let apiKey: string | null;
      let apiKeyName: string;
      let apiKeyLabel: string;
      
      if (leadProvider === 'apollo') {
        apiKeyName = 'apolloApiKey';
        apiKeyLabel = 'Apollo.io';
        apiKey = settings.apolloApiKey || null;
      } else {
        apiKeyName = 'apifyApolloApiKey';
        apiKeyLabel = 'Apify';
        apiKey = settings.apifyApolloApiKey || null;
      }
      
      console.log(`Using ${apiKeyLabel} API key:`, apiKey ? `[Present, length: ${apiKey.length}]` : "Missing");
      
      if (!apiKey) {
        toast({
          title: "API Key Not Configured",
          description: `Please set up your ${apiKeyLabel} API key in API Settings`,
          variant: "destructive",
        });
        setIsSearching(false);
        return;
      }
      
      console.log(`Starting people search with ${leadProvider} for "${searchQuery}" with limit ${resultCount}`);
      
      // Convert the search query into an array of keywords
      const keywords = searchQuery.split(',').map(k => k.trim()).filter(k => k);
      
      // Use the search service with the new parameter structure
      const results = await searchForLeads({
        searchType: 'people',
        keywords: keywords,
        location: location, 
        limit: parseInt(resultCount, 10),
      });
      
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
        if (transformedLeads[0].company) {
          console.log("Company data extracted:", {
            name: transformedLeads[0].company.name,
            industry: transformedLeads[0].company.industry,
            location: transformedLeads[0].company.location,
            website: transformedLeads[0].company.website
          });
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
              <div className="md:col-span-3">
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location, e.g. United States, Tampa FL, etc."
                  className="w-full mb-4"
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
