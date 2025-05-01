import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Mail, Phone, Building, Search, RefreshCw, FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { LinkedInPost } from "@/types";

const ContactDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { contacts, companies, setContacts } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFindingEmail, setIsFindingEmail] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  
  const contact = contacts.find((c) => c.id === id);
  const company = contact ? companies.find((c) => c.id === contact.companyId) : null;
  
  if (!contact) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Contact Not Found</h2>
          <p className="text-gray-500 mb-6">
            The contact you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/leads")}>Back to Leads</Button>
        </div>
      </Layout>
    );
  }
  
  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Function to enrich contact with LinkedIn data
  const handleEnrichContact = async () => {
    if (!contact.linkedin_url) {
      toast({
        title: "LinkedIn URL Missing",
        description: "This contact doesn't have a LinkedIn URL. Please add it first.",
        variant: "destructive"
      });
      return;
    }

    setIsEnriching(true);
    
    try {
      console.log("Enriching contact with LinkedIn URL:", contact.linkedin_url);
      
      // Use webhook URL for enrichment
      const webhookUrl = "https://n8n-service-el78.onrender.com/webhook-test/af95b526-404c-4a13-9ca2-2d918b7d4e90";
      
      // Add timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          linkedinUrl: contact.linkedin_url,
          type: "person"
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Contact enrichment data received:", data);
      
      // Process the received data
      const profileData = Array.isArray(data) ? data[0] : data;
      
      // Prepare the update data
      const updateData: Record<string, any> = {
        last_enriched: new Date().toISOString()
      };

      // Extract bio
      if (profileData.bio || profileData.summary || profileData.about) {
        updateData.linkedin_bio = profileData.bio || profileData.summary || profileData.about;
      }

      // Extract skills
      if (Array.isArray(profileData.skills) && profileData.skills.length > 0) {
        updateData.linkedin_skills = profileData.skills;
      } else if (profileData.topSkillsByEndorsements) {
        updateData.linkedin_skills = profileData.topSkillsByEndorsements.split(", ");
      }

      // Extract education
      if (Array.isArray(profileData.education)) {
        updateData.linkedin_education = profileData.education.map(edu => 
          `${edu.degree || ''} ${edu.field_of_study || ''} at ${edu.school_name || ''} (${edu.starts_at?.year || ''}-${edu.ends_at?.year || 'Present'})`
        );
      }

      // Extract experience
      if (Array.isArray(profileData.experiences)) {
        updateData.linkedin_experience = profileData.experiences.map(exp => 
          `${exp.title || ''} at ${exp.company || ''} (${exp.starts_at?.month ? exp.starts_at.month + '/' : ''}${exp.starts_at?.year || ''}-${exp.ends_at?.month ? exp.ends_at.month + '/' : ''}${exp.ends_at?.year || 'Present'})`
        );
      } else if (Array.isArray(profileData.experiences)) {
        const formattedExperiences = [];
        for (const exp of profileData.experiences) {
          if (exp.title && (exp.subtitle || exp.caption)) {
            formattedExperiences.push(`${exp.title} at ${exp.subtitle || ''} ${exp.caption || ''}`);
          }
        }
        if (formattedExperiences.length > 0) {
          updateData.linkedin_experience = formattedExperiences;
        }
      }

      // Extract posts if available
      if (Array.isArray(profileData.posts) && profileData.posts.length > 0) {
        updateData.linkedin_posts = profileData.posts.map(post => ({
          id: post.id || `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: post.content || post.text || '',
          timestamp: post.timestamp || post.date || new Date().toISOString(),
          likes: post.likes || 0,
          comments: post.comments || 0,
          url: post.url || null
        }));
      }

      console.log("Updating contact with data:", updateData);
      
      // Update the contact in Supabase
      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contact.id);

      if (error) {
        console.error("Error updating contact:", error);
        throw new Error("Failed to update contact with LinkedIn data");
      }

      // Update local state
      const updatedContact = { 
        ...contact, 
        linkedin_bio: updateData.linkedin_bio,
        linkedin_skills: updateData.linkedin_skills,
        linkedin_education: updateData.linkedin_education,
        linkedin_experience: updateData.linkedin_experience,
        linkedin_posts: updateData.linkedin_posts,
        last_enriched: updateData.last_enriched
      };
      
      const updatedContacts = contacts.map(c => 
        c.id === contact.id ? updatedContact : c
      );
      setContacts(updatedContacts);

      toast({
        title: "Contact Enriched",
        description: "Successfully retrieved LinkedIn data for this contact.",
      });
      
    } catch (error) {
      console.error("Error enriching contact:", error);
      
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        toast({
          title: "Network Error",
          description: "Could not connect to the enrichment service. Please check your internet connection and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Enrichment Failed",
          description: "Could not retrieve additional data. Please try again later.",
          variant: "destructive"
        });
      }
    } finally {
      setIsEnriching(false);
    }
  };
  
  // Function to find email using the n8n webhook
  const handleFindEmail = async () => {
    if (!contact.firstName || !contact.lastName || !company?.name) {
      toast({
        title: "Missing Information",
        description: "Contact first name, last name and company name are required to search for an email.",
        variant: "destructive"
      });
      return;
    }

    setIsFindingEmail(true);
    console.log("Starting email search for:", contact.firstName, contact.lastName, "at", company.name);
    
    try {
      // Prepare the data to send to the webhook
      const requestData = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        companyName: company.name,
        companyDomain: company.website ? new URL(company.website).hostname.replace('www.', '') : null,
        linkedinUrl: contact.linkedin_url
      };

      console.log("Sending request data:", requestData);

      // Call the n8n webhook to find the email
      const response = await fetch("https://n8n-service-el78.onrender.com/webhook-test/755b751b-eb85-4350-ae99-2508ad2d3f31", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }

      // Parse the response
      const data = await response.json();
      console.log("Email finder response:", data);

      // Check if the email was found
      if (data && data.email) {
        // Update the contact record in Supabase
        const { error } = await supabase
          .from('contacts')
          .update({ email: data.email })
          .eq('id', contact.id);

        if (error) {
          console.error("Error updating contact:", error);
          throw new Error("Failed to update contact record");
        }

        // Update local state
        const updatedContact = { ...contact, email: data.email };
        const updatedContacts = contacts.map(c => 
          c.id === contact.id ? updatedContact : c
        );
        setContacts(updatedContacts);

        toast({
          title: "Email Found",
          description: `Found email: ${data.email}`,
        });
      } else {
        toast({
          title: "No Email Found",
          description: "Couldn't find an email address for this contact.",
        });
      }
    } catch (error) {
      console.error("Error finding email:", error);
      toast({
        title: "Email Search Failed",
        description: "There was an error searching for the email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsFindingEmail(false);
    }
  };
  
  // Format LinkedIn post date
  const formatPostDate = (timestamp: string) => {
    if (!timestamp) return "";
    try {
      return format(new Date(timestamp), 'MMM d, yyyy');
    } catch (error) {
      return timestamp;
    }
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback>{getInitials(contact.firstName, contact.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{contact.firstName} {contact.lastName}</h1>
              <p className="text-gray-500 mt-1">{contact.title} at {company?.name || "Unknown Company"}</p>
              {contact.last_enriched && (
                <p className="text-xs text-gray-400 mt-1">
                  Last enriched: {format(new Date(contact.last_enriched), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
          <div className="space-x-4">
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
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Contact Details</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn Info</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Basic Information</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleFindEmail}
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
                      onClick={handleEnrichContact}
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
          </TabsContent>
          
          <TabsContent value="linkedin">
            <div className="grid gap-6">
              {(!contact.linkedin_bio && !contact.linkedin_posts && !contact.linkedin_skills) ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="py-6">
                      <h3 className="text-lg font-medium mb-2">No LinkedIn Data Available</h3>
                      <p className="text-gray-500 mb-4">
                        Enrich this contact to fetch their LinkedIn data including bio, posts, skills, and more.
                      </p>
                      <Button 
                        onClick={handleEnrichContact}
                        disabled={isEnriching || !contact.linkedin_url}
                      >
                        {isEnriching ? 
                          <span className="flex items-center gap-1">
                            <span className="animate-pulse mr-2">●</span>
                            Enriching...
                          </span> : 
                          <span className="flex items-center gap-1">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Enrich from LinkedIn
                          </span>
                        }
                      </Button>
                      {!contact.linkedin_url && (
                        <p className="text-sm text-gray-500 mt-4">
                          Note: This contact needs a LinkedIn URL before enrichment.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* LinkedIn Bio */}
                  {contact.linkedin_bio && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">About</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-line">{contact.linkedin_bio}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Skills */}
                  {contact.linkedin_skills && contact.linkedin_skills.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Skills</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {contact.linkedin_skills.map((skill, index) => (
                            <div key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {skill}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Experience */}
                  {contact.linkedin_experience && contact.linkedin_experience.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Experience</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {contact.linkedin_experience.map((exp, index) => (
                            <li key={index} className="pl-2 border-l-2 border-gray-200">
                              {exp}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Education */}
                  {contact.linkedin_education && contact.linkedin_education.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Education</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {contact.linkedin_education.map((edu, index) => (
                            <li key={index} className="pl-2 border-l-2 border-gray-200">
                              {edu}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* LinkedIn Posts */}
                  {contact.linkedin_posts && contact.linkedin_posts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent LinkedIn Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {contact.linkedin_posts.map((post: LinkedInPost, index: number) => (
                            <div key={post.id || index} className="border-b pb-4 last:border-0 last:pb-0">
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
                              <div className="whitespace-pre-line text-sm mt-2">
                                {post.content}
                              </div>
                              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                <span>{post.likes} likes</span>
                                <span>{post.comments} comments</span>
                                {post.url && (
                                  <a 
                                    href={post.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center"
                                  >
                                    View on LinkedIn <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <FileText className="h-4 w-4 mr-2" />
                  <h3 className="font-medium">Notes</h3>
                </div>
                <div className="whitespace-pre-line">
                  {contact.notes || "No notes available for this contact."}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ContactDetailPage;
