
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Save, Filter, X } from "lucide-react";
import { SearchResult } from "@/pages/LeadSearchPage";
import { SavedLists } from "@/components/leads/SavedLists";

interface SearchResultsProps {
  results: SearchResult[];
  onResultSelection: (id: string, selected: boolean) => void;
  onSaveToList: (listId: string) => void;
  selectedCount: number;
}

// Helper function to safely display values
const safeDisplay = (value: any): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    // If an object is passed, return a safe string representation
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.error("Could not stringify object:", error);
      return '[Complex Object]';
    }
  }
  return String(value);
};

export const SearchResults = ({
  results,
  onResultSelection,
  onSaveToList,
  selectedCount
}: SearchResultsProps) => {
  const [filterText, setFilterText] = useState<string>("");
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'all' | 'selected' | 'archived'>('all');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  
  // Filter results based on filter text and view mode
  const filteredResults = results.filter(result => {
    // Text filter
    const matchesFilter = filterText === "" || 
      (result.name && result.name.toLowerCase().includes(filterText.toLowerCase())) ||
      (result.company && result.company.toLowerCase().includes(filterText.toLowerCase())) ||
      (result.industry && result.industry.toLowerCase().includes(filterText.toLowerCase())) ||
      (result.location && result.location.toLowerCase().includes(filterText.toLowerCase()));
    
    // View mode filter
    if (viewMode === 'selected' && !result.selected) return false;
    if (viewMode === 'archived' && !result.archived) return false;
    
    return matchesFilter;
  });
  
  const handleSaveToList = () => {
    if (selectedListId) {
      onSaveToList(selectedListId);
      setShowSaveDialog(false);
      setSelectedListId(null);
    }
  };
  
  const handleSelectAll = (selected: boolean) => {
    filteredResults.forEach(result => {
      onResultSelection(result.id, selected);
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex-1 w-full">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Filter results..."
              className="pl-9"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            {filterText && (
              <button 
                className="absolute right-2.5 top-2.5"
                onClick={() => setFilterText("")}
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <Button 
              variant={viewMode === 'all' ? 'default' : 'outline'} 
              onClick={() => setViewMode('all')}
              size="sm"
            >
              All
            </Button>
            <Button 
              variant={viewMode === 'selected' ? 'default' : 'outline'} 
              onClick={() => setViewMode('selected')}
              size="sm"
            >
              Selected ({selectedCount})
            </Button>
            <Button 
              variant={viewMode === 'archived' ? 'default' : 'outline'} 
              onClick={() => setViewMode('archived')}
              size="sm"
            >
              Archived
            </Button>
          </div>
          
          <Button 
            onClick={() => setShowSaveDialog(true)}
            disabled={selectedCount === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save ({selectedCount})
          </Button>
        </div>
      </div>
      
      {/* Results table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              {results.length > 0 && results[0]?.type === 'person' && <TableHead>Title</TableHead>}
              {results.length > 0 && results[0]?.type === 'person' && <TableHead>Company</TableHead>}
              <TableHead>Location</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Website</TableHead>
              {results.length > 0 && results[0]?.type === 'person' && <TableHead>Email</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={results.length > 0 && results[0]?.type === 'person' ? 8 : 6} className="text-center py-10">
                  No results match your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.map((result) => (
                <TableRow 
                  key={result.id} 
                  className={result.archived ? "bg-gray-50" : ""}
                >
                  <TableCell>
                    <Checkbox 
                      checked={result.selected} 
                      onCheckedChange={(checked) => onResultSelection(result.id, !!checked)}
                      disabled={result.archived}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{safeDisplay(result.name)}</TableCell>
                  {result.type === 'person' && <TableCell>{safeDisplay(result.title)}</TableCell>}
                  {result.type === 'person' && <TableCell>{safeDisplay(result.company)}</TableCell>}
                  <TableCell>{safeDisplay(result.location)}</TableCell>
                  <TableCell>{safeDisplay(result.industry)}</TableCell>
                  <TableCell>
                    {result.website ? (
                      <a 
                        href={result.website.startsWith('http') ? result.website : `https://${result.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {safeDisplay(result.website).replace(/^(https?:\/\/)?(www\.)?/, '')}
                      </a>
                    ) : '-'}
                  </TableCell>
                  {result.type === 'person' && <TableCell>{safeDisplay(result.email)}</TableCell>}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Save to list dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save to List</DialogTitle>
            <DialogDescription>
              Choose a list to save {selectedCount} selected {selectedCount === 1 ? 'lead' : 'leads'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <SavedLists
              onSelectList={setSelectedListId}
              selectedListId={selectedListId}
              onAddCompaniesToList={() => {}} // Not needed here
              selectedCompanies={[]} // Not needed here
              hideActionButtons={true} // New prop to hide action buttons
              dialogMode={true} // New prop for dialog mode styling
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveToList} disabled={!selectedListId}>
              Save to List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
