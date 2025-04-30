
import { supabase } from "@/integrations/supabase/client";
import { UserWithRole } from "@/types/userManagement";

export const fetchUsers = async (): Promise<UserWithRole[]> => {
  try {
    // First get all users
    const { data: authUsers, error: authError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .order('first_name', { ascending: true });

    if (authError) throw authError;

    // For each user, get their auth info and role
    const usersWithInfo = await Promise.all(
      authUsers.map(async (profile) => {
        // Get auth user details
        const { data: authData, error: userError } = await supabase.auth.admin.getUserById(
          profile.id
        );
        
        if (userError) {
          console.error("Error fetching user:", userError);
          return null;
        }
        
        // Get role for this user by directly querying the user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .maybeSingle();
        
        const isAdmin = roleData?.role === 'admin';
        
        return {
          id: profile.id,
          email: authData?.user?.email || 'Unknown',
          created_at: authData?.user?.created_at || '',
          role: isAdmin ? 'admin' : 'user',
          first_name: profile.first_name,
          last_name: profile.last_name
        } as UserWithRole;
      })
    );
    
    // Filter out any nulls from failed lookups
    return usersWithInfo.filter(Boolean) as UserWithRole[];
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
};

export const updateUserRole = async (userId: string, newRole: 'admin' | 'user'): Promise<void> => {
  try {
    if (newRole === 'admin') {
      // First delete any existing roles
      await supabase.from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Then insert admin role
      await supabase.from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
    } else {
      // Remove admin role
      await supabase.from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
    }
  } catch (error) {
    console.error("Failed to update user role:", error);
    throw error;
  }
};
