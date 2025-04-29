
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { CallScriptGenerator } from "@/components/outreach/CallScriptGenerator";

const CallScriptPage = () => {
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contactId") || undefined;
  
  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Personalized Outreach Generator</h1>
        <p className="text-gray-500">
          Generate personalized call scripts, text messages, and social media DMs for your contacts.
        </p>
        
        <CallScriptGenerator contactId={contactId} />
      </div>
    </Layout>
  );
};

export default CallScriptPage;
