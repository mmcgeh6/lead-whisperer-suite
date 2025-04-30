
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to get the current authenticated user ID
 * This can be useful for debugging permission issues
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    return user?.user?.id || null;
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return null;
  }
};
