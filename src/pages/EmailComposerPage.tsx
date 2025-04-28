
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
        <h1 className="text-3xl font-bold">Compose Email</h1>
        
        <EmailComposer contactId={contactId} templateId={templateId} />
      </div>
    </Layout>
  );
};

export default EmailComposerPage;
