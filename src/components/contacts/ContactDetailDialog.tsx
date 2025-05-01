
import { Contact } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Phone, ExternalLink, Search, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ContactDetailDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFindEmail: (contact: Contact) => void;
  onEnrichContact: (contact: Contact) => void;
  isFindingEmail: boolean;
  isEnrichingContact: boolean;
}

export const ContactDetailDialog = ({
  contact,
  open,
  onOpenChange,
  onFindEmail,
  onEnrichContact,
  isFindingEmail,
  isEnrichingContact
}: ContactDetailDialogProps) => {
  const navigate = useNavigate();
  
  if (!contact) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Contact Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              {contact.firstName} {contact.lastName}
            </h3>
            <p className="text-gray-600">{contact.title}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-3 text-gray-500" />
              <div className="flex items-center gap-2">
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="text-blue-500 hover:underline">
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-gray-500">No email available</span>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onFindEmail(contact)}
                  disabled={isFindingEmail}
                  className="h-7 px-2 py-1 ml-2 border border-gray-200"
                >
                  {isFindingEmail ? 
                    <span className="flex items-center gap-1">
                      <span className="animate-pulse">●</span> 
                      Finding...
                    </span> : 
                    <span className="flex items-center gap-1">
                      <Search className="h-3 w-3" /> 
                      Find Email
                    </span>
                  }
                </Button>
              </div>
            </div>
            
            {contact.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-3 text-gray-500" />
                <a href={`tel:${contact.phone}`} className="text-blue-500 hover:underline">
                  {contact.phone}
                </a>
              </div>
            )}
            
            {contact.linkedin_url && (
              <div className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-3 text-gray-500" />
                <div className="flex gap-2 items-center">
                  <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    LinkedIn Profile
                  </a>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEnrichContact(contact)}
                    disabled={isEnrichingContact}
                    className="h-7 px-2 py-1 ml-2 border border-gray-200"
                  >
                    {isEnrichingContact ? 
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
            )}
          </div>
          
          {contact.linkedin_bio && (
            <div>
              <h4 className="font-medium mb-2">LinkedIn Bio</h4>
              <p className="text-gray-600 whitespace-pre-line text-sm">
                {contact.linkedin_bio}
              </p>
            </div>
          )}
          
          {contact.linkedin_skills && contact.linkedin_skills.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1">
                {contact.linkedin_skills.map((skill, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {contact.linkedin_education && contact.linkedin_education.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Education</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                {contact.linkedin_education.map((edu, index) => (
                  <li key={index}>{edu}</li>
                ))}
              </ul>
            </div>
          )}
          
          {contact.linkedin_experience && contact.linkedin_experience.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Experience</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                {contact.linkedin_experience.map((exp, index) => (
                  <li key={index}>{exp}</li>
                ))}
              </ul>
            </div>
          )}
          
          {contact.linkedin_posts && contact.linkedin_posts.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Recent LinkedIn Posts</h4>
              <div className="space-y-3">
                {contact.linkedin_posts.slice(0, 3).map((post) => (
                  <div key={post.id} className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">{post.content}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {post.timestamp && new Date(post.timestamp).toLocaleDateString()} · 
                      {post.likes} likes · {post.comments} comments
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="font-medium mb-2">Notes</h4>
            <p className="text-gray-600 whitespace-pre-line">
              {contact.notes || "No notes available for this contact."}
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/outreach/email?contactId=${contact.id}`)}
            >
              Send Email
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(`/outreach/call-script?contactId=${contact.id}`)}
            >
              Generate Call Script
            </Button>
            <Button onClick={() => navigate(`/contacts/edit/${contact.id}`)}>
              Edit Contact
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
