
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Company } from "@/types";
import { moveCompanyToList } from "@/utils/listOperations";

interface CompanyTagsProps {
  company: Company;
  onCompanyUpdate: (updatedCompany: Company) => void;
}

interface List {
  id: string;
  name: string;
  description?: string;
}

export const CompanyTags = ({ company, onCompanyUpdate }: CompanyTagsProps) => {
  const [lists, setLists] = useState<List[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load lists and find which list this company belongs to
  useEffect(() => {
    const loadLists = async () => {
      if (!user) return;

      try {
        // Load all lists for this user
        const { data: listsData, error: listsError } = await supabase
          .from('lists')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (listsError) {
          console.error("Error loading lists:", listsError);
          return;
        }

        setLists(listsData || []);

        // Find which list this company belongs to
        const { data: listCompanyData, error: listCompanyError } = await supabase
          .from('list_companies_new')
          .select('list_id')
          .eq('company_id', company.id)
          .single();

        if (listCompanyError && listCompanyError.code !== 'PGRST116') {
          console.error("Error finding company list:", listCompanyError);
          return;
        }

        if (listCompanyData) {
          setCurrentListId(listCompanyData.list_id);
        }
      } catch (error) {
        console.error("Exception loading lists:", error);
      }
    };

    loadLists();
  }, [user, company.id]);

  const handleListChange = async (newListId: string) => {
    if (!user || newListId === currentListId) return;

    setIsUpdating(true);

    try {
      const result = await moveCompanyToList(company.id, currentListId, newListId);

      if (result.success) {
        setCurrentListId(newListId);
        toast({
          title: "List Updated",
          description: "Company has been moved to the new list successfully.",
        });
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error("Error updating company list:", error);
      toast({
        title: "Error",
        description: "Failed to update company list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTagUpdate = async (newTags: string[]) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          tags: newTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) {
        throw error;
      }

      // Update the local company object
      const updatedCompany = { ...company, tags: newTags };
      onCompanyUpdate(updatedCompany);

      toast({
        title: "Tags Updated",
        description: "Company tags have been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating tags:", error);
      toast({
        title: "Error",
        description: "Failed to update company tags. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addTag = (newTag: string) => {
    if (!newTag.trim()) return;
    
    const currentTags = company.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      handleTagUpdate([...currentTags, newTag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = company.tags || [];
    handleTagUpdate(currentTags.filter(tag => tag !== tagToRemove));
  };

  const currentList = lists.find(list => list.id === currentListId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lists & Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Current List</label>
          <Select
            value={currentListId || ""}
            onValueChange={handleListChange}
            disabled={isUpdating}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a list" />
            </SelectTrigger>
            <SelectContent>
              {lists.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentList && (
            <p className="text-sm text-muted-foreground">
              Currently in: <span className="font-medium">{currentList.name}</span>
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-2">
            {company.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newTag = prompt("Enter new tag:");
                if (newTag) addTag(newTag);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Tag
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
