
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { CompanyBanner } from "@/components/companies/CompanyBanner";
import { CompanyAbout } from "@/components/companies/CompanyAbout";
import { CompanyContacts } from "@/components/companies/CompanyContacts";
import { CompanyOutreach } from "@/components/companies/CompanyOutreach";
import { CompanyTags } from "@/components/companies/CompanyTags";
import { ContactDetailDialog } from "@/components/contacts/ContactDetailDialog";
import { Button } from "@/components/ui/button";
import { CompanyResearch } from "@/components/research/CompanyResearch";
import { SimilarCompanies } from "@/components/insights/SimilarCompanies";
import { ContentInsights } from "@/components/insights/ContentInsights";
import { FacebookAdsInsight } from "@/components/insights/FacebookAdsInsight";
import { TechStackInsight } from "@/components/insights/TechStackInsight";
import { useEnrichment } from "@/hooks/useEnrichment";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Company } from "@/types";

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { contacts } = useAppContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Find the related data
  const companyContacts = contacts.filter((c) => c.companyId === id);
  const selectedContact = companyContacts.find(c => c.id === selectedContactId) || null;
  
  // Create enrichment props with proper null handling
  const enrichmentProps = useEnrichment(company || null);

  // Fetch company from database
  useEffect(() => {
    const fetchCompany = async () => {
      if (!id || !user) return;
      
      setLoading(true);
      try {
        console.log("Fetching company with ID:", id);
        
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching company:", error);
          if (error.code === 'PGRST116') {
            // No rows returned
            setCompany(null);
          } else {
            throw error;
          }
        } else if (data) {
          console.log("Found company:", data);
          // Transform the data to match our Company type
          const formattedCompany: Company = {
            id: data.id,
            name: data.name,
            website: data.website || "",
            industry: data.industry || "",
            industry_vertical: data.industry_vertical,
            size: data.size || "",
            location: data.location || "",
            street: data.street,
            city: data.city,
            state: data.state,
            zip: data.zip,
            country: data.country,
            phone: data.phone,
            description: data.description || "",
            facebook_url: data.facebook_url,
            twitter_url: data.twitter_url,
            linkedin_url: data.linkedin_url,
            tags: data.tags || [],
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString(),
            call_script: data.call_script,
            email_script: data.email_script,
            text_script: data.text_script,
            social_dm_script: data.social_dm_script,
            research_notes: data.research_notes,
            user_id: data.user_id
          };
          setCompany(formattedCompany);
        } else {
          setCompany(null);
        }
      } catch (error) {
        console.error("Exception fetching company:", error);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompany();
  }, [id, user]);
  
  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p className="text-gray-500">Fetching company details...</p>
        </div>
      </Layout>
    );
  }
  
  if (!company) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Company Not Found</h2>
          <p className="text-gray-500 mb-6">
            The company you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/leads")}>Back to Leads</Button>
        </div>
      </Layout>
    );
  }
  
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    setContactDialogOpen(true);
  };

  // Handle Add Contact button click
  const handleAddContact = () => {
    if (company) {
      navigate(`/contacts/new?companyId=${company.id}`);
    }
  };

  // Handle Edit Contact navigation
  const handleEditContact = (contactId: string) => {
    navigate(`/contacts/edit/${contactId}`);
  };

  // Handle company update from components
  const handleCompanyUpdate = (updatedCompany: Company) => {
    setCompany(updatedCompany);
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* Company Banner */}
        <CompanyBanner 
          company={company} 
          isEnriching={enrichmentProps.isEnriching} 
          handleEnrichCompany={enrichmentProps.handleEnrichCompany} 
        />

        {/* Company Tags */}
        <CompanyTags company={company} onCompanyUpdate={handleCompanyUpdate} />

        {/* Module 1: About Company */}
        <CompanyAbout company={company} />
        
        {/* Module 2: Contacts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Contacts</h2>
            <Button 
              onClick={handleAddContact}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </div>
          <CompanyContacts 
            companyId={company.id}
            isEnriching={enrichmentProps.isEnriching}
            handleEnrichCompany={enrichmentProps.handleEnrichCompany}
            onContactSelect={handleContactSelect}
          />
        </div>

        {/* Contact Dialog - Shows when contact is selected */}
        <ContactDetailDialog
          contact={selectedContact}
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          onFindEmail={enrichmentProps.handleFindEmail}
          onEnrichContact={enrichmentProps.handleEnrichContact}
          isFindingEmail={enrichmentProps.isFindingEmail}
          isEnrichingContact={enrichmentProps.isEnrichingContact}
          onEditContact={handleEditContact}
        />
        
        {/* Similar Companies - New section */}
        {enrichmentProps.similarCompanies && enrichmentProps.similarCompanies.length > 0 && (
          <SimilarCompanies companies={enrichmentProps.similarCompanies} />
        )}
        
        {/* Module 3: Personalized Outreach */}
        <CompanyOutreach companyName={company.name} />
        
        {/* Module 4: Content Insights */}
        <ContentInsights company={company} />
        
        {/* Module 5: Facebook Ads */}
        <FacebookAdsInsight company={company} />
        
        {/* Module 6: Tech Stack */}
        <TechStackInsight company={company} />
        
        {/* Module 7: Company Research */}
        <CompanyResearch companyId={company.id} />
      </div>
    </Layout>
  );
};

export default CompanyDetailPage;
