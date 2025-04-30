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
import { Company, Contact } from "@/types";
import { 
  SearchType, 
  searchForLeads, 
  transformApifyResults, 
  PeopleSearchResult, 
  CompanySearchResult 
} from "@/services/apifyService";

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
  
  const handleSearch = async (searchParams: any) => {
    if (!searchParams.keywords || searchParams.keywords.length === 0) {
      toast({
        title: "Search query required",
        description: "Please enter search keywords",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
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
        searchType: activeTab,
        industry: searchParams.keywords.join(','),
        location: searchParams.location,
        limit: 20
      });
      
      // Transform results
      const transformedLeads = transformApifyResults(results, activeTab);
      
      if (!transformedLeads || transformedLeads.length === 0) {
        toast({
          title: "No Results Found",
          description: "Your search did not return any results. Try different keywords.",
          variant: "default",
        });
        setIsSearching(false);
        return;
      }
      
      setSearchResults(transformedLeads.map((item, index) => {
        const isPersonSearch = activeTab === 'people' && 'contact' in item;
        const peopleItem = isPersonSearch ? item as PeopleSearchResult : null;
        const companyItem = item as CompanySearchResult;
        
        return {
          id: `result-${Date.now()}-${index}`,
          type: isPersonSearch ? 'person' : 'company',
          name: isPersonSearch && peopleItem?.contact
            ? `${peopleItem.contact.firstName || ""} ${peopleItem.contact.lastName || ""}`.trim() || "Unknown"
            : companyItem.company.name || "Unknown",
          title: isPersonSearch && peopleItem?.contact ? peopleItem.contact.title || "N/A" : undefined,
          company: isPersonSearch ? companyItem.company.name : undefined,
          industry: companyItem.company.industry || "N/A",
          location: companyItem.company.location || "N/A",
          website: companyItem.company.website || "",
          linkedin_url: isPersonSearch && peopleItem?.contact 
            ? peopleItem.contact.linkedin_url || "" 
            : companyItem.company.linkedin_url || "",
          email: isPersonSearch && peopleItem?.contact ? peopleItem.contact.email || "" : undefined,
          phone: isPersonSearch && peopleItem?.contact ? peopleItem.contact.phone || "" : undefined,
          description: companyItem.company.description || "",
          selected: false,
          archived: false,
          raw_data: item
        };
      }));
      
      toast({
        title: "Search Complete",
        description: `Found ${transformedLeads.length} results.`
      });
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
                <CardTitle>Search Leads</CardTitle>
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
