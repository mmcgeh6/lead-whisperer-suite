
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
import { formatDistanceToNow, format } from "date-fns";
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
      
      // Handle complex object with title and subComponents
      if (typeof exp === 'object' && exp !== null && exp.title && exp.subComponents) {
        let formatted = exp.title || '';
        
        // Handle subComponents safely
        if (exp.subComponents) {
          if (typeof exp.subComponents === 'string') {
            formatted += `: ${exp.subComponents}`;
          } else if (Array.isArray(exp.subComponents) && exp.subComponents.length > 0) {
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
            }
          }
        }
        
        return formatted;
      }
      
      // Handle object format with title, subtitle, etc.
      if (typeof exp === 'object' && exp !== null) {
        if (exp.title || exp.role || exp.position) {
          let formatted = exp.title || exp.role || exp.position || '';
          
          if (exp.company || exp.organization) {
            formatted += ` at ${exp.company || exp.organization}`;
          } else if (exp.subtitle) {
            formatted += ` at ${exp.subtitle}`;
          }
          
          if (exp.caption) {
            formatted += ` ${exp.caption}`;
          }
          
          // Handle date ranges
          if (exp.starts_at || exp.startDate || exp.start_date) {
            const startObj = exp.starts_at || exp.startDate || exp.start_date;
            const startYear = typeof startObj === 'object' ? startObj.year : 
                             (typeof startObj === 'string' ? new Date(startObj).getFullYear() : '');
            const startMonth = typeof startObj === 'object' ? (startObj.month ? startObj.month + '/' : '') : '';
            
            formatted += ` (${startMonth}${startYear}-`;
            
            if (exp.ends_at || exp.endDate || exp.end_date) {
              const endObj = exp.ends_at || exp.endDate || exp.end_date;
              const endYear = typeof endObj === 'object' ? endObj.year : 
                             (typeof endObj === 'string' ? new Date(endObj).getFullYear() : 'Present');
              const endMonth = typeof endObj === 'object' ? (endObj.month ? endObj.month + '/' : '') : '';
              
              formatted += `${endMonth}${endYear || 'Present'})`;
            } else {
              formatted += 'Present)';
            }
          }
          
          return formatted;
        }
      }
      
      // As fallback, convert to string
      return typeof exp === 'object' ? JSON.stringify(exp) : String(exp);
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
      
      // Handle object with title (LinkedIn skills format)
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
  
  // Format education data
  const formatEducation = (education: any[]): string[] => {
    if (!Array.isArray(education)) return [];
    
    return education.map(edu => {
      // Handle string format (already formatted)
      if (typeof edu === 'string') {
        return edu;
      }
      
      // Handle object format
      if (typeof edu === 'object' && edu !== null) {
        let formatted = '';
        
        if (edu.degree && edu.field_of_study) {
          formatted += `${edu.degree} in ${edu.field_of_study}`;
        } else if (edu.degree) {
          formatted += edu.degree;
        } else if (edu.field_of_study) {
          formatted += edu.field_of_study;
        }
        
        if (edu.school_name || edu.school) {
          formatted += formatted ? ` at ${edu.school_name || edu.school}` : `${edu.school_name || edu.school}`;
        }
        
        // Add dates if available
        const startYear = edu.starts_at?.year || (edu.start_date ? new Date(edu.start_date).getFullYear() : '');
        const endYear = edu.ends_at?.year || (edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present');
        
        if (startYear || endYear) {
          formatted += ` (${startYear}-${endYear})`;
        }
        
        return formatted || JSON.stringify(edu);
      }
      
      // As fallback, return stringified version
      return String(edu);
    });
  };
  
  // Format languages to handle different structures
  const formatLanguages = (languages: any[]): string[] => {
    if (!Array.isArray(languages)) return [];
    
    return languages.map(lang => {
      if (typeof lang === 'string') {
        return lang;
      }
      
      if (typeof lang === 'object' && lang !== null) {
        if (lang.name || lang.language) {
          return lang.name || lang.language;
        }
        
        // Handle proficiency level if available
        if (lang.language && lang.proficiency) {
          return `${lang.language} (${lang.proficiency})`;
        }
      }
      
      return String(lang);
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
  
  // Format post date
  const formatPostDate = (timestamp: string) => {
    if (!timestamp) return "";
    try {
      return format(new Date(timestamp), 'MMM d, yyyy');
    } catch (error) {
      return timestamp;
    }
  };
  
  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  const jobDuration = getJobDuration();
  const formattedExperience = contact.linkedin_experience ? formatExperienceData(contact.linkedin_experience) : [];
  const formattedSkills = contact.linkedin_skills ? formatSkills(contact.linkedin_skills) : [];
  const formattedEducation = contact.linkedin_education ? formatEducation(contact.linkedin_education) : [];
  const formattedLanguages = contact.languages ? formatLanguages(contact.languages) : [];
  const formattedPosts = safeLinkedInPosts();
  
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
                {contact.headline || contact.position || contact.title}
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
                  
                  {(contact.position || contact.headline) && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Position</div>
                        <div>{contact.position || contact.headline}</div>
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
                  {(contact.address || contact.city || contact.country) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Address</div>
                        <div>
                          {contact.address && <div>{contact.address}</div>}
                          {contact.city && <div>{contact.city}</div>}
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

                  {formattedLanguages.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Languages</div>
                        <div className="flex flex-wrap gap-1">
                          {formattedLanguages.map((language, index) => (
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
              {(contact.linkedin_bio || contact.about || 
                formattedSkills.length > 0 || 
                formattedExperience.length > 0 || 
                formattedEducation.length > 0 || 
                formattedPosts.length > 0) ? (
                <div className="space-y-8">
                  {/* LinkedIn Bio/About */}
                  {(contact.linkedin_bio || contact.about) && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">About</h3>
                      <p className="text-gray-700 whitespace-pre-line">
                        {contact.about || contact.linkedin_bio}
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
                  {formattedEducation.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Education</h3>
                      <div className="space-y-2">
                        {formattedEducation.map((edu, index) => (
                          <div key={index} className="border-l-2 border-gray-200 pl-3">
                            {edu}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* LinkedIn Posts */}
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
                                  {formatPostDate(post.timestamp)}
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
