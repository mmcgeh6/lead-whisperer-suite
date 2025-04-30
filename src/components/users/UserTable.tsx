
import { UserWithRole } from "@/types/userManagement";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, UserCog } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserTableProps {
  users: UserWithRole[];
  isLoading: boolean;
  onRoleToggle: (user: UserWithRole) => void;
  showAdminsOnly?: boolean;
}

export const UserTable = ({ 
  users, 
  isLoading, 
  onRoleToggle,
  showAdminsOnly = false 
}: UserTableProps) => {
  const displayUsers = showAdminsOnly 
    ? users.filter(user => user.role === "admin")
    : users;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          {!showAdminsOnly && <TableHead>Created</TableHead>}
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayUsers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showAdminsOnly ? 4 : 5} className="text-center">
              {isLoading ? (showAdminsOnly ? "Loading..." : "Loading users...") : (showAdminsOnly ? "No admin users found." : "No users found.")}
            </TableCell>
          </TableRow>
        ) : (
          displayUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="font-medium">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : "Unnamed User"}
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              {!showAdminsOnly && (
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
              )}
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
                      onCheckedChange={() => onRoleToggle(user)}
                    />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
