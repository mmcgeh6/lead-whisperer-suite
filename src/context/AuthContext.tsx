
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { signOut as authSignOut } from "@/lib/auth";

// Define possible user roles
export type UserRole = 'admin' | 'user';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  isAdmin: boolean;
  userRole: UserRole | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  userRole: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Function to fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      return null;
    }
  };

  // Function to fetch user role by directly querying the user_roles table
  const fetchUserRole = async (userId: string) => {
    try {
      // Directly query the user_roles table instead of using RPC
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking admin role:", error);
        return 'user' as UserRole; // Default role
      }
      
      return data && data.role === 'admin' ? 'admin' as UserRole : 'user' as UserRole;
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
      return 'user' as UserRole; // Default role
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const profile = await fetchProfile(user.id);
      setProfile(profile);
      
      const role = await fetchUserRole(user.id);
      setUserRole(role);
      setIsAdmin(role === 'admin');
    }
  };
  
  const handleSignOut = async () => {
    const { error } = await authSignOut();
    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            const profile = await fetchProfile(session.user.id);
            setProfile(profile);
            
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
            setIsAdmin(role === 'admin');
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
        fetchUserRole(session.user.id).then(role => {
          setUserRole(role);
          setIsAdmin(role === 'admin');
        });
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      isLoading, 
      isAdmin, 
      userRole,
      signOut: handleSignOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
