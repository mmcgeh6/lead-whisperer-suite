
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Company } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { Plus, X } from "lucide-react";

interface CompanyTagsProps {
  company: Company;
}

export const CompanyTags = ({ company }: CompanyTagsProps) => {
  const { updateCompany } = useAppContext();
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const tags = company.tags || [];

  const handleAddTags = async () => {
    if (!tagInput.trim()) return;
    
    setIsLoading(true);
    try {
      // Split the input by commas and clean up whitespace
      const newTags = tagInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .filter(tag => !tags.includes(tag)); // Avoid duplicates
      
      if (newTags.length === 0) {
        toast({
          title: "No new tags",
          description: "All tags already exist or input is empty.",
          variant: "destructive",
        });
        return;
      }
      
      const updatedTags = [...tags, ...newTags];
      
      const updatedCompany = {
        ...company,
        tags: updatedTags
      };
      
      await updateCompany(updatedCompany);
      setTagInput("");
      
      toast({
        title: "Tags Added",
        description: `Added ${newTags.length} new tag(s) to ${company.name}.`,
      });
    } catch (error) {
      console.error("Error adding tags:", error);
      toast({
        title: "Error",
        description: "Failed to add tags. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    setIsLoading(true);
    try {
      const updatedTags = tags.filter(tag => tag !== tagToRemove);
      
      const updatedCompany = {
        ...company,
        tags: updatedTags
      };
      
      await updateCompany(updatedCompany);
      
      toast({
        title: "Tag Removed",
        description: `Removed "${tagToRemove}" from ${company.name}.`,
      });
    } catch (error) {
      console.error("Error removing tag:", error);
      toast({
        title: "Error",
        description: "Failed to remove tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
        <CardDescription>
          Add tags to categorize and organize {company.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter tags separated by commas (e.g., tech, startup, b2b)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTags();
              }
            }}
            className="flex-1"
          />
          <Button 
            onClick={handleAddTags} 
            disabled={isLoading || !tagInput.trim()}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <p className="text-sm text-gray-500">No tags added yet.</p>
          ) : (
            tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="flex items-center gap-1"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  disabled={isLoading}
                  className="ml-1 hover:bg-gray-200 rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
