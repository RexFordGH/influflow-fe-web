'use client';

import {
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/base';
import { useTopicTypes, useTrendingTopics } from '@/lib/api/services';
import {
  type ITrendingTopic,
  type ITrendsRecommendTweet,
} from '@/types/api';

import { SearchModal } from './SearchModal';
import {
  NewTrendingTopicTweets,
  TrendingTopicTweets,
} from './TrendingTopicTweets';

interface TrendingTopicsProps {
  isVisible: boolean;
  onBack: () => void;
  // onTopicSelect: (topic: ITrendingTopic | ISuggestedTopic) => void;
  onTopicSelect: (topic: ITrendingTopic | string) => void;
  onTweetsSelect?: (selectedTweets: any[], topicTitle: string) => void;
  onSearchConfirm?: (
    searchTerm: string,
    selectedTweets: ITrendsRecommendTweet[],
  ) => void;
  hasCompletedOnboarding?: boolean | null;
}

const TrendingTopicSkeleton = ({ index }: { index: number }) => (
  <div
    className="flex items-center justify-between rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-100 px-6 py-1"
    style={{
      width: `${Math.max(432, 880 - index * 0)}px`,
    }}
  >
    <Skeleton className="h-[18px] w-20 rounded bg-yellow-200" />
    <Skeleton className="h-[18px] w-8 rounded bg-yellow-200" />
  </div>
);

const NewTrendingTopicSkeleton = ({ index }: { index: number }) => (
  <div
    id={index === 0 ? 'trending-topics' : ''}
    className="
    group relative flex cursor-pointer items-center
    rounded-[20px] px-12 py-1 transition-colors duration-150
  "
    style={{
      width: `880px`,
      height: '171px',
      background: `
        linear-gradient(to right, #F2F7FF4D 0%, #F2F7FF4D 80%, #F2F7FC 100%),
        linear-gradient(to bottom, #F2F7FF4D 0%, #F2F7FF4D 90%, #F2F7FC 100%)
      `,
      backgroundBlendMode: 'overlay',
      backgroundClip: 'padding-box',
    }}
  >
    <Skeleton className="h-[32px] w-[30px] rounded bg-[#F2F7FF]" />

    <div className="ml-[48px] flex flex-col justify-center">
      <Skeleton className="mb-[16px] h-[27px] w-[284px] rounded bg-[#F2F7FF]" />
      <Skeleton className="h-[84px] w-[684px] rounded bg-[#F2F7FF]" />
    </div>
  </div>
);

const SuggestedTopicSkeleton = () => (
  <div className="rounded-xl border border-gray-300 px-[24px] py-[10px]">
    <Skeleton className="mb-2 h-[18px] w-full rounded" />
  </div>
);

// Trending Topic Item 组件（带点击功能）
const TrendingTopicItem = ({
  id,
  topic,
  index,
  isOpen,
  onToggle,
  onTweetsSelect,
}: {
  id: string;
  topic: any;
  index: number;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  onTweetsSelect?: (selectedTweets: any[], topicTitle: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    // 传递布尔值来控制展开/收起状态
    onToggle(!isOpen);
  };

  return (
    <div>
      {/* <CopyToClipboard text={topic.title}> */}
      <div className="flex items-start justify-start gap-[16px]">
        <span className="pt-[6px] text-[18px] font-[500] text-[#8C8C8C]">
          #{index + 1}
        </span>

        <button
          onClick={handleToggle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative flex cursor-pointer items-center justify-between rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-200 px-6 py-1 transition-colors duration-150 hover:from-yellow-500 hover:to-yellow-300"
          style={{
            width: `${Math.max(432, 880 - index * 0)}px`,
          }}
        >
          <span className="text-left text-lg font-medium text-black">
            {topic.title}
          </span>
          {/* 显示展开/收起图标 */}
          <div className="flex items-center gap-[10px]">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                x: isHovered ? 0 : -10,
              }}
              transition={{ duration: 0.2 }}
              className="text-gray-600"
            >
              {isOpen ? (
                <ChevronDownIcon className="size-5" />
              ) : (
                <ChevronRightIcon className="size-5" />
              )}
            </motion.div>
          </div>
        </button>
      </div>
      {/* </CopyToClipboard> */}

      {/* Trending Topic Tweets 展开区域 */}
      <motion.div
        id="viral-tweets"
        className="mt-3"
        initial={false}
        animate={{
          opacity: isOpen ? 1 : 0,
          height: isOpen ? 'auto' : 0,
          display: isOpen ? 'block' : 'none',
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        style={{ overflow: 'hidden' }}
      >
        <TrendingTopicTweets
          isVisible={isOpen}
          id={id}
          onConfirm={(selectedTweets) => {
            onTweetsSelect?.(selectedTweets, topic.title);
          }}
        />
      </motion.div>
    </div>
  );
};

const NewTrendingTopicItem = ({
  id,
  topic,
  index,
  isOpen,
  onTopicSelect,
  onToggle,
  onTweetsSelect,
}: {
  id: string;
  topic: any;
  index: number;
  isOpen: boolean;
  onTopicSelect: (topic: ITrendingTopic | string) => void;
  onToggle: (isOpen: boolean) => void;
  onTweetsSelect?: (selectedTweets: any[], topicTitle: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    // 传递布尔值来控制展开/收起状态
    onToggle(!isOpen);
  };

  // 当 Toggle 被展开时，isHovered 也应该被触发
  const shouldShowHoveredState = isHovered || isOpen;

  return (
    <div id={isOpen ? '' : 'trending-topics'}>
      {/* <CopyToClipboard text={topic.title}> */}
      <div className="flex items-start justify-start gap-[16px]">
        {/* <span className="pt-[6px] text-[18px] font-[500] text-[#8C8C8C]">
          #{index + 1}
        </span> */}

        <button
          onClick={handleToggle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            group relative flex cursor-pointer items-center
            rounded-[20px] bg-clip-padding py-3 pl-12 pr-3 transition-colors
            duration-150
            ${
              shouldShowHoveredState
                ? '[background-image:linear-gradient(to_right,rgba(115,167,255,0.2)_90%,rgba(115,167,255,0.2)_100%)]'
                : '[background-blend-mode:overlay] [background-image:linear-gradient(to_right,#F2F7FF4D_0%,#F2F7FF4D_80%,#F2F7FC_100%),linear-gradient(to_bottom,#F2F7FF4D_0%,#F2F7FF4D_90%,#F2F7FC_100%)]'
            }
            [background-position:0_0,_0_0]
            [background-repeat:no-repeat,_no-repeat]
            [background-size:100%_100%,_100%_100%]
          `}
          style={{ width: '100vw', height: '171px' }}
        >
          <p className="text-left text-lg font-medium text-black">
            #{index + 1}
          </p>
          <div className="ml-[48px] flex min-w-0 flex-col items-start text-left">
            <span className="mb-[12px] block text-[18px] font-medium leading-[26px]">
              {topic.title}
            </span>
            <span className="block w-[684px] text-[14px] leading-[22px] text-[#575757]">
              {topic.description}
            </span>
          </div>

          {/* 显示展开/收起图标 */}
          <div className="absolute right-0 flex items-center gap-[10px] pr-[24px]">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: shouldShowHoveredState ? 1 : 0,
                x: shouldShowHoveredState ? 0 : -10,
              }}
              transition={{ duration: 0.2 }}
              className="text-gray-600"
            >
              {isOpen ? (
                <ChevronDownIcon className="size-5" />
              ) : (
                <ChevronRightIcon className="size-5" />
              )}
            </motion.div>
          </div>
        </button>
      </div>
      {/* </CopyToClipboard> */}

      {/* Trending Topic Tweets 展开区域 */}
      <motion.div
        className="mt-4"
        initial={false}
        animate={{
          opacity: isOpen ? 1 : 0,
          height: isOpen ? 'auto' : 0,
          display: isOpen ? 'block' : 'none',
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        style={{ overflow: 'hidden' }}
      >
        <NewTrendingTopicTweets
          isVisible={isOpen}
          id={id}
          suggested={topic.suggested}
          onTopicSelect={onTopicSelect}
          onConfirm={(selectedTweets) => {
            onTweetsSelect?.(selectedTweets, topic.title);
          }}
        />
      </motion.div>
    </div>
  );
};

// export function TrendingTopicsPage({
//   isVisible,
//   onBack: _onBack,
//   onTopicSelect,
//   onTweetsSelect,
//   onSearchConfirm,
//   hasCompletedOnboarding,
// }: TrendingTopicsProps) {
//   const [selectedCategory, setSelectedCategory] = useState('ai');
//   const [expandedTopicIndex, setExpandedTopicIndex] = useState<number | null>(
//     null, // 改为null，让useEffect来控制初始状态
//   );
//   const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchWidgetsLoaded, setSearchWidgetsLoaded] = useState<
//     Record<string, boolean>
//   >({});
//   // 添加状态来跟踪用户是否主动关闭过第一条话题
//   const [hasUserCollapsedFirst, setHasUserCollapsedFirst] = useState(false);

//   const { data: topicTypes } = useTopicTypes();

//   const {
//     data: trendingData,
//     isLoading,
//     error,
//   } = useTrendingTopics(selectedCategory);

//   const trendingTopics = trendingData?.trending_topics || [];
//   // const suggestedTopics = trendingData?.suggested_topics || [];

//   // 分类列表：显示可用的话题类型
//   const categories = topicTypes?.map((type: { id: string; label: string }) => ({
//     id: type.id,
//     label: type.label,
//   }));

//   // 手动展开特定话题
//   const expandTopic = (index: number) => {
//     setExpandedTopicIndex(index);
//   };

//   // 手动收起特定话题
//   const collapseTopic = (index: number) => {
//     if (expandedTopicIndex === index) {
//       setExpandedTopicIndex(null);
//       // 如果收起的是第一条话题，标记用户主动关闭
//       if (index === 0) {
//         setHasUserCollapsedFirst(true);
//       }
//     }
//   };

//   // 处理话题展开/收起的逻辑，使用布尔值控制
//   const handleTopicToggle = (index: number, isOpen: boolean) => {
//     if (expandedTopicIndex === index) {
//       // 如果当前点击的是已展开的条目，则收起
//       setExpandedTopicIndex(null);
//       // 如果收起的是第一条话题，标记用户主动关闭
//       if (index === 0) {
//         setHasUserCollapsedFirst(true);
//       }
//     } else {
//       // 如果当前点击的是未展开的条目，则展开它
//       setExpandedTopicIndex(index);
//       // 如果展开的是第一条话题，清除用户主动关闭的标记
//       if (index === 0) {
//         setHasUserCollapsedFirst(false);
//       }
//     }
//   };

//   // 根据 onboarding 状态决定是否展开第0个话题
//   useEffect(() => {
//     if (hasCompletedOnboarding === null) return; // 等待初始化完成

//     if (hasCompletedOnboarding) {
//       expandTopic(0);
//       // 重置用户主动关闭的标记
//       setHasUserCollapsedFirst(false);
//     } else {
//       collapseTopic(0);
//     }
//   }, [hasCompletedOnboarding]);

//   // 当数据加载完成且已完成onboarding时，确保第一条默认展开（但只在用户没有主动关闭过的情况下）
//   useEffect(() => {
//     if (
//       hasCompletedOnboarding === true &&
//       trendingTopics.length > 0 &&
//       expandedTopicIndex === null &&
//       !hasUserCollapsedFirst
//     ) {
//       setExpandedTopicIndex(0);
//     }
//   }, [
//     hasCompletedOnboarding,
//     trendingTopics.length,
//     expandedTopicIndex,
//     hasUserCollapsedFirst,
//   ]);

//   // 优化回调函数
//   const handleSearchModalClose = useCallback(() => {
//     setIsSearchModalOpen(false);
//   }, []);

//   const handleSearchConfirm = useCallback(
//     (searchTerm: string, selectedTweets: ITrendsRecommendTweet[]) => {
//       onSearchConfirm?.(searchTerm, selectedTweets);
//       setIsSearchModalOpen(false);
//     },
//     [onSearchConfirm],
//   );

//   const handleSearchTermChange = useCallback((term: string) => {
//     setSearchTerm(term);
//   }, []);

//   const handleWidgetsLoadedChange = useCallback(
//     (term: string, loaded: boolean) => {
//       setSearchWidgetsLoaded((prev) => ({
//         ...prev,
//         [term]: loaded,
//       }));
//     },
//     [],
//   );

//   return (
//     <div className="size-full overflow-y-auto bg-white">
//       <div className="flex min-h-full flex-col">
//         <div className="flex-1 px-[30px] py-14">
//           <div className="mx-auto w-full max-w-4xl">
//             <div id="trending-topics" className="mb-10">
//               <div className="flex items-center justify-between">
//                 <h2 className="mb-4 text-lg font-medium text-black">
//                   Trending Topics
//                 </h2>
//                 <button
//                   onClick={() => setIsSearchModalOpen(true)}
//                   className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-50 "
//                 >
//                   <MagnifyingGlassIcon className="size-4" />
//                   <span>Search</span>
//                 </button>
//               </div>

//               {/* type */}
//               <div id="trending-topics-type" className="mb-4 flex gap-3">
//                 {categories?.map((category: { id: string; label: string }) => (
//                   <Button
//                     key={category.id}
//                     size="sm"
//                     variant="bordered"
//                     onPress={() => setSelectedCategory(category.id)}
//                     className={`rounded-xl border px-3 py-1 text-lg font-normal ${
//                       selectedCategory === category.id
//                         ? 'border-gray-200 bg-gray-200 text-black'
//                         : 'border-gray-200 bg-white text-black hover:bg-gray-50'
//                     }`}
//                     isDisabled={isLoading}
//                   >
//                     {category.label}
//                   </Button>
//                 ))}
//               </div>

//               {/* Trending Topics */}
//               <div className="space-y-3">
//                 {isLoading ? (
//                   <TrendingTopicSkeletons />
//                 ) : error ? (
//                   <TrendingTopicError />
//                 ) : (
//                   trendingTopics.map((topic: ITrendingTopic, index: number) => (
//                     <TrendingTopicItem
//                       key={`${topic.title}-${index}`}
//                       topic={topic}
//                       index={index}
//                       id={topic.id}
//                       isOpen={expandedTopicIndex === index}
//                       onToggle={(isOpen) => handleTopicToggle(index, isOpen)}
//                       onTweetsSelect={onTweetsSelect}
//                     />
//                   ))
//                 )}
//               </div>
//             </div>

//             {/* Suggested Topics */}
//             <div id="suggested-topics" className="mb-8">
//               <h3 className="mb-4 text-lg font-medium text-black">
//                 Suggested Topics
//               </h3>
//               <div className="space-y-3">
//                 {isLoading ? (
//                   <SuggestTopicSkeletons />
//                 ) : error ? (
//                   <SuggestTopicError />
//                 ) : (
//                   suggestedTopics.map((topic: any, index: number) => (
//                     <button
//                       key={`${topic.topic}-${index}`}
//                       onClick={() => onTopicSelect(topic)}
//                       className={`w-full rounded-xl border border-gray-300 bg-white px-[24px] py-[10px] text-left transition-colors duration-150 hover:border-blue-400 hover:bg-blue-100 `}
//                     >
//                       <div className="">
//                         <span className="text-[18px] font-normal leading-[27px] text-black">
//                           {topic.topic}
//                         </span>
//                       </div>
//                     </button>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Search Modal */}
//       <SearchModal
//         isOpen={isSearchModalOpen}
//         onClose={handleSearchModalClose}
//         onConfirm={handleSearchConfirm}
//         initialSearchTerm={searchTerm}
//         onSearchTermChange={handleSearchTermChange}
//         widgetsLoaded={searchWidgetsLoaded}
//         onWidgetsLoadedChange={handleWidgetsLoadedChange}
//       />
//     </div>
//   );
// }

//NewTrendingTopicsPage
export function NewTrendingTopicsPage({
  isVisible,
  onBack: _onBack,
  onTopicSelect,
  onTweetsSelect,
  onSearchConfirm,
  hasCompletedOnboarding,
}: TrendingTopicsProps) {
  const [selectedCategory, setSelectedCategory] = useState('ai');
  const [expandedTopicIndex, setExpandedTopicIndex] = useState<number | null>(
    null, // 改为null，让useEffect来控制初始状态
  );
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchWidgetsLoaded, setSearchWidgetsLoaded] = useState<
    Record<string, boolean>
  >({});
  // 添加状态来跟踪用户是否主动关闭过第一条话题
  const [hasUserCollapsedFirst, setHasUserCollapsedFirst] = useState(false);

  const { data: topicTypes } = useTopicTypes();

  const {
    data: trendingData,
    isLoading,
    error,
  } = useTrendingTopics(selectedCategory);

  const trendingTopics = trendingData?.trending_topics || [];

  // 分类列表：显示可用的话题类型
  const categories = topicTypes?.map((type: { id: string; label: string }) => ({
    id: type.id,
    label: type.label,
  }));

  // 手动展开特定话题
  const expandTopic = (index: number) => {
    setExpandedTopicIndex(index);
  };

  // 手动收起特定话题
  const collapseTopic = (index: number) => {
    if (expandedTopicIndex === index) {
      setExpandedTopicIndex(null);
      // 如果收起的是第一条话题，标记用户主动关闭
      if (index === 0) {
        setHasUserCollapsedFirst(true);
      }
    }
  };

  // 处理话题展开/收起的逻辑，使用布尔值控制
  const handleTopicToggle = (index: number, isOpen: boolean) => {
    if (expandedTopicIndex === index) {
      // 如果当前点击的是已展开的条目，则收起
      setExpandedTopicIndex(null);
      // 如果收起的是第一条话题，标记用户主动关闭
      if (index === 0) {
        setHasUserCollapsedFirst(true);
      }
    } else {
      // 如果当前点击的是未展开的条目，则展开它
      setExpandedTopicIndex(index);
      // 如果展开的是第一条话题，清除用户主动关闭的标记
      if (index === 0) {
        setHasUserCollapsedFirst(false);
      }
    }
  };

  // 根据 onboarding 状态决定是否展开第0个话题
  useEffect(() => {
    if (hasCompletedOnboarding === null) return; // 等待初始化完成

    if (hasCompletedOnboarding) {
      expandTopic(0);
      // 重置用户主动关闭的标记
      setHasUserCollapsedFirst(false);
    } else {
      collapseTopic(0);
    }
  }, [hasCompletedOnboarding]);

  // // 当数据加载完成且已完成onboarding时，确保第一条默认展开（但只在用户没有主动关闭过的情况下）
  // useEffect(() => {
  //   if (
  //     hasCompletedOnboarding === true &&
  //     trendingTopics.length > 0 &&
  //     expandedTopicIndex === null &&
  //     !hasUserCollapsedFirst
  //   ) {
  //     setExpandedTopicIndex(0);
  //   }
  // }, [
  //   hasCompletedOnboarding,
  //   trendingTopics.length,
  //   expandedTopicIndex,
  //   hasUserCollapsedFirst,
  // ]);

  // 优化回调函数
  const handleSearchModalClose = useCallback(() => {
    setIsSearchModalOpen(false);
  }, []);

  const handleSearchConfirm = useCallback(
    (searchTerm: string, selectedTweets: ITrendsRecommendTweet[]) => {
      onSearchConfirm?.(searchTerm, selectedTweets);
      setIsSearchModalOpen(false);
    },
    [onSearchConfirm],
  );

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleWidgetsLoadedChange = useCallback(
    (term: string, loaded: boolean) => {
      setSearchWidgetsLoaded((prev) => ({
        ...prev,
        [term]: loaded,
      }));
    },
    [],
  );

  return (
    <div className="size-full overflow-y-auto bg-white">
      <div className="flex min-h-full flex-col">
        <div className="flex-1 px-[108px] py-12">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[20px] font-medium text-black">
                  Trending Topics
                </p>
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="
                  flex
                  w-[200px] items-center gap-1
                  rounded-[12px] border-2 border-[#F7F7F7]
                  px-4 py-1
                  text-[#828282]
                  transition-colors
                  hover:border-[#FFFFFF]
                "
                  style={{
                    background: `
                    linear-gradient(to right, #F7F7F7 0%, #F7F7F7 30%, #FFFFFF 100%),
                    linear-gradient(to bottom, #F7F7F7 0%, #F7F7F7 70%, #FFFFFF 100%)
                  `,
                    backgroundBlendMode: 'multiply', // 或 overlay / screen，根据你想要的混合效果
                  }}
                >
                  <MagnifyingGlassIcon className="size-5" />
                  <span className="text-[16px]">Search</span>
                </button>
              </div>

              {/* type */}
              <div id="trending-topics-type" className="mb-4 flex gap-3">
                {categories?.map((category: { id: string; label: string }) => (
                  <Button
                    key={category.id}
                    size="sm"
                    variant="bordered"
                    onPress={() => setSelectedCategory(category.id)}
                    className={`rounded-[12px] border border-transparent px-3 py-1 text-[14px] ${
                      selectedCategory === category.id
                        ? 'bg-[#D9D9D9] text-black'
                        : 'text-[#828282]'
                    }`}
                    isDisabled={isLoading}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>

              {/* Trending Topics */}
              <div className="space-y-3">
                {isLoading ? (
                  <NewTrendingTopicSkeletons />
                ) : error ? (
                  <NewTrendingTopicError />
                ) : (
                  trendingTopics.map((topic: ITrendingTopic, index: number) => (
                    <NewTrendingTopicItem
                      onTopicSelect={onTopicSelect}  
                      key={`${topic.title}-${index}`}
                      topic={topic}
                      index={index}
                      id={topic.id}
                      isOpen={expandedTopicIndex === index}
                      onToggle={(isOpen) => handleTopicToggle(index, isOpen)}
                      onTweetsSelect={onTweetsSelect}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Suggested Topics */}
            {/* <div id="suggested-topics" className="mb-8">
              <h3 className="mb-4 text-lg font-medium text-black">
                Suggested Topics
              </h3>
              <div className="space-y-3">
                {isLoading ? (
                  <SuggestTopicSkeletons />
                ) : error ? (
                  <SuggestTopicError />
                ) : (
                  suggestedTopics.map((topic: any, index: number) => (
                    <button
                      key={`${topic.topic}-${index}`}
                      onClick={() => onTopicSelect(topic)}
                      className={`w-full rounded-xl border border-gray-300 bg-white px-[24px] py-[10px] text-left transition-colors duration-150 hover:border-blue-400 hover:bg-blue-100 `}
                    >
                      <div className="">
                        <span className="text-[18px] font-normal leading-[27px] text-black">
                          {topic.topic}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={handleSearchModalClose}
        onConfirm={handleSearchConfirm}
        initialSearchTerm={searchTerm}
        onSearchTermChange={handleSearchTermChange}
        widgetsLoaded={searchWidgetsLoaded}
        onWidgetsLoadedChange={handleWidgetsLoadedChange}
      />
    </div>
  );
}

const TrendingTopicSkeletons = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <TrendingTopicSkeleton key={index} index={index} />
  ));
};

const NewTrendingTopicSkeletons = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <NewTrendingTopicSkeleton key={index} index={index} />
  ));
};

const TrendingTopicError = () => {
  return (
    <div className="py-8 text-center">
      <p className="mb-2 text-gray-500">
        Unable to load trending topics at the moment
      </p>
      <p className="text-sm text-gray-400">Please try again later</p>
    </div>
  );
};

const NewTrendingTopicError = () => {
  return (
    <div className="py-8 text-center">
      <p className="mb-2 text-gray-500">
        Unable to load trending topics at the moment
      </p>
      <p className="text-sm text-gray-400">Please try again later</p>
    </div>
  );
};

const SuggestTopicSkeletons = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <SuggestedTopicSkeleton key={index} />
  ));
};

const SuggestTopicError = () => {
  return (
    <div className="py-8 text-center">
      <p className="mb-2 text-gray-500">
        Unable to load suggested topics at the moment
      </p>
      <p className="text-sm text-gray-400">Please try again later</p>
    </div>
  );
};
