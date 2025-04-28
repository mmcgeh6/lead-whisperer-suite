
import { useState } from "react";
import { Company } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface IdealClientInsightProps {
  company: Company;
}

export const IdealClientInsight = ({ company }: IdealClientInsightProps) => {
  const { updateCompany } = useAppContext();
  
  const [isIdealClient, setIsIdealClient] = useState(company.insights?.idealClient || false);
  const [approach, setApproach] = useState(company.insights?.suggestedApproach || "");
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = () => {
    const updatedCompany = { ...company };
    updatedCompany.insights = {
      ...updatedCompany.insights,
      idealClient: isIdealClient,
      suggestedApproach: approach,
    };
    
    updateCompany(updatedCompany);
    setIsEditing(false);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-medium">Ideal Client Fit</h3>
              <p className="text-sm text-gray-500">
                Is this company a good fit for your product/service?
              </p>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              checked={isIdealClient}
              onCheckedChange={value => isEditing && setIsIdealClient(value)}
              disabled={!isEditing}
            />
            <Label>This company is an ideal client</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="approach">Suggested Approach</Label>
            <Textarea
              id="approach"
              placeholder="Describe how your product/service can specifically help this company..."
              value={approach}
              onChange={(e) => isEditing && setApproach(e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>
          
          {isEditing && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
