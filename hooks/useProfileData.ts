import { useEffect, useState } from 'react';

import { useAuthStore } from '@/stores/authStore';
import { hasProfileData, loadProfileFromLocalStorage, type ProfileData } from '@/utils/profileStorage';

export const useProfileData = () => {
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      
      // 优先从 authStore 获取数据
      if (user?.bio || user?.style || user?.customLinks?.length) {
        setProfileData({
          bio: user.bio,
          style: user.style,
          customLinks: user.customLinks,
        });
      } else {
        // 从 localStorage 获取数据
        const savedData = loadProfileFromLocalStorage();
        setProfileData(savedData);
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const hasData = () => {
    return hasProfileData() || !!(user?.bio || user?.style || user?.customLinks?.length);
  };

  const getStyle = () => {
    return profileData?.style || user?.style;
  };

  const getBio = () => {
    return profileData?.bio || user?.bio;
  };

  const getCustomLinks = () => {
    return profileData?.customLinks || user?.customLinks || [];
  };

  return {
    profileData,
    isLoading,
    hasData: hasData(),
    getStyle,
    getBio,
    getCustomLinks,
  };
};