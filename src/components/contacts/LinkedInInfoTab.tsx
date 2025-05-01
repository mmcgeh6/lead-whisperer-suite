
import { useState } from "react";
import { format } from "date-fns";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Contact, LinkedInPost } from "@/types";

interface LinkedInInfoTabProps {
  contact: Contact;
  isEnriching: boolean;
  onEnrichContact: () => void;
}

export const LinkedInInfoTab = ({ contact, isEnriching, onEnrichContact }: LinkedInInfoTabProps) => {
  // Format LinkedIn post date
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

  // If there's no LinkedIn data available
  if (!contact.linkedin_bio && !contact.linkedin_posts && !contact.linkedin_skills) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="py-6">
            <h3 className="text-lg font-medium mb-2">No LinkedIn Data Available</h3>
            <p className="text-gray-500 mb-4">
              Enrich this contact to fetch their LinkedIn data including bio, posts, skills, and more.
            </p>
            <Button 
              onClick={onEnrichContact}
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
    );
  }

  // If LinkedIn data is available
  return (
    <div className="grid gap-6">
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
    </div>
  );
};
