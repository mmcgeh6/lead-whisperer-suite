
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import { ExternalLink, Mail, Phone, User, Building2, MoreVertical, Plus } from "lucide-react";
import { SearchResult } from "@/components/leads/search/searchUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface SearchResultsProps {
  results: SearchResult[];
  onResultSelection: (id: string, selected: boolean) => void;
  onSaveToList: (listId: string) => void;
  selectedCount: number;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  results,
  onResultSelection,
  onSaveToList,
  selectedCount
}) => {
  const [selectedList, setSelectedList] = useState<string>("");
  const [lists, setLists] = useState<{id: string, name: string}[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  
  React.useEffect(() => {
    const fetchLists = async () => {
      try {
        const { data, error } = await supabase
          .from('lists')
          .select('id, name')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setLists(data);
          // Set first list as default if available
          if (data.length > 0 && !selectedList) {
            setSelectedList(data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching lists:", error);
      }
    };
    
    fetchLists();
  }, []);

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
      
      // Add to lists array and select it
      const newList = data[0];
      setLists(prev => [newList, ...prev]);
      setSelectedList(newList.id);
      
      setNewListName("");
      setNewListDescription("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating list:', error);
      toast({
        title: "Failed to create list",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleAddToSpecificList = async (listId: string, resultId: string) => {
    // Find the result and add it to the specific list
    const result = results.find(r => r.id === resultId);
    if (!result) return;

    try {
      // This would need to be implemented to add individual results to lists
      // For now, we'll show a toast indicating the action
      toast({
        title: "Feature coming soon",
        description: "Individual lead list management will be available soon."
      });
    } catch (error) {
      console.error('Error adding to list:', error);
      toast({
        title: "Failed to add to list",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  // Function to get icon based on result type
  const getTypeIcon = (type: 'person' | 'company') => {
    return type === 'person' ? <User className="h-4 w-4 text-blue-500" /> : <Building2 className="h-4 w-4 text-purple-500" />;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">
            {results.length} results found. {selectedCount} selected.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Select value={selectedList} onValueChange={setSelectedList}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a list" />
            </SelectTrigger>
            <SelectContent>
              {lists.map(list => (
                <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Button>
          
          <Button 
            onClick={() => selectedList ? onSaveToList(selectedList) : null}
            disabled={selectedCount === 0 || !selectedList}
          >
            Save {selectedCount} to List
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <span className="sr-only">Select</span>
              </TableHead>
              <TableHead className="w-[40px]">
                <span className="sr-only">Type</span>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Title / Industry</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead className="w-[100px]">Contact</TableHead>
              <TableHead className="w-[40px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id} 
                className={result.archived ? "opacity-50" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={result.selected}
                    disabled={result.archived}
                    onCheckedChange={(checked) => {
                      onResultSelection(result.id, checked === true);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{getTypeIcon(result.type)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {result.type === 'person' ? 'Person' : 'Company'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{result.name}</span>
                    {result.linkedin_url && (
                      <a 
                        href={result.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1"
                      >
                        LinkedIn <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {result.type === 'person' ? result.title : result.industry || 'N/A'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {result.type === 'person' ? result.company || 'N/A' : (
                    result.website ? (
                      <a 
                        href={result.website.startsWith('http') ? result.website : `https://${result.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {result.name} <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : result.name
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {result.location || 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {result.email && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{result.email}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {result.phone && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{result.phone}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => onResultSelection(result.id, !result.selected)}
                      >
                        {result.selected ? 'Deselect' : 'Select'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {lists.map(list => (
                        <DropdownMenuItem 
                          key={list.id}
                          onClick={() => handleAddToSpecificList(list.id, result.id)}
                        >
                          Add to {list.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            
            {results.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No results found or all results have been archived.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
};
