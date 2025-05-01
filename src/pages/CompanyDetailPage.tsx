
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
  
  const company = companies.find((c) => c.id === id);
  const companyContacts = contacts.filter((c) => c.companyId === id);
  const selectedContact = companyContacts.find(c => c.id === selectedContactId) || null;
  
  // Use the enrichment custom hook
  const {
    isEnriching,
    similarCompanies,
    isFindingEmail,
    isEnrichingContact,
    handleEnrichCompany,
    handleFindEmail,
    handleEnrichContact
  } = company ? useEnrichment(company) : {
    isEnriching: false,
    similarCompanies: [],
    isFindingEmail: false,
    isEnrichingContact: false,
    handleEnrichCompany: () => {},
    handleFindEmail: () => {},
    handleEnrichContact: () => {}
  };
  
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
          isEnriching={isEnriching} 
          handleEnrichCompany={handleEnrichCompany} 
        />

        {/* Module 1: About Company */}
        <CompanyAbout company={company} />
        
        {/* Module 2: Contacts */}
        <CompanyContacts 
          companyId={company.id}
          isEnriching={isEnriching}
          handleEnrichCompany={handleEnrichCompany}
          onContactSelect={handleContactSelect}
        />

        {/* Contact Dialog - Shows when contact is selected */}
        <ContactDetailDialog
          contact={selectedContact}
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          onFindEmail={handleFindEmail}
          onEnrichContact={handleEnrichContact}
          isFindingEmail={isFindingEmail}
          isEnrichingContact={isEnrichingContact}
        />
        
        {/* Similar Companies - New section */}
        {similarCompanies && similarCompanies.length > 0 && (
          <SimilarCompanies companies={similarCompanies} />
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
