
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export const GeneralSettings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [contactsSyncEnabled, setContactsSyncEnabled] = useState(false);
  const [draftsSyncEnabled, setDraftsSyncEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Load saved preferences from localStorage
    const darkModePreference = localStorage.getItem('darkMode') === 'true';
    const autoSavePreference = localStorage.getItem('autoSave') !== 'false'; // Default to true
    const contactsSyncPreference = localStorage.getItem('contactsSync') === 'true';
    
    setDarkMode(darkModePreference);
    setAutoSaveEnabled(autoSavePreference);
    setContactsSyncEnabled(contactsSyncPreference);
  }, []);
  
  const savePreferences = () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('darkMode', darkMode.toString());
      localStorage.setItem('autoSave', autoSaveEnabled.toString());
      localStorage.setItem('contactsSync', contactsSyncEnabled.toString());
      localStorage.setItem('draftsSync', draftsSyncEnabled.toString());
      
      // Apply theme change if needed
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      toast({
        title: "Preferences Saved",
        description: "Your settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error Saving Preferences",
        description: "There was a problem saving your settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure application appearance and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="warning" className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Some settings may require a page refresh to take full effect.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="darkMode" className="font-medium">Dark Mode</Label>
              <p className="text-sm text-gray-500">
                Toggle between light and dark theme
              </p>
            </div>
            <Switch 
              id="darkMode" 
              checked={darkMode} 
              onCheckedChange={setDarkMode} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoSave" className="font-medium">Auto Save</Label>
              <p className="text-sm text-gray-500">
                Automatically save changes as you make them
              </p>
            </div>
            <Switch 
              id="autoSave" 
              checked={autoSaveEnabled} 
              onCheckedChange={setAutoSaveEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="contactsSync" className="font-medium">Contacts Sync</Label>
              <p className="text-sm text-gray-500">
                Synchronize contacts with third-party CRMs
              </p>
            </div>
            <Switch 
              id="contactsSync" 
              checked={contactsSyncEnabled} 
              onCheckedChange={setContactsSyncEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="draftsSync" className="font-medium">Save Email Drafts</Label>
              <p className="text-sm text-gray-500">
                Save email drafts automatically when composing
              </p>
            </div>
            <Switch 
              id="draftsSync" 
              checked={draftsSyncEnabled} 
              onCheckedChange={setDraftsSyncEnabled}
            />
          </div>
          
          <Button 
            onClick={savePreferences} 
            disabled={isLoading}
            className="mt-4 w-full sm:w-auto"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
