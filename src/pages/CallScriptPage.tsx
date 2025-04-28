
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { CallScriptGenerator } from "@/components/outreach/CallScriptGenerator";

const CallScriptPage = () => {
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contactId") || undefined;
  
  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Call Script Generator</h1>
        
        <CallScriptGenerator contactId={contactId} />
      </div>
    </Layout>
  );
};

export default CallScriptPage;
