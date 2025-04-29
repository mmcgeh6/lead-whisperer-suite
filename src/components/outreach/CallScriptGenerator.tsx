
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Contact, Company } from "@/types";
import { PersonalizedOutreach } from "./PersonalizedOutreach";

interface CallScriptGeneratorProps {
  contactId?: string;
}

export const CallScriptGenerator = ({ contactId }: CallScriptGeneratorProps) => {
  const { contacts, companies } = useAppContext();
  const { toast } = useToast();
  
  const [selectedContactId, setSelectedContactId] = useState(contactId || "");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const selectedCompany = selectedContact 
    ? companies.find((c) => c.id === selectedContact.companyId) 
    : null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Outreach Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="contact">Select Contact</Label>
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
        
        {selectedContact && selectedCompany && (
          <div className="space-y-1 p-4 bg-gray-50 rounded-md">
            <p className="text-sm"><span className="font-semibold">Contact:</span> {selectedContact.firstName} {selectedContact.lastName}</p>
            <p className="text-sm"><span className="font-semibold">Title:</span> {selectedContact.title}</p>
            <p className="text-sm"><span className="font-semibold">Company:</span> {selectedCompany.name}</p>
            <p className="text-sm"><span className="font-semibold">Industry:</span> {selectedCompany.industry}</p>
          </div>
        )}
        
        {selectedContact && selectedCompany && (
          <PersonalizedOutreach 
            companyName={selectedCompany.name} 
          />
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to get company name from ID
function getCompanyName(companyId: string, companies: Company[]): string {
  const company = companies.find(c => c.id === companyId);
  return company ? company.name : "Unknown Company";
}
