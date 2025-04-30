import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedSearch } from "@/components/leads/search/AdvancedSearch";
import { SearchResults } from "@/components/leads/search/SearchResults";
import { SavedSearches } from "@/components/leads/search/SavedSearches";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { LeadSearch } from "@/components/leads/LeadSearch";
import { Company, Contact } from "@/types";
import { SearchType } from "@/services/apifyService";

// Result types
export interface SearchResult {
  id: string;
  type: 'person' | 'company';
  name: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: string;
  website?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
  description?: string;
  selected: boolean;
  archived: boolean;
  // Additional data for detailed view
  raw_data: any;
}

const LeadSearchPage = () => {
  const [activeTab, setActiveTab] = useState<SearchType>('people');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const { toast } = useToast();
  const { addCompany, addContact } = useAppContext();
  
  // Handler for when LeadSearch component finds leads
  const handleLeadsFound = (leads: any[]) => {
    if (!Array.isArray(leads) || leads.length === 0) {
      return;
    }
    
    // If leads have company and contact structure from Apify transformation
    if (leads[0]?.company) {
      const transformedResults: SearchResult[] = leads.map((item, index) => {
        const isPersonSearch = !!item.contact;
        
        return {
          id: `result-${Date.now()}-${index}`,
          type: isPersonSearch ? 'person' : 'company',
          name: isPersonSearch 
            ? `${item.contact.firstName || ""} ${item.contact.lastName || ""}`.trim() || "Unknown"
            : item.company.name || "Unknown",
          title: isPersonSearch ? item.contact.title || "N/A" : undefined,
          company: isPersonSearch ? item.company.name : undefined,
          industry: item.company.industry || "N/A",
          location: item.company.location || "N/A",
          website: item.company.website || "",
          linkedin_url: isPersonSearch ? item.contact.linkedin_url || "" : item.company.linkedin_url || "",
          email: isPersonSearch ? item.contact.email || "" : undefined,
          phone: isPersonSearch ? item.contact.phone || "" : undefined,
          description: item.company.description || "",
          selected: false,
          archived: false,
          raw_data: item
        };
      });
      
      setSearchResults(transformedResults);
      return;
    }
    
    // Legacy format - convert to SearchResult type
    const convertedResults: SearchResult[] = leads.map((lead, index) => ({
      id: `result-${Date.now()}-${index}`,
      type: lead.type || 'person',
      name: lead.name || "Unknown",
      title: lead.title || "N/A",
      company: lead.company || "N/A",
      industry: lead.industry || "N/A",
      location: lead.location || "N/A",
      website: lead.website || "",
      linkedin_url: lead.linkedin_url || "",
      email: lead.email || "",
      phone: lead.phone || "",
      description: lead.description || "",
      selected: false,
      archived: false,
      raw_data: lead
    }));
    
    setSearchResults(convertedResults);
  };

  const handleSearch = async (searchParams: any) => {
    setIsSearching(true);
    
    try {
      // Determine which endpoint to use based on active tab
      const endpoint = activeTab === 'people' ? 
        '/api/search/people' : 
        '/api/search/companies';
      
      // In a production app, this would call your API endpoint
      // For now, simulate a search with setTimeout
      setTimeout(() => {
        // Mock data for testing
        const mockResults: SearchResult[] = Array(10).fill(null).map((_, i) => ({
          id: `result-${Date.now()}-${i}`,
          type: activeTab as 'person' | 'company',
          name: activeTab === 'people' ? `Person ${i+1}` : `Company ${i+1}`,
          title: activeTab === 'people' ? `Job Title ${i+1}` : undefined,
          company: activeTab === 'people' ? `Company ${i+1}` : undefined,
          industry: `Industry ${i % 5}`,
          location: `Location ${i % 3}`,
          website: `https://example${i}.com`,
          linkedin_url: `https://linkedin.com/in/profile-${i}`,
          email: activeTab === 'people' ? `person${i}@example.com` : undefined,
          selected: false,
          archived: false,
          raw_data: { /* Full response data would go here */ }
        }));
        
        setSearchResults(mockResults);
        setIsSearching(false);
        
        toast({
          title: "Search Complete",
          description: `Found ${mockResults.length} results.`
        });
      }, 1500);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "There was an error performing your search.",
        variant: "destructive"
      });
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

  const saveSelectedLeads = async () => {
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
      // Process each selected lead
      for (const lead of selectedLeads) {
        if (lead.raw_data?.company) {
          // Process Apify format
          const companyData: Company = {
            ...lead.raw_data.company,
            // Ensure all required fields are present
            size: lead.raw_data.company.size || "Unknown",
          };
          
          // Add company
          addCompany(companyData);
          
          // Add contact if this is a person search result
          if (lead.raw_data.contact) {
            addContact({
              ...lead.raw_data.contact,
              companyId: companyData.id
            });
          }
        } else {
          // Process legacy format
          // Create a company first
          const companyId = `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const companyData: Company = {
            id: companyId,
            name: lead.company || lead.name || "Unknown Company",
            website: lead.website || "",
            industry: lead.industry || "",
            size: "Unknown", // Default size value for legacy format
            location: lead.location || "",
            description: lead.description || "",
            linkedin_url: lead.linkedin_url?.includes("company") ? lead.linkedin_url : "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          // Add company
          addCompany(companyData);
          
          // Only create contact for person type
          if (lead.type === 'person') {
            const nameParts = lead.name.split(' ');
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(' ') || "";
            
            // Add contact
            addContact({
              firstName,
              lastName,
              title: lead.title || "",
              email: lead.email || "",
              phone: lead.phone || "",
              linkedin_url: lead.linkedin_url || "",
              companyId,
              notes: `Imported from lead search on ${new Date().toLocaleDateString()}`,
            });
          }
        }
      }
      
      toast({
        title: "Leads Saved",
        description: `${selectedLeads.length} leads have been saved to your database.`
      });
      
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
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lead Search</h1>
            <p className="text-gray-500 mt-2">
              Search for potential leads based on your criteria
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/leads">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Link>
          </Button>
        </div>
        
        {/* Basic Lead Search */}
        <LeadSearch onLeadsFound={handleLeadsFound} />
        
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
                <CardTitle>Advanced Search</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs 
                  value={activeTab} 
                  onValueChange={(value) => setActiveTab(value as SearchType)}
                >
                  <TabsList className="mb-6">
                    <TabsTrigger value="people">People Search</TabsTrigger>
                    <TabsTrigger value="companies">Company Search</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="people">
                    <AdvancedSearch 
                      type="people"
                      onSearch={handleSearch}
                      isSearching={isSearching}
                    />
                  </TabsContent>
                  
                  <TabsContent value="companies">
                    <AdvancedSearch 
                      type="companies"
                      onSearch={handleSearch}
                      isSearching={isSearching}
                    />
                  </TabsContent>
                </Tabs>
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
                    onSaveToList={saveSelectedLeads}
                    selectedCount={selectedResults.length}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeadSearchPage;
