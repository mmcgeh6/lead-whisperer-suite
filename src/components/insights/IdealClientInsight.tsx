
import { useState } from "react";
import { Company } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface IdealClientInsightProps {
  company: Company;
}

// Simple markdown to HTML converter
const renderMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  // Handle headers
  let html = markdown
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
  // Handle bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Handle links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Handle unordered lists
  html = html.replace(/^\s*-\s*(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>');
  
  // Handle horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  
  // Handle paragraphs
  html = html.replace(/^([^\n<].*?)(?:\n(?!<|$))/gm, '$1<br>');
  html = html.replace(/^([^\n<].+?)$/gm, '<p>$1</p>');
  
  return html;
};

export const IdealClientInsight = ({ company }: IdealClientInsightProps) => {
  const { updateCompany } = useAppContext();
  
  const [isIdealClient, setIsIdealClient] = useState(company.insights?.idealClient || false);
  const [approach, setApproach] = useState(company.insights?.suggestedApproach || "");
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = () => {
    const updatedCompany = { ...company };
    updatedCompany.insights = {
      ...updatedCompany.insights,
      idealClient: isIdealClient,
      suggestedApproach: approach,
    };
    
    updateCompany(updatedCompany);
    setIsEditing(false);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-medium">Ideal Client Fit</h3>
              <p className="text-sm text-gray-500">
                Is this company a good fit for your product/service?
              </p>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              checked={isIdealClient}
              onCheckedChange={value => isEditing && setIsIdealClient(value)}
              disabled={!isEditing}
            />
            <Label>This company is an ideal client</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="approach">Suggested Approach</Label>
            {isEditing ? (
              <Textarea
                id="approach"
                placeholder="Describe how your product/service can specifically help this company..."
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                rows={4}
              />
            ) : approach ? (
              <div className="bg-accent p-3 rounded-md prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(approach) }} />
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No approach defined yet</p>
            )}
          </div>
          
          {isEditing && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
