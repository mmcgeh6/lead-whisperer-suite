
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface NotesTabProps {
  notes: string | undefined;
}

export const NotesTab = ({ notes }: NotesTabProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <FileText className="h-4 w-4 mr-2" />
          <h3 className="font-medium">Notes</h3>
        </div>
        <div className="whitespace-pre-line">
          {notes || "No notes available for this contact."}
        </div>
      </CardContent>
    </Card>
  );
};
