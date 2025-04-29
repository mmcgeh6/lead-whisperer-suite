
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { CompanyList } from "@/components/leads/CompanyList";
import { LeadSearch } from "@/components/leads/LeadSearch";
import { Company } from "@/types";

const LeadsPage = () => {
  const [newLeads, setNewLeads] = useState<Partial<Company>[]>([]);

  const handleLeadsFound = (leads: any[]) => {
    // Transform n8n/scraper data into company format
    const formattedLeads = leads.map(lead => ({
      name: lead.companyName,
      website: lead.website,
      industry: lead.industry,
      size: lead.size || "Unknown",
      location: lead.location || "Unknown",
      description: lead.description || ""
    }));

    setNewLeads(formattedLeads);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Lead Generation</h1>
          <p className="text-gray-500 mt-2">
            Search for new leads or manage your existing company leads.
          </p>
        </div>
        
        <LeadSearch onLeadsFound={handleLeadsFound} />
        
        <CompanyList newLeads={newLeads} />
      </div>
    </Layout>
  );
};

export default LeadsPage;
