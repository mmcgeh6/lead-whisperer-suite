
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { CompanyList } from "@/components/leads/CompanyList";
import { SavedLists } from "@/components/leads/SavedLists";
import { Company } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

const LeadsPage = () => {
  const [newLeads, setNewLeads] = useState<Partial<Company>[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companiesInSelectedList, setCompaniesInSelectedList] = useState<string[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Partial<Company>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSelectCompany = (id: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCompanies(prev => [...prev, id]);
    } else {
      setSelectedCompanies(prev => prev.filter(companyId => companyId !== id));
    }
  };

  const handleSelectList = (listId: string | null) => {
    console.log("Selected list:", listId);
    setSelectedListId(listId);
    // Clear selected companies when changing lists
    setSelectedCompanies([]);
    
    if (listId) {
      fetchCompaniesInList(listId);
    } else {
      setCompaniesInSelectedList([]);
      setFilteredCompanies([]);
      loadAllCompanies();
    }
  };

  const loadAllCompanies = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error loading all companies:', error);
        throw error;
      }
      
      setFilteredCompanies(data || []);
      console.log(`Loaded ${data?.length || 0} companies for all leads view`);
    } catch (error) {
      console.error('Error loading all companies:', error);
      toast({
        title: "Failed to load companies",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompaniesInList = async (listId: string) => {
    console.log("Fetching companies for list:", listId);
    setIsLoading(true);
    try {
      // Use the list_companies_new table with UUID types
      const { data, error } = await supabase
        .from('list_companies_new')
        .select('company_id')
        .eq('list_id', listId);
      
      if (error) {
        console.error('Error fetching companies in list:', error);
        throw error;
      }
      
      const companyIds = data.map(item => item.company_id);
      console.log(`Found ${companyIds.length} company IDs in list:`, companyIds);
      setCompaniesInSelectedList(companyIds);
      
      // Now fetch the actual company data for these IDs
      if (companyIds.length > 0) {
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds);
          
        if (companiesError) {
          console.error('Error fetching companies by IDs:', companiesError);
          throw companiesError;
        }
        
        console.log(`Loaded ${companies?.length || 0} companies for list ${listId}`);
        setFilteredCompanies(companies || []);
      } else {
        console.log("No companies in this list");
        setFilteredCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies in list:', error);
      toast({
        title: "Failed to load companies in list",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompaniesToList = async (listId: string, companyIds: string[]) => {
    if (!user || companyIds.length === 0) return;
    
    try {
      // Prepare data for insertion
      const listCompanies = companyIds.map(companyId => ({
        list_id: listId,
        company_id: companyId
      }));
      
      console.log(`Adding ${companyIds.length} companies to list ${listId}:`, listCompanies);
      
      // First check if entries already exist to avoid duplicate errors
      const { data: existingEntries, error: checkError } = await supabase
        .from('list_companies_new')
        .select('company_id')
        .eq('list_id', listId)
        .in('company_id', companyIds);
        
      if (checkError) {
        console.error("Error checking existing list entries:", checkError);
        throw checkError;
      }
      
      // Filter out any companies that are already in the list
      const existingCompanyIds = existingEntries?.map(entry => entry.company_id) || [];
      const newCompanies = listCompanies.filter(
        company => !existingCompanyIds.includes(company.company_id)
      );
      
      if (newCompanies.length === 0) {
        toast({
          title: "Already in list",
          description: "These companies are already in the selected list."
        });
        return;
      }
      
      // Insert new entries without using onConflict
      const { error } = await supabase
        .from('list_companies_new')
        .insert(newCompanies);
      
      if (error) {
        console.error("Error adding companies to list:", error);
        throw error;
      }
      
      toast({
        title: "Companies added to list",
        description: `${newCompanies.length} companies added successfully`
      });
      
      // Clear selected companies
      setSelectedCompanies([]);
      
      // If we're currently viewing this list, refresh it
      if (selectedListId === listId) {
        fetchCompaniesInList(listId);
      }
    } catch (error) {
      console.error('Error adding companies to list:', error);
      toast({
        title: "Failed to add companies to list",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Effect to load initial data when component mounts
  useEffect(() => {
    if (!selectedListId) {
      loadAllCompanies();
    } else if (user) {
      fetchCompaniesInList(selectedListId);
    }
  }, [user]);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Lead Management</h1>
            <p className="text-gray-500 mt-2">
              Manage your existing company leads and contacts.
            </p>
          </div>
          <div className="flex space-x-4">
            <Button asChild>
              <Link to="/leads/company/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/leads/search">
                <Search className="h-4 w-4 mr-2" />
                Find New Leads
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lists Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Saved Lists</CardTitle>
              </CardHeader>
              <CardContent>
                <SavedLists 
                  onSelectList={handleSelectList}
                  selectedListId={selectedListId}
                  onAddCompaniesToList={handleAddCompaniesToList}
                  selectedCompanies={selectedCompanies}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <Card className="p-6">
                <div className="text-center">Loading leads...</div>
              </Card>
            ) : (
              <CompanyList 
                newLeads={filteredCompanies}
                selectedCompanies={selectedCompanies}
                onCompanySelect={handleSelectCompany}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeadsPage;
