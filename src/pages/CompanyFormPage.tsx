
import { useParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { CompanyForm } from "@/components/leads/CompanyForm";

const CompanyFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const { companies } = useAppContext();
  
  const company = id ? companies.find((c) => c.id === id) : undefined;
  const isEditing = !!company;
  
  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Company" : "Add New Company"}
        </h1>
        
        <CompanyForm initialData={company} />
      </div>
    </Layout>
  );
};

export default CompanyFormPage;
