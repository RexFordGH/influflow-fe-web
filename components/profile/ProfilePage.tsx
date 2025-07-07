'use client';

import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button, Input, Textarea } from '@heroui/react';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { useAuthStore } from '@/stores/authStore';

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
  const [personalIntro, setPersonalIntro] = useState(
    user?.bio ||
      "I'm building at the intersection of AI, product design, and internet culture. Currently founder of an AI startup turning cutting-edge models into real-world tools that empower creators and entrepreneurs. Previously led design and strategy at fast-growing startups, with a background in cognitive science and human-centered design. I tweet about AI trends, product thinking, founder life, and the weird/funny/chaotic side of the internet. Always exploring what's next. If you're into building, thinking, or just vibing with the future—welcome.",
  );

  const handleSubmit = () => {
    // 更新用户信息
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="relative mx-4 w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6 z-10">
          <div className="flex items-center space-x-4">
            <Button
              variant="light"
              onPress={onBack}
              className="text-gray-600"
              startContent={<ChevronLeftIcon className="size-4" />}
            >
              返回
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">个人设置</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-12">
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
              Introduce yourself in 100-300 words, using a first-person tone.
              This will help personalize your future content.
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
      </div>
    </motion.div>
  );
};
