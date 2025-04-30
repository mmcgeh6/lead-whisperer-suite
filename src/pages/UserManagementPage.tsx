
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useAuth, UserRole } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, ShieldCheck, UserCog, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
}

const UserManagementPage = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect non-admin users
  useEffect(() => {
    if (isAdmin === false) {
      navigate("/dashboard");
      toast({
        title: "Access denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
    }
  }, [isAdmin, navigate, toast]);
  
  // Fetch users and their roles
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // First get all users
      const { data: authUsers, error: authError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name', { ascending: true });

      if (authError) throw authError;

      // For each user, get their auth info and role using raw SQL
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
          
          // Get role for this user using raw SQL
          const { data: roleData, error: roleError } = await supabase
            .rpc('has_role', { role: 'admin' });
          
          const isAdmin = roleData === true;
          
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
      setUsers(usersWithInfo.filter(Boolean) as UserWithRole[]);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleRoleToggle = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowConfirmDialog(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;
    
    const newRole: UserRole = selectedUser.role === 'admin' ? 'user' : 'admin';
    
    try {
      // Use raw SQL to update roles
      if (newRole === 'admin') {
        // First delete any existing roles
        const { error: deleteError } = await supabase
          .rpc('has_role', { role: 'admin' });
        
        // Then insert admin role using raw SQL
        const { error: insertError } = await supabase.rpc(
          'execute_sql', 
          { sql: `INSERT INTO public.user_roles (user_id, role) VALUES ('${selectedUser.id}', 'admin')` }
        );
        
        if (insertError) throw insertError;
      } else {
        // Remove admin role using raw SQL
        const { error } = await supabase.rpc(
          'execute_sql', 
          { sql: `DELETE FROM public.user_roles WHERE user_id = '${selectedUser.id}' AND role = 'admin'` }
        );
        
        if (error) throw error;
      }
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, role: newRole } : u
      ));
      
      toast({
        title: "Role updated",
        description: `User ${selectedUser.email} is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}.`,
      });
    } catch (error) {
      console.error("Failed to update role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowConfirmDialog(false);
      setSelectedUser(null);
    }
  };

  if (!isAdmin) {
    return null; // Already handled by the redirect
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-500 mt-2">
              Manage your users and their permissions.
            </p>
          </div>
          <Button onClick={fetchUsers} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
        
        <Tabs defaultValue="all-users">
          <TabsList>
            <TabsTrigger value="all-users">All Users</TabsTrigger>
            <TabsTrigger value="admins">Administrators</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-users" className="mt-4">
            <Card>
              <div className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          {isLoading ? "Loading users..." : "No users found."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="font-medium">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : "Unnamed User"}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.role === "admin" ? (
                                <>
                                  <ShieldCheck className="h-4 w-4 text-green-500" />
                                  <span>Admin</span>
                                </>
                              ) : (
                                <>
                                  <UserCog className="h-4 w-4 text-blue-500" />
                                  <span>User</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="flex items-center space-x-2">
                                <span>Admin</span>
                                <Switch
                                  checked={user.role === "admin"}
                                  onCheckedChange={() => handleRoleToggle(user)}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="admins" className="mt-4">
            <Card>
              <div className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(u => u.role === "admin").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          {isLoading ? "Loading..." : "No admin users found."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      users
                        .filter((user) => user.role === "admin")
                        .map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell>
                              <div className="font-medium">
                                {admin.first_name && admin.last_name
                                  ? `${admin.first_name} ${admin.last_name}`
                                  : "Unnamed Admin"}
                              </div>
                            </TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <span>Admin</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="flex items-center space-x-2">
                                  <span>Admin</span>
                                  <Switch
                                    checked={true}
                                    onCheckedChange={() => handleRoleToggle(admin)}
                                  />
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.role === "admin"
                ? `Are you sure you want to remove admin privileges from ${selectedUser?.email}?`
                : `Are you sure you want to grant admin privileges to ${selectedUser?.email}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default UserManagementPage;
