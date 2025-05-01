
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { CompanyBanner } from "@/components/companies/CompanyBanner";
import { CompanyAbout } from "@/components/companies/CompanyAbout";
import { CompanyContacts } from "@/components/companies/CompanyContacts";
import { CompanyOutreach } from "@/components/companies/CompanyOutreach";
import { ContactDetailDialog } from "@/components/contacts/ContactDetailDialog";
import { Button } from "@/components/ui/button";
import { CompanyInsights } from "@/components/insights/CompanyInsights";
import { CompanyResearch } from "@/components/research/CompanyResearch";
import { SimilarCompanies } from "@/components/insights/SimilarCompanies";
import { useEnrichment } from "@/hooks/useEnrichment";

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { companies, contacts } = useAppContext();
  const navigate = useNavigate();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  
  // Find the company and related data
  const company = companies.find((c) => c.id === id);
  const companyContacts = contacts.filter((c) => c.companyId === id);
  const selectedContact = companyContacts.find(c => c.id === selectedContactId) || null;
  
  // IMPORTANT: Always create a default props object to ensure consistent hook calls
  // whether the company is found or not
  const enrichmentProps = useEnrichment(company || null);
  
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
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* Company Banner */}
        <CompanyBanner 
          company={company} 
          isEnriching={enrichmentProps.isEnriching} 
          handleEnrichCompany={enrichmentProps.handleEnrichCompany} 
        />

        {/* Module 1: About Company */}
        <CompanyAbout company={company} />
        
        {/* Module 2: Contacts */}
        <CompanyContacts 
          companyId={company.id}
          isEnriching={enrichmentProps.isEnriching}
          handleEnrichCompany={enrichmentProps.handleEnrichCompany}
          onContactSelect={handleContactSelect}
        />

        {/* Contact Dialog - Shows when contact is selected */}
        <ContactDetailDialog
          contact={selectedContact}
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          onFindEmail={enrichmentProps.handleFindEmail}
          onEnrichContact={enrichmentProps.handleEnrichContact}
          isFindingEmail={enrichmentProps.isFindingEmail}
          isEnrichingContact={enrichmentProps.isEnrichingContact}
        />
        
        {/* Similar Companies - New section */}
        {enrichmentProps.similarCompanies && enrichmentProps.similarCompanies.length > 0 && (
          <SimilarCompanies companies={enrichmentProps.similarCompanies} />
        )}
        
        {/* Module 3: Personalized Outreach */}
        <CompanyOutreach companyName={company.name} />
        
        {/* Module 4: Company Insights */}
        <CompanyInsights companyId={company.id} />
        
        {/* Module 5: Company Research */}
        <CompanyResearch companyId={company.id} />
      </div>
    </Layout>
  );
};

export default CompanyDetailPage;
