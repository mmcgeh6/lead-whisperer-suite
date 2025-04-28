
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmailTemplate } from "@/types";
import { EmailTemplateEditor } from "@/components/outreach/EmailTemplateEditor";
import { useToast } from "../components/ui/use-toast";

const EmailTemplatesPage = () => {
  const { emailTemplates } = useAppContext();
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState(emailTemplates[0]?.id || "");
  
  const selectedTemplate = emailTemplates.find((t) => t.id === selectedTemplateId) || emailTemplates[0];
  
  const handleSaveTemplate = (updatedTemplate: EmailTemplate) => {
    // In a real application, this would update the template in your state/database
    console.log("Updated template:", updatedTemplate);
    toast({
      title: "Template Updated",
      description: `${updatedTemplate.name} has been updated.`,
    });
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-gray-500 mt-2">
            Manage your email templates for personalized outreach.
          </p>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Templates</CardTitle>
            <Button size="sm">Create New Template</Button>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <TabsList className="mb-8">
                {emailTemplates.map((template) => (
                  <TabsTrigger key={template.id} value={template.id}>
                    {template.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {selectedTemplate && (
                <TabsContent value={selectedTemplate.id}>
                  <EmailTemplateEditor 
                    template={selectedTemplate}
                    onSave={handleSaveTemplate}
                  />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EmailTemplatesPage;
