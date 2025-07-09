'use client';

import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button, Input, Textarea } from '@heroui/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/stores/authStore';
import {
  ITone,
  loadProfileFromLocalStorage,
  saveProfileToLocalStorage,
} from '@/utils/profileStorage';
import { debugSupabaseAuth } from '@/utils/supabaseDebug';
import {
  loadProfileFromSupabase,
  saveProfileToSupabase,
} from '@/utils/supabaseProfile';

import { addToast } from '../base/toast';

const STYLE_OPTIONS = [
  {
    value: 'Expert',
    label: 'Professional',
  },
  {
    value: 'Humorous',
    label: 'Humorous',
  },
  {
    value: 'Motivational',
    label: 'Inspirational',
  },
  {
    value: 'Customized',
    label: 'Customize',
  },
] as const;

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage = ({ onBack }: ProfilePageProps) => {
  const { user, updateUser } = useAuthStore();
  const [selectedStyle, setSelectedStyle] = useState<ITone | null>(null);
  const [customLinks, setCustomLinks] = useState([
    'https://x.com/influxy.ai...',
    'https://x.com/influxy.ai...',
    '',
  ]);
  const [personalIntro, setPersonalIntro] = useState(user?.bio || '');
  const [accountName, setAccountName] = useState(
    user?.account_name || user?.name || '',
  );
  const [isLoading, setIsLoading] = useState(false);

  // 从 authStore、localStorage 和 Supabase 加载数据
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);

      try {
        // 1. 优先从 authStore 加载数据
        if (
          user?.tone ||
          user?.tweet_examples?.length ||
          user?.bio ||
          user?.account_name
        ) {
          if (user.tone) {
            setSelectedStyle(user.tone);
          } else if (user.tweet_examples && user.tweet_examples.length > 0) {
            setSelectedStyle('Customized');
            setCustomLinks([...user.tweet_examples, '', ''].slice(0, 3));
          }

          if (user.bio) {
            setPersonalIntro(user.bio);
          }

          if (user.account_name) {
            setAccountName(user.account_name);
          }
        } else {
          // 2. 从 localStorage 加载
          const savedProfile = loadProfileFromLocalStorage();
          if (savedProfile) {
            if (savedProfile.tone) {
              setSelectedStyle(savedProfile.tone);
            } else if (
              savedProfile.tweet_examples &&
              savedProfile.tweet_examples.length > 0
            ) {
              setSelectedStyle('Customized');
              setCustomLinks(
                [...savedProfile.tweet_examples, '', ''].slice(0, 3),
              );
            }

            if (savedProfile.bio) {
              setPersonalIntro(savedProfile.bio);
            }

            if (savedProfile.account_name) {
              setAccountName(savedProfile.account_name);
            }
          }

          // 3. 从 Supabase 加载最新数据
          const { data: supabaseProfile, error } =
            await loadProfileFromSupabase();
          if (supabaseProfile && !error) {
            if (supabaseProfile.tone) {
              setSelectedStyle(supabaseProfile.tone);
            } else if (
              supabaseProfile.tweet_examples &&
              supabaseProfile.tweet_examples.length > 0
            ) {
              setSelectedStyle('Customized');
              setCustomLinks(
                [...supabaseProfile.tweet_examples, '', ''].slice(0, 3),
              );
            }

            if (supabaseProfile.bio) {
              setPersonalIntro(supabaseProfile.bio);
            }

            if (supabaseProfile.account_name) {
              setAccountName(supabaseProfile.account_name);
            }

            // 更新 authStore 和 localStorage
            updateUser({
              bio: supabaseProfile.bio,
              tone: supabaseProfile.tone,
              tweet_examples: supabaseProfile.tweet_examples,
              account_name: supabaseProfile.account_name,
            });

            saveProfileToLocalStorage(supabaseProfile);
          }
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user, updateUser]);

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // 调试认证状态
      await debugSupabaseAuth();

      // 准备要保存的数据
      const profileData = {
        account_name: accountName,
        bio: personalIntro,
        tone:
          selectedStyle === 'Customized' || selectedStyle === null
            ? undefined
            : selectedStyle,
        tweet_examples:
          selectedStyle === 'Customized'
            ? customLinks.filter((link) => link.trim() !== '')
            : [],
      };

      console.log('Submitting profile data:', profileData);

      // 1. 保存到 Supabase
      const { success, error } = await saveProfileToSupabase(profileData);

      if (!success) {
        console.error('Supabase save failed:', error);
        throw new Error(error || 'Failed to save to Supabase');
      }

      // 2. 保存到 localStorage
      saveProfileToLocalStorage(profileData);

      // 3. 更新 authStore
      const updateData: any = {
        bio: personalIntro,
        account_name: accountName,
      };

      if (selectedStyle === 'Customized') {
        updateData.tweet_examples = customLinks.filter(
          (link) => link.trim() !== '',
        );
        updateData.tone = undefined;
      } else if (selectedStyle === null) {
        updateData.tone = undefined;
        updateData.tweet_examples = [];
      } else {
        updateData.tone = selectedStyle;
        updateData.tweet_examples = [];
      }

      updateUser(updateData);

      addToast({
        title: 'Saved Successfully',
        color: 'success',
      });

      // onBack();
    } catch (error) {
      console.error('Failed to save profile:', error);
      addToast({
        title: 'Failed to save',
        color: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStyleSelect = (style: ITone) => {
    // 如果已经选中了这个风格，则取消选择
    if (selectedStyle === style) {
      setSelectedStyle(null);
      setCustomLinks(['', '', '']);
    } else {
      setSelectedStyle(style);
      // 如果不是 Customized，清空自定义链接
      if (style !== 'Customized') {
        setCustomLinks(['', '', '']);
      } else {
        // 如果是 Customized，设置默认链接
        setCustomLinks(['https://x.com/influxy.ai...', '', '']);
      }
    }
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...customLinks];
    newLinks[index] = value;
    setCustomLinks(newLinks);
  };

  const handleIntroChange = (value: string) => {
    setPersonalIntro(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-screen overflow-y-auto bg-white"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-[24px] py-[6px]">
        <div className="flex items-center space-x-4">
          <Button
            size="sm"
            variant="light"
            onPress={onBack}
            className="text-gray-600"
            startContent={<ChevronLeftIcon className="size-4" />}
          >
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl p-12">
        {/* Style Section */}
        <div className="mb-10">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">Style</h2>
          <p className="mb-6 text-gray-500">
            Choose a tone for your content, or paste links to match a custom
            style.
          </p>

          {/* Style Options */}
          <div className="mb-6 flex gap-4">
            {STYLE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="bordered"
                className={`border-1 rounded-[12px] px-6 py-3 ${
                  selectedStyle === option.value
                    ? 'border-[#448AFF] bg-[#DDE9FF]  text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                } ${option.value === 'Customized' ? 'underline' : ''}`}
                onPress={() => handleStyleSelect(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Custom Style Links - 只在选择 Customized 时显示 */}
          {selectedStyle === 'Customized' && (
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Examples of Customized Style
              </h3>
              <p className="mb-4 text-gray-500">
                Paste the link to the posts you'd like to use as style
                references.
              </p>
              <div className="space-y-3">
                {customLinks.map((link, index) => (
                  <Input
                    key={index}
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    placeholder="https://x.com/influxy.ai..."
                    variant="bordered"
                    className="w-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Personal Introduction Section */}
        <div className="mb-10">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            Personal Introduction
          </h2>
          <p className="mb-6 text-gray-500">
            Introduce yourself in 100-300 words, using a first-person tone. This
            will help personalize your future content.
          </p>
          <Textarea
            value={personalIntro}
            onChange={(e) => handleIntroChange(e.target.value)}
            placeholder={`Example: I’m a serial entrepreneur, currently focused on building AI tools for content creators. Previously, I worked as a product manager at several major tech companies and spent time in VC doing early-stage investments. Later, I founded a project at the intersection of crypto and AI, which grew to over 7 million users. Now, I’m building an AI product designed to help creators save time and grow their influence. My account is positioned to share insights on AI trends, real-world startup lessons, and practical ways to use AI for efficient content creation and personal branding. My content style is honest and practical, aimed at entrepreneurs, AI enthusiasts, and anyone looking to leverage AI to boost their content game.`}
            rows={10}
            className="min-h-[260px] w-full"
            variant="bordered"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button
            onPress={handleSubmit}
            isLoading={isLoading}
            className="rounded-full bg-black px-8 py-3 font-medium text-white"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
