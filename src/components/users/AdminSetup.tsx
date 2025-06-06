
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/rpcFunctions";

export const AdminSetup = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const makeAdmin = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting to make user admin for user ID:", user.id);
      
      // First check if the user has proper permissions
      const currentUserId = await getCurrentUserId();
      console.log("Current user ID from helper function:", currentUserId);
      
      // Delete any existing roles first
      const { error: deleteError } = await supabase.from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.error("Error deleting existing roles:", deleteError);
        toast({
          title: "Error",
          description: `Failed to clear existing roles: ${deleteError.message}`,
          variant: "destructive",
        });
        return;
      }
      
      // Insert the admin role
      const { error } = await supabase.from('user_roles')
        .insert({ 
          user_id: user.id,
          role: 'admin'
        });

      if (error) {
        console.error("Error inserting admin role:", error);
        throw error;
      }
      
      // Refresh the profile to update the admin status
      await refreshProfile();
      
      toast({
        title: "Success",
        description: "You are now an admin!",
      });
    } catch (error: any) {
      console.error("Error making user admin:", error);
      toast({
        title: "Error",
        description: `Failed to set admin privileges: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Setup</h2>
      <p className="mb-4">You currently don't have admin privileges required to access the user management page.</p>
      <Button 
        onClick={makeAdmin} 
        disabled={isLoading} 
        className="w-full md:w-auto"
      >
        {isLoading ? "Processing..." : "Grant Admin Privileges"}
      </Button>
    </Card>
  );
};
