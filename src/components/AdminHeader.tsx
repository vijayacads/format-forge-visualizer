import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminHeaderProps {
  isAdmin: boolean;
  adminPassword: string;
  setAdminPassword: (password: string) => void;
  handleAdminLogin: () => void;
  handleAdminLogout: () => void;
  closeAdminDialog: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  isAdmin,
  adminPassword,
  setAdminPassword,
  handleAdminLogin,
  handleAdminLogout,
  closeAdminDialog
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      {isAdmin ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-sm text-green-600 font-medium">Admin Mode</span>
          <Button variant="outline" size="sm" onClick={handleAdminLogout}>
            Logout
          </Button>
        </div>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              Admin
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Admin Access</AlertDialogTitle>
              <AlertDialogDescription>
                Please enter the admin password to access admin features.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="adminPassword">Password</Label>
              <Input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="Enter admin password"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeAdminDialog}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAdminLogin}>Login</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default AdminHeader; 