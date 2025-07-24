export type ITone =
  | 'Style'
  | 'Expert'
  | 'Humorous'
  | 'Motivational'
  | 'Customized';

export interface ProfileData {
  account_name?: string;
  tone?: ITone;
  tweet_examples?: string[];
  bio?: string;
  lastUpdated?: number;
}

const PROFILE_STORAGE_KEY = 'influflow_profile_data';

export const saveProfileToLocalStorage = (profileData: ProfileData): void => {
  try {
    const dataWithTimestamp = {
      ...profileData,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(dataWithTimestamp),
    );
  } catch (error) {
    console.error('Failed to save profile data to localStorage:', error);
  }
};

export const loadProfileFromLocalStorage = (): ProfileData | null => {
  try {
    const storedData = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
    return null;
  } catch (error) {
    console.error('Failed to load profile data from localStorage:', error);
    return null;
  }
};

export const clearProfileFromLocalStorage = (): void => {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear profile data from localStorage:', error);
  }
};

export const getProfileDataForSync = (): ProfileData | null => {
  const data = loadProfileFromLocalStorage();
  if (!data) return null;

  // 返回不包含 lastUpdated 的数据，用于同步到服务器
  const { lastUpdated, ...profileData } = data;
  return profileData;
};

export const hasProfileData = (): boolean => {
  const data = loadProfileFromLocalStorage();
  return (
    data !== null &&
    (!!data.bio ||
      !!data.tone ||
      !!(data.tweet_examples && data.tweet_examples.length > 0))
  );
};

export const getLastUpdatedTime = (): number | null => {
  const data = loadProfileFromLocalStorage();
  return data?.lastUpdated || null;
};

export const needsProfileCompletion = (user: any): boolean => {
  // 检查 authStore 中的用户数据
  const hasAuthStoreData = !!(
    user?.bio ||
    user?.tone ||
    (user?.tweet_examples && user.tweet_examples.length > 0)
  );

  // 检查 localStorage 中的数据
  const hasLocalStorageData = hasProfileData();

  // 如果两者都没有数据，则需要完善 profile
  return !hasAuthStoreData && !hasLocalStorageData;
};

// 用于记录用户是否已经看过并关闭了提示
const PROMPT_DISMISSED_KEY = 'influflow_profile_prompt_dismissed';

export const setPromptDismissed = (): void => {
  try {
    localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to set prompt dismissed flag:', error);
  }
};

export const isPromptDismissed = (): boolean => {
  try {
    const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (!dismissed) return false;

    // 如果超过30分钟，重新显示提示
    const dismissedTime = parseInt(dismissed);
    const sevenDaysAgo = Date.now() - 30 * 60 * 1000;

    return dismissedTime > sevenDaysAgo;
  } catch (error) {
    console.error('Failed to check prompt dismissed flag:', error);
    return false;
  }
};
