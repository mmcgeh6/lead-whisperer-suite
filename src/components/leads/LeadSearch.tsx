
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface LeadSearchProps {
  onLeadsFound?: (leads: any[]) => void;
}

export const LeadSearch = ({ onLeadsFound }: LeadSearchProps) => {
  const [businessType, setBusinessType] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessType && !industry && !location) {
      toast({
        title: "Search criteria required",
        description: "Please enter at least one search criterion",
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
          businessType,
          industry,
          location,
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-type">Business Type/Vertical</Label>
              <Input
                id="business-type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g. Software, Healthcare"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Technology, Healthcare, Finance"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, Remote"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSearching} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSearching ? "Searching..." : "Find Leads"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
