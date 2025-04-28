
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { ContactList } from "@/components/leads/ContactList";
import { CompanyInsights } from "@/components/insights/CompanyInsights";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { companies } = useAppContext();
  const navigate = useNavigate();
  
  const company = companies.find((c) => c.id === id);
  
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
  
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <p className="text-gray-500 mt-1">{company.industry} • {company.location}</p>
            <p className="text-gray-700 mt-4">{company.description}</p>
          </div>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => window.open(company.website, "_blank")}>
              Visit Website
            </Button>
            <Button onClick={() => navigate(`/leads/edit/${company.id}`)}>
              Edit Company
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="contacts">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="contacts" className="mt-6">
            <ContactList companyId={company.id} />
          </TabsContent>
          <TabsContent value="insights" className="mt-6">
            <CompanyInsights companyId={company.id} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CompanyDetailPage;
