
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  
  // Format experience data to handle the complex structure
  const formatExperienceData = (experience: any[]): string[] => {
    if (!Array.isArray(experience)) return [];
    
    return experience.map(exp => {
      // Handle string format (already formatted)
      if (typeof exp === 'string') {
        return exp;
      }
      
      // Special handling for objects with title and subComponents structure
      if (typeof exp === 'object' && exp !== null && exp.title && exp.subComponents) {
        let formatted = exp.title || '';
        
        // Extract text from subComponents if possible
        if (Array.isArray(exp.subComponents) && exp.subComponents.length > 0) {
          const extractedTexts = exp.subComponents
            .map((sc: any) => {
              if (typeof sc === 'string') return sc;
              if (sc && typeof sc === 'object' && sc.text) return sc.text;
              return null;
            })
            .filter(Boolean)
            .join(', ');
          
          if (extractedTexts) {
            formatted += `: ${extractedTexts}`;
          }
        } else if (typeof exp.subComponents === 'object' && exp.subComponents !== null) {
          if (exp.subComponents.text) {
            formatted += `: ${exp.subComponents.text}`;
          } else {
            formatted += `: ${JSON.stringify(exp.subComponents)}`;
          }
        }
        
        return formatted;
      }
      
      // Handle object format with title, subtitle, etc.
      if (typeof exp === 'object' && exp !== null) {
        if (exp.title && (exp.subtitle || exp.caption)) {
          let formatted = exp.title;
          
          if (exp.subtitle) {
            formatted += ` at ${exp.subtitle}`;
          }
          
          if (exp.caption) {
            formatted += ` ${exp.caption}`;
          }
          
          return formatted;
        }
        
        // Handle standard structure
        if (exp.company || exp.title) {
          let formatted = exp.title || '';
          
          if (exp.company) {
            formatted += ` at ${exp.company}`;
          }
          
          if (exp.starts_at) {
            formatted += ` (${exp.starts_at.month ? exp.starts_at.month + '/' : ''}${exp.starts_at.year || ''}-`;
            
            if (exp.ends_at) {
              formatted += `${exp.ends_at.month ? exp.ends_at.month + '/' : ''}${exp.ends_at.year || 'Present'})`;
            } else {
              formatted += 'Present)';
            }
          }
          
          return formatted;
        }
      }
      
      // As fallback, convert to string
      return JSON.stringify(exp);
    });
  };
  
  // Parse and extract skill information from complex objects
  const formatSkills = (skills: any[]): string[] => {
    if (!Array.isArray(skills)) return [];
    
    return skills.map(skill => {
      // If skill is already a string, return it
      if (typeof skill === 'string') {
        return skill;
      }
      
      // Handle object with title and subComponents (LinkedIn skills format)
      if (typeof skill === 'object' && skill !== null) {
        if (skill.title) {
          return skill.title;
        }
        
        // Fall back to JSON string but clean it up
        return JSON.stringify(skill)
          .replace(/[{}"\\]/g, '') // Remove JSON syntax characters
          .replace(/:/g, ': ')     // Add space after colons
          .replace(/,/g, ', ');    // Add space after commas
      }
      
      return String(skill);
    });
  };
  
  // Safely format LinkedIn posts to prevent object rendering issues
  const safeLinkedInPosts = () => {
    if (!contact.linkedin_posts) return [];
    
    try {
      return Array.isArray(contact.linkedin_posts) 
        ? contact.linkedin_posts.map(post => ({
            id: post.id || `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content),
            timestamp: post.timestamp || new Date().toISOString(),
            likes: post.likes || 0,
            comments: post.comments || 0,
            url: post.url || null
          }))
        : [];
    } catch (error) {
      console.error("Error formatting LinkedIn posts:", error);
      return [];
    }
  };
  
  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  const jobDuration = getJobDuration();
  const formattedExperience = contact.linkedin_experience ? formatExperienceData(contact.linkedin_experience) : [];
  const formattedPosts = safeLinkedInPosts();
  const formattedSkills = contact.linkedin_skills ? formatSkills(contact.linkedin_skills) : [];
  
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
                              {typeof language === 'string' ? language : JSON.stringify(language)}
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
              {contact.linkedin_bio || formattedSkills.length > 0 || formattedExperience.length > 0 || 
               contact.linkedin_education || formattedPosts.length > 0 ? (
                <div className="space-y-8">
                  {/* LinkedIn Bio */}
                  {contact.linkedin_bio && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">About</h3>
                      <p className="text-gray-700 whitespace-pre-line">
                        {typeof contact.linkedin_bio === 'string' 
                          ? contact.linkedin_bio 
                          : JSON.stringify(contact.linkedin_bio)}
                      </p>
                    </div>
                  )}
                  
                  {/* Skills Section */}
                  {formattedSkills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {formattedSkills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="px-3 py-1">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Experience Section */}
                  {formattedExperience.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Experience</h3>
                      <div className="space-y-2">
                        {formattedExperience.map((exp, index) => (
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
                            {typeof edu === 'string' ? edu : JSON.stringify(edu)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* LinkedIn Posts - Now integrated into the LinkedIn profile tab */}
                  {formattedPosts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Recent Posts</h3>
                      <div className="space-y-4">
                        {formattedPosts.map((post, index) => (
                          <div key={post.id || index} className="border rounded-md p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{getInitials(contact.firstName, contact.lastName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                                <div className="text-xs text-gray-500">
                                  {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : ""}
                                </div>
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
                    </div>
                  )}
                </div>
              ) : (
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
