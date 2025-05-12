
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchResults } from "@/components/leads/search/SearchResults";

interface SearchResultDisplayProps {
  results: any[];
  onResultSelection: (id: string, selected: boolean) => void;
  onSaveToList: (listId: string) => void;
  selectedCount: number;
}

export const SearchResultDisplay = ({ 
  results, 
  onResultSelection, 
  onSaveToList, 
  selectedCount 
}: SearchResultDisplayProps) => {
  if (results.length === 0) return null;
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Search Results</CardTitle>
      </CardHeader>
      <CardContent>
        <SearchResults 
          results={results}
          onResultSelection={onResultSelection}
          onSaveToList={onSaveToList}
          selectedCount={selectedCount}
        />
      </CardContent>
    </Card>
  );
};
