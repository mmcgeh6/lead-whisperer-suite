
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
    setSelectedListId(listId);
    // Clear selected companies when changing lists
    setSelectedCompanies([]);
    
    // Fetch companies in the selected list
    if (listId) {
      fetchCompaniesInList(listId);
    } else {
      setCompaniesInSelectedList([]);
    }
  };

  const fetchCompaniesInList = async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from('list_companies')
        .select('company_id')
        .eq('list_id', listId);
      
      if (error) throw error;
      
      setCompaniesInSelectedList(data.map(item => item.company_id));
    } catch (error) {
      console.error('Error fetching companies in list:', error);
      toast({
        title: "Failed to load companies in list",
        description: "Please try again later",
        variant: "destructive"
      });
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
      
      // Insert into list_companies table
      const { error } = await supabase
        .from('list_companies')
        .upsert(listCompanies, { 
          onConflict: 'list_id,company_id',
          ignoreDuplicates: true 
        });
      
      if (error) throw error;
      
      toast({
        title: "Companies added to list",
        description: `${companyIds.length} companies added successfully`
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
            <CompanyList 
              newLeads={newLeads} 
              selectedCompanies={selectedCompanies}
              onCompanySelect={handleSelectCompany}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeadsPage;
