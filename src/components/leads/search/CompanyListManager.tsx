
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { SavedLists } from "@/components/leads/SavedLists";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CompanyListManagerProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  companyName?: string;
  onListSelect?: (listId: string) => void;
}

export const CompanyListManager: React.FC<CompanyListManagerProps> = ({
  isOpen,
  onClose,
  companyId,
  companyName,
  onListSelect
}) => {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleListSelection = (listId: string | null) => {
    setSelectedListId(listId);
  };

  const handleAddToList = async () => {
    if (!selectedListId || !companyId || !user) return;

    try {
      // Check if company is already in the list
      const { data: existingEntry, error: checkError } = await supabase
        .from('list_companies_new')
        .select('id')
        .eq('list_id', selectedListId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing entry:", checkError);
        throw checkError;
      }

      if (existingEntry) {
        toast({
          title: "Already in list",
          description: `${companyName} is already in the selected list.`
        });
        return;
      }

      // Add company to list
      const { error } = await supabase
        .from('list_companies_new')
        .insert({
          list_id: selectedListId,
          company_id: companyId
        });

      if (error) {
        console.error("Error adding company to list:", error);
        throw error;
      }

      toast({
        title: "Added to list",
        description: `${companyName} has been added to the selected list.`
      });

      if (onListSelect) {
        onListSelect(selectedListId);
      }

      onClose();
    } catch (error) {
      console.error('Error adding company to list:', error);
      toast({
        title: "Failed to add to list",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
          <DialogDescription>
            Choose a list to add {companyName} to
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <SavedLists 
            onSelectList={handleListSelection}
            selectedListId={selectedListId}
            onAddCompaniesToList={() => {}} // Not used in this context
            selectedCompanies={[]}
            hideActionButtons={true}
            dialogMode={true}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddToList}
            disabled={!selectedListId}
          >
            Add to List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
