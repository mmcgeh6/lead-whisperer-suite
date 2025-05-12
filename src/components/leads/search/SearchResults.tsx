
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
import { ExternalLink, Mail, Phone, User, Building2 } from "lucide-react";
import { SearchResult } from "@/components/leads/search/searchUtils";
import { supabase } from "@/integrations/supabase/client";

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
              </TableRow>
            ))}
            
            {results.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No results found or all results have been archived.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
