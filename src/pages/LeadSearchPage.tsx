import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdvancedSearch } from "@/components/leads/search/AdvancedSearch";
import { SearchResults } from "@/components/leads/search/SearchResults";
import { SavedSearches } from "@/components/leads/search/SavedSearches";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Company, Contact } from "@/types";
import { 
  searchForLeads, 
  transformApifyResults,
  SearchType,
  getAppSettings,
  AppSettings,
  PeopleSearchResult,
  CompanySearchResult
} from "@/services/apifyService";
import DebugConsole from "@/components/dev/DebugConsole";

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

// Define interfaces for company and contact objects to fix type errors
interface CompanyData {
  name?: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  linkedin_url?: string;
  size?: string;
}

interface ContactData {
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
}

interface SearchParams {
  keywords: string[];
  location: string;
  emailStatus: string[];
  departments: string[];
  seniorities: string[];
  employeeRanges: string[];
  resultCount: number;
  organizationLocations: string[];
  keywordFields: string[];
  personTitles: string[];
}

const LeadSearchPage = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const { toast } = useToast();
  const { addCompany, addContact } = useAppContext();
  const { user } = useAuth();
  
  const handleSearch = async (searchParams: SearchParams) => {
    if (!searchParams.keywords || searchParams.keywords.length === 0) {
      toast({
        title: "Search query required",
        description: "Please enter search keywords",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    console.log("Starting search with parameters:", searchParams);
    
    try {
      // Get settings from Supabase
      const settings: AppSettings = await getAppSettings();
      console.log("Search page retrieved settings:", settings);
      
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
      
      // Build search parameters for the API
      const apiParams = {
        searchType: SearchType.PEOPLE,
        keywords: searchParams.keywords,
        location: searchParams.location,
        departments: searchParams.departments,
        seniorities: searchParams.seniorities,
        emailStatus: searchParams.emailStatus,
        employeeRanges: searchParams.employeeRanges,
        limit: searchParams.resultCount,
        personTitles: searchParams.personTitles,
        organizationLocations: searchParams.organizationLocations,
        keywordFields: searchParams.keywordFields || ['tags', 'name'] // Default keyword fields
      };
      
      console.log("Final API search parameters:", apiParams);
      
      // Save search history to Supabase if user is authenticated
      let searchHistoryId = null;
      if (user) {
        try {
          const { data: searchHistory, error } = await supabase
            .from('search_history')
            .insert({
              user_id: user.id,
              search_type: 'people',
              search_params: apiParams as any,
              person_titles: searchParams.personTitles || [],
              result_count: 0 // Will be updated after results are received
            })
            .select('id')
            .single();

          if (error) {
            console.error("Error saving search history:", error);
          } else if (searchHistory) {
            searchHistoryId = searchHistory.id;
            console.log("Search history saved with ID:", searchHistoryId);
          }
        } catch (err) {
          console.error("Error in search history save:", err);
        }
      }
      
      // Call the search service with the parameters
      const results = await searchForLeads(apiParams);
      
      console.log("Raw search results:", results);
      console.log("Results type:", Array.isArray(results) ? `Array with ${results.length} items` : typeof results);
      
      if (results && Array.isArray(results) && results.length > 0) {
        console.log("First result sample:", JSON.stringify(results[0]).substring(0, 200));
      }
      
      // Transform results
      const transformedLeads = transformApifyResults(results, 'people');
      
      console.log("Transformed leads:", transformedLeads);
      
      if (!transformedLeads || transformedLeads.length === 0) {
        toast({
          title: "No Results Found",
          description: "Your search did not return any results. Try different keywords or check the browser console for more information.",
          variant: "default",
        });
        setIsSearching(false);
        return;
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
              
              // If it has contact and company properties, it's a PeopleSearchResult
              if (peopleResult && peopleResult.contact && peopleResult.company) {
                uniqueId = `${peopleResult.company.name || ''}-${peopleResult.contact.firstName || ''}-${peopleResult.contact.lastName || ''}-${peopleResult.contact.title || ''}`;
              }
              
              return {
                search_id: searchHistoryId,
                result_data: lead as any, // Cast to any for JSON compatibility
                unique_identifier: uniqueId
              };
            });
            
            // Use upsert with onConflict to handle duplicates
            if (archiveData.length > 0) {
              const { error } = await supabase
                .from('search_results_archive')
                .upsert(archiveData, {
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
      
      try {
        // Map transformed leads to search results format with safe access
        const mappedResults: SearchResult[] = transformedLeads.map((item, index) => {
          console.log(`Mapping result ${index} to SearchResult format`);
          
          try {
            // Check if this is a people search result by checking if it has a contact property
            const peopleResult = item as PeopleSearchResult;
            const isPeopleResult = peopleResult && peopleResult.contact !== undefined;
            
            if (isPeopleResult) {
              // This is a people search result
              const contact = (peopleResult.contact || {}) as ContactData;
              const company = (peopleResult.company || {}) as CompanyData;
              
              const firstName = contact.firstName || "";
              const lastName = contact.lastName || "";
              const fullName = `${firstName} ${lastName}`.trim() || "Unknown";
              
              console.log(`Creating SearchResult for person: ${fullName}, company: ${company?.name || "Unknown"}`);
              
              return {
                id: `result-${Date.now()}-${index}`,
                type: 'person' as const,
                name: fullName,
                title: contact.title || "N/A",
                company: company?.name || "Unknown",
                industry: company?.industry || "N/A",
                location: company?.location || "N/A",
                website: company?.website || "",
                linkedin_url: contact.linkedin_url || "",
                email: contact.email || "",
                phone: contact.phone || "",
                description: company?.description || "",
                selected: false,
                archived: false,
                raw_data: item
              };
            } else {
              // This is a company search result - should not occur now but keeping for backwards compatibility
              const companyItem = item as CompanySearchResult;
              const company = (companyItem.company || {}) as CompanyData;
              
              console.log(`Creating SearchResult for company: ${company?.name || "Unknown"}`);
              
              return {
                id: `result-${Date.now()}-${index}`,
                type: 'company' as const,
                name: company?.name || "Unknown",
                industry: company?.industry || "N/A",
                location: company?.location || "N/A",
                website: company?.website || "",
                linkedin_url: company?.linkedin_url || "",
                description: company?.description || "",
                selected: false,
                archived: false,
                raw_data: item
              };
            }
          } catch (error) {
            console.error(`Error mapping result ${index}:`, error);
            // Return a placeholder result on error
            return {
              id: `result-${Date.now()}-${index}`,
              type: 'person' as const,
              name: "Error Processing Result",
              industry: "N/A",
              location: "N/A",
              website: "",
              description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              selected: false,
              archived: false,
              raw_data: {}
            };
          }
        });
        
        console.log(`Successfully mapped ${mappedResults.length} results`);
        setSearchResults(mappedResults);
        
        toast({
          title: "Search Complete",
          description: `Found ${mappedResults.length} results.`
        });
      } catch (error) {
        console.error("Error mapping search results:", error);
        toast({
          title: "Error Processing Results",
          description: "The search was successful but there was an error processing the results.",
          variant: "destructive"
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

  // Fixed handleEditCompany function to properly handle company data
  const handleEditCompany = async (companyData: Partial<Company>): Promise<Company | null> => {
    try {
      // Convert companyData to match the Company type structure
      const formattedCompanyData: Company = {
        id: companyData.id || "",
        name: companyData.name || "",
        website: companyData.website || "",
        industry: companyData.industry || "",
        industry_vertical: companyData.industry_vertical || "",
        size: companyData.size || "",
        location: companyData.location || "",
        street: companyData.street || "",
        city: companyData.city || "",
        state: companyData.state || "",
        zip: companyData.zip || "",
        country: companyData.country || "",
        phone: companyData.phone || "",
        description: companyData.description || "",
        facebook_url: companyData.facebook_url || "",
        twitter_url: companyData.twitter_url || "",
        linkedin_url: companyData.linkedin_url || "",
        keywords: companyData.keywords || [],
        createdAt: companyData.createdAt || new Date().toISOString(),
        updatedAt: companyData.updatedAt || new Date().toISOString(),
        insights: companyData.insights || null,
        call_script: companyData.call_script || null,
        email_script: companyData.email_script || null,
        text_script: companyData.text_script || null,
        social_dm_script: companyData.social_dm_script || null,
        research_notes: companyData.research_notes || null,
        user_id: companyData.user_id || null,
      };
      
      // Call addCompany from AppContext
      addCompany(formattedCompanyData);
      
      // Since addCompany doesn't return the created company, we need to fetch it from the database
      if (companyData && companyData.name) {
        // Find company by name in database
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('name', companyData.name)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (error) {
          console.error("Error finding newly added company:", error);
          return formattedCompanyData;
        }
        
        // Convert the database record to a Company type
        const dbCompany = data as any;
        const company: Company = {
          id: dbCompany.id,
          name: dbCompany.name || "",
          website: dbCompany.website || "",
          industry: dbCompany.industry || "",
          industry_vertical: dbCompany.industry_vertical || "",
          size: dbCompany.size || "",
          location: dbCompany.location || "",
          street: dbCompany.street || "",
          city: dbCompany.city || "",
          state: dbCompany.state || "",
          zip: dbCompany.zip || "",
          country: dbCompany.country || "",
          phone: dbCompany.phone || "",
          description: dbCompany.description || "",
          facebook_url: dbCompany.facebook_url || "",
          twitter_url: dbCompany.twitter_url || "",
          linkedin_url: dbCompany.linkedin_url || "",
          keywords: dbCompany.keywords || [],
          createdAt: dbCompany.created_at || new Date().toISOString(),
          updatedAt: dbCompany.updated_at || new Date().toISOString(),
          insights: dbCompany.insights,
          call_script: dbCompany.call_script,
          email_script: dbCompany.email_script,
          text_script: dbCompany.text_script,
          social_dm_script: dbCompany.social_dm_script,
          research_notes: dbCompany.research_notes,
          user_id: dbCompany.user_id,
        };
        
        return company;
      }
      
      // Return the company data we have
      return formattedCompanyData;
    } catch (error) {
      console.error("Error adding company:", error);
      return null;
    }
  };

  const saveSelectedLeads = async (listId: string) => {
    const selectedLeads = searchResults.filter(result => result.selected);
    
    if (selectedLeads.length === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select at least one lead to save.",
        variant: "destructive"
      });
      return;
    }
    
    console.log(`Saving ${selectedLeads.length} leads`);
    
    try {
      // Process each selected lead
      for (const lead of selectedLeads) {
        try {
          console.log("Processing lead to save:", lead.name);
          
          if (lead.raw_data) {
            // Process the direct Apollo.io data format
            const rawData = lead.raw_data;
            console.log("Found lead data:", rawData);
            
            // Create a comprehensive company object from all available fields
            const companyData: Partial<Company> = {
              name: rawData.organization_name || lead.company || "Unknown Company",
              website: rawData.organization?.website_url || lead.website || "",
              industry: rawData.organization?.industry || lead.industry || "",
              size: rawData.organization?.size || "",
              location: rawData.present_raw_address || lead.location || "",
              description: rawData.organization?.description || "",
              phone: rawData.phone || "",
              city: rawData.city || "",
              state: rawData.state || "",
              country: rawData.country || "",
              linkedin_url: rawData.organization?.linkedin_url || lead.linkedin_url || "",
              facebook_url: rawData.organization?.facebook_url || "",
              twitter_url: rawData.organization?.twitter_url || "",
              user_id: user?.id, // Associate with the current user
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            // Add company
            console.log("Adding company with enriched data:", companyData.name);
            const addedCompany = await handleEditCompany(companyData);
            
            // Only proceed if we have a valid company object
            if (addedCompany && addedCompany.id) {
              // Add contact if this is a person search result with contact info
              if ((lead.type === 'person' || lead.raw_data.first_name) && addedCompany) {
                console.log("Adding contact:", `${lead.raw_data.first_name || ""} ${lead.raw_data.last_name || ""}`);
                const contactData: Partial<Contact> = {
                  firstName: lead.raw_data.first_name || "",
                  lastName: lead.raw_data.last_name || "",
                  title: lead.raw_data.title || "",
                  email: lead.raw_data.email || "",
                  phone: lead.raw_data.sanitized_phone || lead.raw_data.phone || "",
                  linkedin_url: lead.raw_data.linkedin_url || "",
                  companyId: addedCompany.id,
                  notes: `Imported from lead search on ${new Date().toLocaleDateString()}`
                };
                
                await addContact(contactData as Contact);
              }
              
              // Add company to list
              try {
                const { error } = await supabase
                  .from('list_companies_new')
                  .insert({
                    list_id: listId,
                    company_id: addedCompany.id
                  });
                
                if (error) {
                  console.error("Error adding company to list:", error);
                }
              } catch (error) {
                console.error("Error in list_companies_new insert:", error);
              }
            }
          }
        } catch (error) {
          console.error("Error saving individual lead:", error);
        }
      }
      
      toast({
        title: "Leads Saved",
        description: `${selectedLeads.length} leads have been saved to your database and added to the selected list.`
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
                <CardTitle>Search People</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedSearch 
                  onSearch={handleSearch}
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
                    onSaveToList={saveSelectedLeads}
                    selectedCount={selectedResults.length}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <DebugConsole />
    </Layout>
  );
};

export default LeadSearchPage;
