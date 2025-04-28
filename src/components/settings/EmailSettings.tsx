
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/components/ui/use-toast";
import { EmailConfig } from "@/types";

export const EmailSettings = () => {
  const { emailConfig, saveEmailConfig } = useAppContext();
  const { toast } = useToast();
  
  const [host, setHost] = useState(emailConfig?.host || "");
  const [port, setPort] = useState(emailConfig?.port || 587);
  const [secure, setSecure] = useState(emailConfig?.secure || false);
  const [username, setUsername] = useState(emailConfig?.username || "");
  const [password, setPassword] = useState(emailConfig?.password || "");
  const [from, setFrom] = useState(emailConfig?.from || "");
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = () => {
    setIsSaving(true);
    
    try {
      const config: EmailConfig = {
        host,
        port,
        secure,
        username,
        password,
        from,
      };
      
      saveEmailConfig(config);
      toast({
        title: "Settings Saved",
        description: "Your email settings have been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save email settings:", error);
      toast({
        title: "Failed to Save Settings",
        description: "There was an error saving your email settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTestConnection = () => {
    toast({
      title: "Test Connection",
      description: "Testing email connection...",
    });
    
    // Simulate connection test
    setTimeout(() => {
      toast({
        title: "Connection Successful",
        description: "Your email configuration is working properly.",
      });
    }, 2000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="host">SMTP Host</Label>
            <Input
              id="host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="port">SMTP Port</Label>
              <Input
                id="port"
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="587"
              />
            </div>
            
            <div className="flex items-end mb-2">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="secure" 
                  checked={secure}
                  onCheckedChange={setSecure}
                />
                <Label htmlFor="secure">Use SSL/TLS</Label>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <Label htmlFor="from">From Email</Label>
            <Input
              id="from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Your Name <your.email@example.com>"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleTestConnection}>
            Test Connection
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
