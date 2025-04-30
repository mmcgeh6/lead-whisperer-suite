
import { useState, useEffect } from "react";
import { PlusCircle, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface List {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface SavedListsProps {
  onSelectList: (listId: string | null) => void;
  selectedListId: string | null;
  onAddCompaniesToList: (listId: string, companyIds: string[]) => void;
  selectedCompanies: string[];
  hideActionButtons?: boolean;
  dialogMode?: boolean;
}

export const SavedLists = ({ 
  onSelectList, 
  selectedListId,
  onAddCompaniesToList,
  selectedCompanies,
  hideActionButtons = false,
  dialogMode = false
}: SavedListsProps) => {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddToListDialogOpen, setIsAddToListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchLists = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setLists(data || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast({
        title: "Failed to load lists",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [user]);

  const handleCreateList = async () => {
    if (!newListName.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('lists')
        .insert({
          name: newListName.trim(),
          description: newListDescription.trim() || null,
          user_id: user.id,
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "List created",
        description: `"${newListName}" has been created successfully.`
      });
      
      setNewListName("");
      setNewListDescription("");
      setIsCreateDialogOpen(false);
      fetchLists();

      // If in dialog mode, select the newly created list automatically
      if (dialogMode && data && data[0]) {
        onSelectList(data[0].id);
      }
    } catch (error) {
      console.error('Error creating list:', error);
      toast({
        title: "Failed to create list",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleAddToList = async (listId: string) => {
    if (selectedCompanies.length === 0) {
      toast({
        title: "No companies selected",
        description: "Please select companies to add to the list",
        variant: "destructive"
      });
      return;
    }

    onAddCompaniesToList(listId, selectedCompanies);
    setIsAddToListDialogOpen(false);
  };

  // Render the list of lists with appropriate styling for dialog mode
  const renderLists = () => {
    if (isLoading) {
      return <div className="py-2 text-center text-sm text-gray-500">Loading lists...</div>;
    }
    
    if (lists.length === 0) {
      return <div className="py-2 text-center text-sm text-gray-500">No saved lists yet</div>;
    }
    
    return lists.map((list) => (
      <Button
        key={list.id}
        variant={selectedListId === list.id ? "default" : "outline"}
        className={`w-full justify-start text-left mb-2 ${dialogMode ? 'h-auto py-3' : ''}`}
        onClick={() => onSelectList(list.id)}
      >
        <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
        <div className={dialogMode ? 'text-left' : ''}>
          <span className="truncate">{list.name}</span>
          {dialogMode && list.description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{list.description}</p>
          )}
        </div>
      </Button>
    ));
  };

  // If in dialog mode, render a simplified version
  if (dialogMode) {
    return (
      <div className="space-y-3">
        {renderLists()}
        
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Create New List
        </Button>
        
        {/* Create List Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
              <DialogDescription>
                Create a new list to organize your leads
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  List Name
                </label>
                <Input
                  id="name"
                  placeholder="e.g., Tech Companies"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this list"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateList} disabled={!newListName.trim()}>
                Create List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Original component for sidebar use
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Saved Lists</h3>
        <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> New List
        </Button>
      </div>

      <div className="space-y-2">
        <Button
          variant={selectedListId === null ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => onSelectList(null)}
        >
          <Folder className="h-4 w-4 mr-2" /> All Leads
        </Button>
        
        {renderLists()}
      </div>

      {!hideActionButtons && selectedCompanies.length > 0 && (
        <Button 
          className="w-full mt-4" 
          onClick={() => setIsAddToListDialogOpen(true)}
        >
          Add {selectedCompanies.length} selected to list
        </Button>
      )}

      {/* Create List Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Create a new list to organize your leads
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                List Name
              </label>
              <Input
                id="name"
                placeholder="e.g., Tech Companies"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                placeholder="Brief description of this list"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateList} disabled={!newListName.trim()}>
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to List Dialog */}
      <Dialog open={isAddToListDialogOpen} onOpenChange={setIsAddToListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to List</DialogTitle>
            <DialogDescription>
              Choose a list to add the selected companies
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto">
            {lists.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No lists available. Create a new list first.
              </div>
            ) : (
              lists.map((list) => (
                <Button
                  key={list.id}
                  variant="outline"
                  className="w-full justify-start mb-2"
                  onClick={() => handleAddToList(list.id)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {list.name}
                </Button>
              ))
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddToListDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
