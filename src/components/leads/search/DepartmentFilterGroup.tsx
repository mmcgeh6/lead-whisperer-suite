
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, Plus } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DepartmentOption {
  label: string;
  value: string;
}

interface DepartmentGroupProps {
  label: string;
  defaultValue: string;
  options: DepartmentOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export const DepartmentFilterGroup = ({
  label,
  defaultValue,
  options,
  selectedValues,
  onChange,
}: DepartmentGroupProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Check if all options in this group are selected
  const allSelected = options.every(option => 
    selectedValues.includes(option.value)
  );
  
  // Check if any options in this group are selected
  const anySelected = options.some(option => 
    selectedValues.includes(option.value)
  );

  // Handle group-level toggle
  const handleGroupToggle = (checked: boolean) => {
    if (checked) {
      // Select all options in the group
      const newValues = [...selectedValues];
      options.forEach(option => {
        if (!newValues.includes(option.value)) {
          newValues.push(option.value);
        }
      });
      onChange(newValues);
    } else {
      // Deselect all options in the group
      const newValues = selectedValues.filter(
        value => !options.some(option => option.value === value)
      );
      onChange(newValues);
    }
  };

  // Handle individual option toggle
  const handleOptionToggle = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, optionValue]);
    } else {
      onChange(selectedValues.filter(value => value !== optionValue));
    }
  };

  return (
    <div className="mb-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center space-x-2 mb-1">
          <Checkbox 
            id={`group-${label}`}
            checked={allSelected}
            indeterminate={!allSelected && anySelected}
            onCheckedChange={handleGroupToggle}
          />
          <CollapsibleTrigger className="flex items-center justify-between flex-1 font-medium text-sm">
            <Label htmlFor={`group-${label}`} className="flex-1 cursor-pointer text-left">
              {label}
            </Label>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="pl-6 pt-1 space-y-1">
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`option-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => 
                    handleOptionToggle(option.value, checked === true)
                  }
                />
                <Label 
                  htmlFor={`option-${option.value}`}
                  className="text-sm"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
