
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { searchForLeads, transformApifyResults, SearchType } from "@/services/apifyService";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeadSearchProps {
  onLeadsFound?: (leads: any[]) => void;
}

export const LeadSearch = ({ onLeadsFound }: LeadSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>("people");
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
      // Get the lead provider from localStorage
      const leadProvider = localStorage.getItem('leadProvider') || 'apify-apollo';
      
      // Check for appropriate API key based on the selected provider
      let apiKeyName: string;
      let apiKeyLabel: string;
      
      if (leadProvider === 'apollo') {
        apiKeyName = 'apollioApiKey';
        apiKeyLabel = 'Apollo.io';
      } else {
        apiKeyName = 'apifyApolloApiKey';
        apiKeyLabel = 'Apify';
      }
      
      const apiKey = localStorage.getItem(apiKeyName);
      
      if (!apiKey || apiKey.trim() === '') {
        toast({
          title: "API Key Not Configured",
          description: `Please set up your ${apiKeyLabel} API key in API Settings`,
          variant: "destructive",
        });
        setIsSearching(false);
        return;
      }
      
      // Use the search service
      const results = await searchForLeads({
        searchType,
        industry: searchQuery,
        limit: parseInt(resultCount, 10)
      });
      
      // Transform results
      const transformedLeads = transformApifyResults(results, searchType);
      
      toast({
        title: "Lead Search Complete",
        description: `Found ${transformedLeads.length} potential leads.`,
      });
      
      if (onLeadsFound && transformedLeads.length > 0) {
        onLeadsFound(transformedLeads);
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Find New Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
          <TabsList className="mb-4 w-full md:w-auto">
            <TabsTrigger value="people">People Search</TabsTrigger>
            <TabsTrigger value="companies">Company Search</TabsTrigger>
          </TabsList>
          
          <TabsContent value="people">
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
                  <Button 
                    type="submit" 
                    disabled={isSearching}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                  >
                    {isSearching ? "Searching..." : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Find People
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="companies">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for companies by industry, e.g. Software, Healthcare, Finance..."
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
                  <Button 
                    type="submit" 
                    disabled={isSearching}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                  >
                    {isSearching ? "Searching..." : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Find Companies
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
