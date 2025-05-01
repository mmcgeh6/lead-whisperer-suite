
import { Contact } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Mail, 
  Phone, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  Briefcase, 
  MapPin, 
  Globe, 
  Calendar, 
  Clock 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  
  // Calculate job duration if job_start_date is available
  const getJobDuration = () => {
    if (!contact.job_start_date) return null;
    try {
      const startDate = new Date(contact.job_start_date);
      return formatDistanceToNow(startDate, { addSuffix: false });
    } catch (error) {
      return null;
    }
  };
  
  const jobDuration = getJobDuration();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Contact Details</DialogTitle>
          <DialogDescription>
            View and manage contact information for {contact.firstName} {contact.lastName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {contact.firstName} {contact.lastName}
              </h2>
              <p className="text-gray-600">
                {contact.position || contact.title}
                {jobDuration && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({jobDuration})
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onFindEmail(contact)}
                disabled={isFindingEmail}
              >
                {isFindingEmail ? 
                  <span className="flex items-center gap-1">
                    <span className="animate-pulse">●</span> 
                    Finding Email...
                  </span> : 
                  <span className="flex items-center gap-1">
                    <Search className="h-4 w-4 mr-1" /> 
                    Find Email
                  </span>
                }
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEnrichContact(contact)}
                disabled={isEnrichingContact || !contact.linkedin_url}
              >
                {isEnrichingContact ? 
                  <span className="flex items-center gap-1">
                    <span className="animate-pulse">●</span> 
                    Enriching...
                  </span> : 
                  <span className="flex items-center gap-1">
                    <RefreshCw className="h-4 w-4 mr-1" /> 
                    Enrich Contact
                  </span>
                }
              </Button>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Contact Details</TabsTrigger>
              <TabsTrigger value="profile">LinkedIn Profile</TabsTrigger>
              <TabsTrigger value="posts">LinkedIn Posts</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Email</div>
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
                  
                  {(contact.phone || contact.mobilePhone) && (
                    <>
                      {contact.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <div className="font-medium">Office Phone</div>
                            <div>
                              <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                                {contact.phone}
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {contact.mobilePhone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <div className="font-medium">Mobile Phone</div>
                            <div>
                              <a href={`tel:${contact.mobilePhone}`} className="text-blue-600 hover:underline">
                                {contact.mobilePhone}
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {contact.position && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Position</div>
                        <div>{contact.position}</div>
                        {jobDuration && (
                          <div className="text-sm text-gray-500">
                            Duration: {jobDuration}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {(contact.address || contact.country) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Address</div>
                        <div>
                          {contact.address && <div>{contact.address}</div>}
                          {contact.country && <div>{contact.country}</div>}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {contact.linkedin_url && (
                    <div className="flex items-start gap-3">
                      <ExternalLink className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">LinkedIn</div>
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

                  {contact.languages && contact.languages.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Languages</div>
                        <div className="flex flex-wrap gap-1">
                          {contact.languages.map((language, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {contact.last_enriched && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Last Updated</div>
                        <div className="text-sm text-gray-500">
                          {new Date(contact.last_enriched).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="profile" className="space-y-6">
              {contact.linkedin_bio ? (
                <div>
                  <h3 className="text-lg font-medium mb-3">About</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {contact.linkedin_bio}
                  </p>
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  No LinkedIn bio available. Enrich this contact to fetch their LinkedIn profile data.
                </div>
              )}
              
              {/* Skills Section */}
              {contact.linkedin_skills && contact.linkedin_skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {contact.linkedin_skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Experience Section */}
              {contact.linkedin_experience && contact.linkedin_experience.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Experience</h3>
                  <div className="space-y-2">
                    {contact.linkedin_experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-3">
                        {exp}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Education Section */}
              {contact.linkedin_education && contact.linkedin_education.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Education</h3>
                  <div className="space-y-2">
                    {contact.linkedin_education.map((edu, index) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-3">
                        {edu}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!contact.linkedin_bio && !contact.linkedin_skills && 
               !contact.linkedin_experience && !contact.linkedin_education && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No LinkedIn profile data available.</p>
                  {contact.linkedin_url ? (
                    <Button 
                      onClick={() => onEnrichContact(contact)} 
                      disabled={isEnrichingContact}
                    >
                      {isEnrichingContact ? "Enriching..." : "Enrich from LinkedIn"}
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Add a LinkedIn URL to this contact to enable enrichment.
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="posts">
              {contact.linkedin_posts && contact.linkedin_posts.length > 0 ? (
                <div className="space-y-6">
                  {contact.linkedin_posts.map((post) => (
                    <div key={post.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : ""}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3 whitespace-pre-line">{post.content}</p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>{post.likes} likes</span>
                        <span>{post.comments} comments</span>
                        {post.url && (
                          <a 
                            href={post.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            View on LinkedIn
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No LinkedIn posts available.</p>
                  {contact.linkedin_url && (
                    <Button 
                      onClick={() => onEnrichContact(contact)} 
                      disabled={isEnrichingContact}
                      className="mt-4"
                    >
                      {isEnrichingContact ? "Enriching..." : "Fetch LinkedIn Posts"}
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes">
              <div className="space-y-2">
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <div className="border rounded-md p-4 bg-gray-50 min-h-[100px] whitespace-pre-line">
                  {contact.notes || "No notes available for this contact."}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
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
