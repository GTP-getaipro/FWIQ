import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';

const ProfileCreationHelper = () => {
  const { user, createProfileManually } = useAuth();

  const handleCreateProfile = async () => {
    console.log('🔧 Manual profile creation triggered');
    const result = await createProfileManually();
    console.log('📊 Profile creation result:', result);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">
        Profile Creation Helper
      </h3>
      <p className="text-sm text-yellow-700 mb-3">
        If your profile wasn't created automatically, you can try creating it manually.
      </p>
      <Button 
        onClick={handleCreateProfile}
        variant="outline"
        size="sm"
        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
      >
        Create Profile Manually
      </Button>
    </div>
  );
};

export default ProfileCreationHelper;
