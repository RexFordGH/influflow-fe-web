'use client';

import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
      {/* 顶部导航栏 */}
      <div className="flex w-full items-center justify-between bg-[#FAFAFA] py-3">
        <img
          className="ml-3"
          src={'/images/logo.png'}
          width={159}
          height={48}
        />
        <button className="mr-3 h-[40px] w-[80px] rounded-[12px] bg-black text-white">
          Login
        </button>
      </div>

      {/* 主体内容 */}
      <main className="mx-3 min-h-screen flex-1 rounded-[12px] bg-white">
        <section className="relative p-[15%] text-center z-10">
          <BackgroundGradientAnimation
            containerClassName="absolute inset-0 -z-10 h-full w-full"
            interactive={true}
          />
          <p className="text-[65px] text-black h-[150px] leading-[80px]">
            One-Stop Content Creation
            <br className="hidden md:block" /> In Your Own Voice
          </p>
          <p className="mx-auto mt-6 w-[590px] text-[20px] text-black leading-[25px]">
            Build your digital self and unlock a one-stop content engine that speaks, thinks, and creates just like you.          </p>
          <div className="mt-10 flex justify-center">
            <Link
              className="rounded-[16px] bg-gradient-to-r from-indigo-400 to-pink-400 px-8 py-3 text-[16px] font-medium text-white shadow-sm hover:opacity-90"
              href="/article-tutorial"
            >
              Get Started
            </Link>
          </div>
          {/* TODO: 跳转链接 */}
        </section>

        <section className="mx-auto px-[15%]">
          <p className="mb-[12px] text-center text-[56px] font-medium italic text-black">
            Why Influxy
          </p>
          <p className="mx-auto mb-[80px] w-[640px] text-center text-[20px] text-[#757575]">
            Influxy helps creators use AI to produce personalized content
            faster, at scale, and with consistency.
          </p>

          <Feature
            image="/home/PersonalizeYourTone.svg"
            title="Personalize Your Tone"
            description="Create your digital persona—AI that understands your tone, mimics the styles you love, and writes with a human touch. Add your intro to unlock content that feels truly like you."
            reversed={false}
          />

          <Feature
            image="/home/FromDraftTweet.svg"
            title="From Draft to Tweet in One Step"
            description="Our editor infuses Twitter's format into what you write—ready to post threads, generate visuals, or refine your content in one click."
            reversed={true}
          />

          <Feature
            image="/home/GetTheOutline.svg"
            title="Get the Outline"
            description="Influxy makes insights instantly translatable into clear outlines and deeper understanding. Generate narrative maps and accelerate growth through an intuitive mind-map tool."
            reversed={false}
          />

          <Feature
            image="/home/TrendingMadeSimple.svg"
            title="Trending Made Simple"
            description="Stay on top of what's trending, get hot topics, sample tweets, and ready-to-use titles to spark your next viral idea."
            reversed={true}
          />
        </section>

        <section className="mx-auto px-[15%] py-16 pb-[120px] pt-[72px] text-center">
          <p className="text-[40px] font-semibold italic">Our Vision</p>
          <p className="mx-auto mt-20 text-center text-[20px]">
            We envision a future where AI deeply understands every creator—their
            voice, style, and values—and amplifies their unique strengths.
          </p>
          <p className="mx-auto mt-10 text-center text-[20px]">
            Through this, creators, brands, and communities can collaborate on
            an open, intelligent platform that makes influence measurable,
            scalable, and truly impactful.
          </p>
        </section>

        <section className="mx-auto px-[15%] pb-6">
          <p className="py-[80px] text-center text-[40px] font-semibold italic">
            FAQ
          </p>
          <div className="space-y-3">
            <FAQ q="What is Influxy?">
              More than a writing tool, Influxy is an all-in-one AI workspace
              that models your unique style. It helps you work smarter, not
              harder — creating content that sounds like you, only sharper.
            </FAQ>
            <FAQ q="Who can use Influxy?">
              Influxy is designed for creators, influencers, researchers, and
              knowledge workers who want to turn their expertise and influence
              into lasting value.
            </FAQ>
            <FAQ q="How is Influxy different from other AI writing tools?">
              Unlike generic AI tools, Influxy learns your unique style and
              context. It doesn’t just generate text — it helps you create
              authentic, branded content that truly sounds like you.
            </FAQ>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <p className="mb-8 text-center text-[40px] font-semibold italic">
            Team Background
          </p>
          <div className="relative mx-auto w-full max-w-3xl">
            <Image
              src="/home/TeamBackground.svg"
              alt="Team Background"
              width={1200}
              height={600}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

type FeatureProps = {
  image: string;
  title: string;
  description: string;
  reversed?: boolean;
};

function Feature({
  image,
  title,
  description,
  reversed = false,
}: FeatureProps) {
  const imageColClasses = `relative ${reversed ? 'md:order-2' : ''}`;
  const textColClasses = `${reversed ? 'md:ml-auto md:mr-[71px]' : 'md:mr-auto md:ml-[71px]'}`;

  return (
    <div className="mb-[88px] grid items-center md:grid-cols-2">
      <div className={imageColClasses}>
        <div className="size-full">
          <Image
            src={image}
            alt={title}
            width={1200}
            height={800}
            className="h-auto w-full"
          />
        </div>
      </div>

      <div className={`${textColClasses} w-[350px]`}>
        <p className="text-[24px] font-semibold">{title}</p>
        <p className="mt-3 text-[14px] leading-5 text-[#757575]">
          {description}
        </p>
        <button className="mt-[24px] rounded-[12px] bg-black px-4 py-3 text-[14px] text-white">
          Try Now
        </button>
      </div>
    </div>
  );
}

type FAQProps = {
  q: string;
  children: React.ReactNode;
};

function FAQ({ q, children }: FAQProps) {
  return (
    <details
      className="
    group relative rounded-[20px] border border-gray-200
    bg-[#EBE9E9] hover:bg-[#F2F7FF] hover:shadow-sm hover:open:bg-[#F2F7FF]
    transition-all duration-300 overflow-hidden
  "
      onMouseEnter={(e) => {
        const details = e.currentTarget;
        details.open = true;
      }}
      onMouseLeave={(e) => {
        const details = e.currentTarget;
        details.open = false;
      }}
    >
      <summary
        className="
      flex items-center cursor-default list-none justify-between
      pt-10 pb-10 group-open:pb-6 transition-[padding] duration-300
      pr-[56px]
    "
        onClick={(e) => {
          // 阻止默认的点击切换行为
          e.preventDefault();
        }}
      >
        <span className="text-[20px] font-medium pl-[80px] italic">Q:</span>
        <span className="text-[20px] font-medium mr-auto pl-10">{q}</span>
      </summary>

      {/* 关键：箭头相对 details 垂直居中 */}
      <img
        src="/icons/lsicon_down-outline.svg"
        width={16}
        height={16}
        className="
      absolute right-[40px] top-1/2 -translate-y-1/2
      rotate-[-90deg] group-open:rotate-0
      transition-transform
      pointer-events-none  /* 点击穿透，仍由 summary 负责开合 */
    "
      />

      <div className="text-sm leading-7 md:text-base flex items-baseline mb-10 w-[820px]">
        <span className="text-[20px] font-medium pl-[80px] italic">A:</span>
        <div className="text-[20px] font-medium mr-auto pl-10">{children}</div>
      </div>
    </details>
  );
}
