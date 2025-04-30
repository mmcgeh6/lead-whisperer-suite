
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTable } from "@/components/users/UserTable";
import { RoleConfirmationDialog } from "@/components/users/RoleConfirmationDialog";
import { fetchUsers, updateUserRole } from "@/services/userService";
import { UserWithRole } from "@/types/userManagement";

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
  const handleFetchUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await fetchUsers();
      setUsers(usersData);
    } catch (error) {
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
      handleFetchUsers();
    }
  }, [isAdmin]);

  const handleRoleToggle = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowConfirmDialog(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;
    
    const newRole = selectedUser.role === 'admin' ? 'user' : 'admin';
    
    try {
      await updateUserRole(selectedUser.id, newRole);
      
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
          <Button onClick={handleFetchUsers} disabled={isLoading}>
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
                <UserTable 
                  users={users}
                  isLoading={isLoading}
                  onRoleToggle={handleRoleToggle}
                />
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="admins" className="mt-4">
            <Card>
              <div className="p-6">
                <UserTable 
                  users={users}
                  isLoading={isLoading}
                  onRoleToggle={handleRoleToggle}
                  showAdminsOnly={true}
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <RoleConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        selectedUser={selectedUser}
        onConfirm={confirmRoleChange}
      />
    </Layout>
  );
};

export default UserManagementPage;
