'use client';

import { Button, Tooltip } from '@heroui/react';

export function Onboarding({
  isOpen,
}: {
  isOpen:number;
}) {

  return (
    <div className="bottom-[-32px] right-[4px] flex items-center justify-end gap-1 transition-opacity opacity-100">
      <Tooltip
        content="Edit with AI"
        delay={50}
        isOpen={isOpen===1}
        closeDelay={0}
        placement="top"
        classNames={{
          content: 'bg-black text-white',
          arrow: 'bg-black border-black',
        }}
      >
        <Button isIconOnly size="sm" variant="light">
          <img
            src="/icons/Edit.svg"
            alt="upload"
            width={20}
            height={20}
            className="rounded-none"
          />
        </Button>
      </Tooltip>
      <Tooltip
        content="Upload Image"
        delay={50}
        isOpen={isOpen===2}

        closeDelay={0}
        placement="top"
        classNames={{
          content: 'bg-black text-white',
          arrow: 'bg-black border-black',
        }}
      >
        <Button isIconOnly size="sm" variant="light">
          <img
            src="/icons/uploadImage.svg"
            alt="upload"
            width={20}
            height={20}
            className="rounded-none"
          />
        </Button>
      </Tooltip>
      <Tooltip
        content="Generate Image"
        delay={50}
        isOpen={isOpen===3}
        closeDelay={0}
        placement="top"
        classNames={{
          content: 'bg-black text-white',
          arrow: 'bg-black border-black',
        }}
      >
        <Button isIconOnly size="sm" variant="light">
          <img
            src="/icons/genImage.svg"
            alt="upload"
            width={20}
            height={20}
            className="rounded-none"
          />
        </Button>
      </Tooltip>
    </div>
  );
}
