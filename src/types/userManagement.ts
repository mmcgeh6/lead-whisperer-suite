
import { UserRole } from "@/context/AuthContext";

export interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
}
