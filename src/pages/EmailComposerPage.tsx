
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { EmailComposer } from "@/components/outreach/EmailComposer";

const EmailComposerPage = () => {
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contactId") || undefined;
  const templateId = searchParams.get("templateId") || undefined;
  
  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Compose Personalized Email</h1>
        <p className="text-gray-500">
          Use templates and contact information to create highly personalized emails.
        </p>
        
        <EmailComposer contactId={contactId} templateId={templateId} />
      </div>
    </Layout>
  );
};

export default EmailComposerPage;
