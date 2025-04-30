
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Save } from "lucide-react";

interface SavedSearch {
  id: string;
  name: string;
  type: 'people' | 'companies';
  params: any;
}

export const SavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState("");

  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    
    // In a real app, would save to Supabase here
    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name: searchName,
      type: 'people', // This would come from the current active search
      params: {} // This would be the current search params
    };
    
    setSavedSearches([...savedSearches, newSearch]);
    setSearchName("");
    setShowSaveDialog(false);
  };

  const handleLoadSearch = (searchId: string) => {
    // In a real app, would load the search params and set them in the search form
    console.log("Loading search:", searchId);
  };

  const handleDeleteSearch = (searchId: string) => {
    setSavedSearches(savedSearches.filter(search => search.id !== searchId));
  };

  return (
    <div className="space-y-4">
      {savedSearches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No saved searches yet</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setShowSaveDialog(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Save Current Search
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {savedSearches.map((search) => (
              <div 
                key={search.id} 
                className="flex items-center justify-between border rounded-md p-3"
              >
                <div>
                  <div className="font-medium">{search.name}</div>
                  <div className="text-sm text-gray-500">
                    {search.type === 'people' ? 'People Search' : 'Company Search'}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleLoadSearch(search.id)}
                  >
                    Load
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteSearch(search.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Current Search
          </Button>
        </>
      )}
      
      {/* Save search dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Save your current search criteria for future use.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="search-name">Search Name</Label>
            <Input
              id="search-name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g., Tech Companies in Boston"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create Label component to avoid component import errors
const Label = ({ htmlFor, className, children }: { 
  htmlFor?: string, 
  className?: string, 
  children: React.ReactNode 
}) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}
  >
    {children}
  </label>
);
