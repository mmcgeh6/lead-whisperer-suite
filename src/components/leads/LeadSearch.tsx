
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface LeadSearchProps {
  onLeadsFound?: (leads: any[]) => void;
}

export const LeadSearch = ({ onLeadsFound }: LeadSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
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
      // Get the webhook URL from environment or config
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
          action: "findLeads"
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
                  Find Leads
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
