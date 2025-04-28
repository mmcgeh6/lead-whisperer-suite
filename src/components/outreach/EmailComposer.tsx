
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/components/ui/use-toast";
import { Contact, Company, EmailTemplate } from "@/types";

interface EmailComposerProps {
  contactId?: string;
  templateId?: string;
}

export const EmailComposer = ({ contactId, templateId }: EmailComposerProps) => {
  const { contacts, companies, emailTemplates, sendEmail } = useAppContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedContactId, setSelectedContactId] = useState(contactId || "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateId || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  
  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const selectedCompany = selectedContact 
    ? companies.find((c) => c.id === selectedContact.companyId) 
    : null;
  const selectedTemplate = emailTemplates.find((t) => t.id === selectedTemplateId);
  
  // Update email content when template or contact changes
  useEffect(() => {
    if (selectedTemplate) {
      let newSubject = selectedTemplate.subject;
      let newBody = selectedTemplate.body;
      
      if (selectedContact) {
        // Replace basic variables
        newSubject = newSubject
          .replace(/{{firstName}}/g, selectedContact.firstName)
          .replace(/{{lastName}}/g, selectedContact.lastName);
          
        newBody = newBody
          .replace(/{{firstName}}/g, selectedContact.firstName)
          .replace(/{{lastName}}/g, selectedContact.lastName);
          
        if (selectedCompany) {
          newSubject = newSubject.replace(/{{company}}/g, selectedCompany.name);
          newBody = newBody.replace(/{{company}}/g, selectedCompany.name);
        }
      }
      
      setSubject(newSubject);
      setBody(newBody);
    }
  }, [selectedTemplate, selectedContact, selectedCompany]);
  
  // Handle custom variable changes
  const handleCustomVariableChange = (variable: string, value: string) => {
    const updatedVars = { ...customVariables, [variable]: value };
    setCustomVariables(updatedVars);
    
    // Update subject and body with new variable
    if (selectedTemplate) {
      let newSubject = subject;
      let newBody = body;
      
      const placeholder = new RegExp(`{{${variable}}}`, 'g');
      newSubject = newSubject.replace(placeholder, value);
      newBody = newBody.replace(placeholder, value);
      
      setSubject(newSubject);
      setBody(newBody);
    }
  };
  
  const handleSendEmail = async () => {
    if (!selectedContactId || !selectedTemplateId) {
      toast({
        title: "Cannot Send Email",
        description: "Please select a contact and template.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      await sendEmail(selectedContactId, selectedTemplateId, customVariables);
      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully.",
      });
      navigate("/outreach");
    } catch (error) {
      console.error("Failed to send email:", error);
      toast({
        title: "Failed to Send Email",
        description: "There was an error sending your email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const getRequiredVariables = () => {
    if (!selectedTemplate) return [];
    
    const baseVars = ["firstName", "lastName", "company"];
    return selectedTemplate.variables.filter(v => !baseVars.includes(v));
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact">Recipient</Label>
            <Select 
              onValueChange={setSelectedContactId} 
              defaultValue={selectedContactId}
              value={selectedContactId}
            >
              <SelectTrigger id="contact">
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} ({getCompanyName(contact.companyId, companies)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="template">Email Template</Label>
            <Select 
              onValueChange={setSelectedTemplateId} 
              defaultValue={selectedTemplateId}
              value={selectedTemplateId}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {emailTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {getRequiredVariables().length > 0 && (
          <div className="space-y-3">
            <Label>Customize Variables</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getRequiredVariables().map((variable) => (
                <div key={variable}>
                  <Label htmlFor={`var-${variable}`}>{variable}</Label>
                  <Input
                    id={`var-${variable}`}
                    value={customVariables[variable] || ""}
                    onChange={(e) => handleCustomVariableChange(variable, e.target.value)}
                    placeholder={`Enter value for ${variable}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>
        
        <div>
          <Label htmlFor="body">Email Body</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email here"
            rows={8}
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate("/outreach")}>
            Cancel
          </Button>
          <Button onClick={handleSendEmail} disabled={isSending || !selectedContactId || !selectedTemplateId}>
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to get company name from ID
function getCompanyName(companyId: string, companies: Company[]): string {
  const company = companies.find(c => c.id === companyId);
  return company ? company.name : "Unknown Company";
}
