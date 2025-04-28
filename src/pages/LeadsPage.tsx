
import { Layout } from "@/components/Layout";
import { CompanyList } from "@/components/leads/CompanyList";

const LeadsPage = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Leads Management</h1>
          <p className="text-gray-500 mt-2">
            Manage your company leads and contacts.
          </p>
        </div>
        
        <CompanyList />
      </div>
    </Layout>
  );
};

export default LeadsPage;
