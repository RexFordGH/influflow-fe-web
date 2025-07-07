'use client';

import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button, Input, Textarea } from '@heroui/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/stores/authStore';
import {
  loadProfileFromLocalStorage,
  saveProfileToLocalStorage,
} from '@/utils/profileStorage';
import { addToast } from '../base/toast';

type StyleType = 'Professional' | 'Humorous' | 'Inspirational' | 'Customize';

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage = ({ onBack }: ProfilePageProps) => {
  const { user, updateUser } = useAuthStore();
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('Professional');
  const [customLinks, setCustomLinks] = useState([
    'https://x.com/influxy.ai...',
    'https://x.com/influxy.ai...',
    '',
  ]);
  const [personalIntro, setPersonalIntro] = useState(user?.bio || '');

  // 从 authStore 和 localStorage 加载数据
  useEffect(() => {
    // 优先从 authStore 加载数据
    if (user?.style || user?.customLinks?.length || user?.bio) {
      if (user.style) {
        setSelectedStyle(user.style);
      } else if (user.customLinks && user.customLinks.length > 0) {
        setSelectedStyle('Customize');
        setCustomLinks([...user.customLinks, '', ''].slice(0, 3));
      }

      if (user.bio) {
        setPersonalIntro(user.bio);
      }
    } else {
      // 如果 authStore 没有数据，从 localStorage 加载
      const savedProfile = loadProfileFromLocalStorage();
      if (savedProfile) {
        // 恢复风格选择
        if (savedProfile.style) {
          setSelectedStyle(savedProfile.style);
        } else if (
          savedProfile.customLinks &&
          savedProfile.customLinks.length > 0
        ) {
          setSelectedStyle('Customize');
          setCustomLinks([...savedProfile.customLinks, '', ''].slice(0, 3));
        }

        // 恢复个人介绍
        if (savedProfile.bio) {
          setPersonalIntro(savedProfile.bio);
        }

        // 同步到 authStore
        updateUser({
          bio: savedProfile.bio,
          style: savedProfile.style,
          customLinks: savedProfile.customLinks,
        });
      }
    }
  }, [user, updateUser]);

  const handleSubmit = () => {
    // 准备要保存的数据
    const profileData = {
      bio: personalIntro,
      style: selectedStyle === 'Customize' ? undefined : selectedStyle,
      customLinks:
        selectedStyle === 'Customize'
          ? customLinks.filter((link) => link.trim() !== '')
          : [],
    };

    // 1. 保存到 localStorage
    saveProfileToLocalStorage(profileData);

    // 2. 更新 authStore
    const updateData: any = {
      bio: personalIntro,
    };

    if (selectedStyle === 'Customize') {
      updateData.customLinks = customLinks.filter((link) => link.trim() !== '');
      updateData.style = undefined; // 使用自定义链接时不设置预设风格
    } else {
      updateData.style = selectedStyle;
      updateData.customLinks = []; // 使用预设风格时清空自定义链接
    }

    updateUser(updateData);

    // 显示保存成功提示（可选）
    console.log(
      'Profile data saved successfully to localStorage and authStore',
    );

    addToast({
      title: 'Profile data saved successfully',
      description:
        'Profile data saved successfully to localStorage and authStore',
      color: 'success',
    });

    onBack();
  };

  const handleStyleSelect = (style: StyleType) => {
    setSelectedStyle(style);
    // 如果不是 Customize，清空自定义链接
    if (style !== 'Customize') {
      setCustomLinks(['', '', '']);
    } else {
      // 如果是 Customize，设置默认链接
      setCustomLinks(['https://x.com/influxy.ai...', '', '']);
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
      <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6 z-10">
        <div className="flex items-center space-x-4">
          <Button
            variant="light"
            onPress={onBack}
            className="text-gray-600"
            startContent={<ChevronLeftIcon className="size-4" />}
          >
            Back
          </Button>
          {/* <h1 className="text-2xl font-semibold text-gray-900">个人设置</h1> */}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl p-12">
        {/* Style Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Style</h2>
          <p className="text-gray-500 mb-6">
            Choose a tone for your content, or paste links to match a custom
            style.
          </p>

          {/* Style Options */}
          <div className="flex gap-4 mb-6">
            {(
              [
                'Professional',
                'Humorous',
                'Inspirational',
                'Customize',
              ] as StyleType[]
            ).map((style) => (
              <Button
                key={style}
                variant="bordered"
                className={`px-6 py-3 border-1 rounded-[12px] ${
                  selectedStyle === style
                    ? 'bg-[#DDE9FF] border-[#448AFF]  text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                } ${style === 'Customize' ? 'underline' : ''}`}
                onPress={() => handleStyleSelect(style)}
              >
                {style}
              </Button>
            ))}
          </div>

          {/* Custom Style Links - 只在选择 Customize 时显示 */}
          {selectedStyle === 'Customize' && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Examples of Customized Style
              </h3>
              <p className="text-gray-500 mb-4">
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Personal Introduction
          </h2>
          <p className="text-gray-500 mb-6">
            Introduce yourself in 100-300 words, using a first-person tone. This
            will help personalize your future content.
          </p>
          <Textarea
            value={personalIntro}
            onChange={(e) => handleIntroChange(e.target.value)}
            placeholder="Introduce yourself..."
            rows={8}
            className="w-full"
            variant="bordered"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button
            onPress={handleSubmit}
            className="bg-black text-white px-8 py-3 rounded-full font-medium"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
