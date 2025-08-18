import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';

// TODO: Move to environment variables in production
const ADMIN_PASSWORD = 'Vigyan@Assignments123';

interface AdminAuthState {
  isAdmin: boolean;
  adminPassword: string;
}

interface AdminAuthActions {
  setAdminPassword: (password: string) => void;
  handleAdminLogin: () => void;
  handleAdminLogout: () => void;
  closeAdminDialog: () => void;
}

interface AdminAuthReturn extends AdminAuthState, AdminAuthActions {}

/**
 * Custom hook for managing admin authentication state and actions
 * 
 * This hook provides functionality for:
 * - Managing admin login/logout state
 * - Handling password validation
 * - Providing user feedback via toast notifications
 * 
 * @returns {AdminAuthReturn} Object containing admin state and action functions
 * 
 * @example
 * ```tsx
 * const { isAdmin, adminPassword, setAdminPassword, handleAdminLogin } = useAdminAuth();
 * 
 * // Check if user is admin
 * if (isAdmin) {
 *   // Show admin features
 * }
 * 
 * // Handle login
 * const handleLogin = () => {
 *   setAdminPassword('user-input-password');
 *   handleAdminLogin();
 * };
 * ```
 */
export const useAdminAuth = (): AdminAuthReturn => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const { toast } = useToast();

  /**
   * Validates the admin password and updates authentication state
   * 
   * Compares the current adminPassword against the hardcoded ADMIN_PASSWORD.
   * If valid, sets isAdmin to true and shows success toast.
   * If invalid, shows error toast and clears the password field.
   */
  const handleAdminLogin = async (): Promise<void> => {
    if (adminPassword === ADMIN_PASSWORD) {
      try {
        // Sign in to Supabase as admin
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'vigyanshaala@gmail.com',
          password: 'Vigyan@Assignments123'
        });
        
        if (data.user) {
          setIsAdmin(true);
          setAdminPassword('');
          toast({
            title: "Admin Access Granted",
            description: "You now have access to admin features.",
            variant: "default"
          });
        } else {
          toast({
            title: "Access Denied",
            description: "Failed to authenticate with database.",
            variant: "destructive"
          });
          setAdminPassword('');
        }
      } catch (error) {
        toast({
          title: "Access Denied",
          description: "Failed to authenticate with database.",
          variant: "destructive"
        });
        setAdminPassword('');
      }
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive"
      });
      setAdminPassword('');
    }
  };

  /**
   * Logs out the admin user and resets authentication state
   * 
   * Sets isAdmin to false and shows logout confirmation toast.
   */
  const handleAdminLogout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    toast({
      title: "Logged Out",
      description: "You have been logged out of admin mode.",
      variant: "default"
    });
  };

  /**
   * Closes the admin dialog by clearing the password field
   * 
   * Used when the admin login dialog is closed without attempting login.
   */
  const closeAdminDialog = (): void => {
    setAdminPassword('');
  };

  return {
    isAdmin,
    adminPassword,
    setAdminPassword,
    handleAdminLogin,
    handleAdminLogout,
    closeAdminDialog
  };
}; 