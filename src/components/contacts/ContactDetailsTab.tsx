
import { Mail, Phone, Building, ExternalLink, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Contact } from "@/types";

interface ContactDetailsTabProps {
  contact: Contact;
  company: { id: string; name: string; website?: string } | null;
  isFindingEmail: boolean;
  isEnriching: boolean;
  onFindEmail: () => void;
  onEnrichContact: () => void;
}

export const ContactDetailsTab = ({ 
  contact, 
  company, 
  isFindingEmail, 
  isEnriching, 
  onFindEmail, 
  onEnrichContact 
}: ContactDetailsTabProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Basic Information</h3>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onFindEmail}
              disabled={isFindingEmail}
              className="h-7 px-2 py-1 border border-gray-200"
            >
              {isFindingEmail ? 
                <span className="flex items-center gap-1">
                  <span className="animate-pulse">●</span> 
                  Finding Email...
                </span> : 
                <span className="flex items-center gap-1">
                  <Search className="h-3 w-3" /> 
                  Find Email
                </span>
              }
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEnrichContact}
              disabled={isEnriching || !contact.linkedin_url}
              className="h-7 px-2 py-1 border border-gray-200"
            >
              {isEnriching ? 
                <span className="flex items-center gap-1">
                  <span className="animate-pulse">●</span> 
                  Enriching...
                </span> : 
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> 
                  Enrich Contact
                </span>
              }
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-gray-500">No email available</span>
                )}
              </div>
            </div>
          </div>
          
          {contact.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div>
                  <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                    {contact.phone}
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Company</div>
              <div>
                {company ? (
                  <a 
                    href={`/leads/company/${company.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {company.name}
                  </a>
                ) : (
                  "Unknown Company"
                )}
              </div>
            </div>
          </div>
          
          {contact.linkedin_url && (
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">LinkedIn</div>
                <div>
                  <a 
                    href={contact.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <div className="text-sm text-gray-500 mt-2">Added</div>
            <div>{new Date(contact.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
