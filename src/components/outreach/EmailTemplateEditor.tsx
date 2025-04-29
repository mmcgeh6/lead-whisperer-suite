
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmailTemplate } from "@/types";

interface EmailTemplateEditorProps {
  template: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
}

export const EmailTemplateEditor = ({ template, onSave }: EmailTemplateEditorProps) => {
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [variables, setVariables] = useState<string[]>(template.variables || []);
  const [newVariable, setNewVariable] = useState("");
  
  const handleAddVariable = () => {
    if (newVariable && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNewVariable("");
    }
  };
  
  const handleRemoveVariable = (variable: string) => {
    setVariables(variables.filter((v) => v !== variable));
  };
  
  const handleSave = () => {
    onSave({
      ...template,
      name,
      subject,
      body,
      variables,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Email Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use variables like {"{{firstName}}"} or {"{{company}}"} in your subject line.
          </p>
        </div>
        
        <div>
          <Label htmlFor="body">Email Body</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="mt-1 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use variables like {"{{firstName}}"}, {"{{company}}"}, etc. in your email body.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>Template Variables</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {variables.map((variable) => (
              <Badge key={variable} variant="outline" className="flex items-center gap-1">
                {variable}
                <button 
                  onClick={() => handleRemoveVariable(variable)} 
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  type="button"
                >
                  &times;
                </button>
              </Badge>
            ))}
            {variables.length === 0 && (
              <p className="text-sm text-gray-500">No variables defined yet.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add new variable"
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddVariable} type="button" size="sm">
              Add
            </Button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Template</Button>
        </div>
      </CardContent>
    </Card>
  );
};
