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
      
      // Get the lead provider from settings
      const leadProvider = settings.leadProvider || 'apify-apollo';
      
      // Check for appropriate API key based on the selected provider
      let apiKey: string | null = null;
      let apiKeyLabel: string;
      
      if (leadProvider === 'apollo') {
        apiKeyLabel = 'Apollo.io';
        apiKey = settings.apolloApiKey || null;
      } else {
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
        keywordFields: searchParams.keywordFields
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

  // Fixed handleEditCompany function to properly return Company | null and avoid void checks
  const handleEditCompany = async (companyData: Partial<Company>): Promise<Company | null> => {
    try {
      // Get the result from addCompany
      const companyResult = await addCompany(companyData as Company);
      
      // Check if the result exists and is an object (not void)
      if (companyResult && typeof companyResult === 'object') {
        // Check if it has an id property to verify it's a Company
        if ('id' in companyResult) {
          return companyResult as Company;
        }
      }
      // Return null if no valid company was returned
      return null;
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
          
          if (lead.raw_data?.company) {
            // Process transformed format
            const rawCompany = lead.raw_data.company;
            console.log("Found company data in raw_data.company:", rawCompany.name || "Unknown company");
            
            const companyData: Partial<Company> = {
              // Ensure all required fields are present
              name: rawCompany.name || "Unknown Company",
              website: rawCompany.website || "",
              industry: rawCompany.industry || "",
              size: rawCompany.size || "Unknown",
              location: rawCompany.location || "",
              description: rawCompany.description || "",
              user_id: user?.id, // Associate with the current user
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            // Add company
            console.log("Adding company:", companyData.name);
            const addedCompany = await handleEditCompany(companyData);
            
            // Only proceed if we have a valid company with an ID
            if (addedCompany && addedCompany.id) {
              // Add contact if this is a person search result
              if (lead.raw_data.contact && addedCompany) {
                console.log("Adding contact:", `${lead.raw_data.contact.firstName} ${lead.raw_data.contact.lastName}`);
                const contactData: Partial<Contact> = {
                  firstName: lead.raw_data.contact.firstName || "",
                  lastName: lead.raw_data.contact.lastName || "",
                  title: lead.raw_data.contact.title || "",
                  email: lead.raw_data.contact.email || "",
                  phone: lead.raw_data.contact.phone || "",
                  linkedin_url: lead.raw_data.contact.linkedin_url || "",
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
            
            // Mark the result as added to list in the search_results_archive
            if (lead.raw_data?.search_id) {
              try {
                const peopleResult = lead.raw_data as PeopleSearchResult;
                const contact = peopleResult.contact || {};
                
                await supabase
                  .from('search_results_archive')
                  .update({ added_to_list: true })
                  .eq('unique_identifier', `${companyData.name}-${contact.firstName || ''}-${contact.lastName || ''}-${contact.title || ''}`);
              } catch (error) {
                console.error("Error updating search results archive:", error);
              }
            }
          } else {
            // Process legacy format
            console.log("No company data in raw_data.company, using legacy format");
            
            // Create a company
            const companyData: Partial<Company> = {
              name: lead.company || lead.name || "Unknown Company",
              website: lead.website || "",
              industry: lead.industry || "",
              size: "Unknown", // Default size value for legacy format
              location: lead.location || "",
              description: lead.description || "",
              linkedin_url: lead.linkedin_url?.includes("company") ? lead.linkedin_url : "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              user_id: user?.id
            };
            
            // Add company
            console.log("Adding company (legacy format):", companyData.name);
            const addedCompany = await handleEditCompany(companyData);
            
            // Only proceed if we have a valid company with an ID
            if (addedCompany && addedCompany.id) {
              // Only create contact for person type
              if (lead.type === 'person' && addedCompany) {
                const nameParts = lead.name.split(' ');
                const firstName = nameParts[0] || "";
                const lastName = nameParts.slice(1).join(' ') || "";
                
                // Add contact
                console.log("Adding contact (legacy format):", `${firstName} ${lastName}`);
                const contactData: Partial<Contact> = {
                  firstName,
                  lastName,
                  title: lead.title || "",
                  email: lead.email || "",
                  phone: lead.phone || "",
                  linkedin_url: lead.linkedin_url || "",
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
