
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { searchForLeads, transformApifyResults, SearchType } from "@/services/apifyService";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface LeadSearchProps {
  onLeadsFound?: (leads: any[]) => void;
}

export const LeadSearch = ({ onLeadsFound }: LeadSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>("people");
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
      // First check if we should use the Apify API or fallback to n8n webhook
      const leadProvider = localStorage.getItem('leadProvider') || 'apollo';
      
      if (leadProvider === 'apify-apollo') {
        // Check for API key
        const apiKey = localStorage.getItem('apifyApolloApiKey');
        if (!apiKey) {
          toast({
            title: "API Key Not Configured",
            description: "Please set up your Apify API key in API Settings",
            variant: "destructive",
          });
          setIsSearching(false);
          return;
        }
        
        // Use the Apify service
        const results = await searchForLeads({
          searchType,
          industry: searchQuery,
          limit: 20
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
      } else {
        // Fallback to using n8n webhook
        const webhookUrl = import.meta.env.VITE_N8N_LEAD_SEARCH_WEBHOOK || "";
        
        if (!webhookUrl) {
          throw new Error("N8N webhook URL not configured");
        }

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            industry: searchQuery,
            action: "findLeads",
            searchType
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch leads");
        }

        const data = await response.json();
        
        toast({
          title: "Lead Search Complete",
          description: `Found ${data.leads?.length || 0} potential leads.`,
        });
        
        if (onLeadsFound && data.leads) {
          onLeadsFound(data.leads);
        }
      }
    } catch (error) {
      console.error("Error searching for leads:", error);
      toast({
        title: "Search Failed",
        description: "Failed to search for leads. Please try again later.",
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
              <div className="flex gap-4">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for people by industry, e.g. Software, Healthcare, Finance..."
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={isSearching}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSearching ? "Searching..." : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Find People
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="companies">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for companies by industry, e.g. Software, Healthcare, Finance..."
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={isSearching}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSearching ? "Searching..." : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Find Companies
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
