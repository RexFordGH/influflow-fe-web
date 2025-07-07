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
      if (user?.bio || user?.tone || user?.tweet_examples?.length || user?.account_name) {
        setProfileData({
          bio: user.bio,
          tone: user.tone,
          tweet_examples: user.tweet_examples,
          account_name: user.account_name,
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
    return hasProfileData() || !!(user?.bio || user?.tone || user?.tweet_examples?.length || user?.account_name);
  };

  const getTone = () => {
    return profileData?.tone || user?.tone;
  };

  const getBio = () => {
    return profileData?.bio || user?.bio;
  };

  const getTweetExamples = () => {
    return profileData?.tweet_examples || user?.tweet_examples || [];
  };
  
  const getAccountName = () => {
    return profileData?.account_name || user?.account_name;
  };

  return {
    profileData,
    isLoading,
    hasData: hasData(),
    getTone,
    getBio,
    getTweetExamples,
    getAccountName,
  };
};