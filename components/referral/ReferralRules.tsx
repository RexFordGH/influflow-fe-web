'use client';

interface RuleSection {
  title: string;
  rules: string[];
}

const REFERRAL_RULES: RuleSection[] = [
  {
    title: 'Invite Rewards',
    rules: [
      'Earn 30 credits for each friend you invite.',
      'Your friend also receives 30 credits when they join.',
      'You can earn up to 500 credits from this campaign.',
    ],
  },
  {
    title: 'Commission Rewards',
    rules: [
      'Earn 15% commission for each paying user you successfully refer.',
      'Commissions accumulate throughout the Referral Program period, and you receive commission each month as long as your referred users keep paying.',
      'To collect commissions, please link your PayPal account through the Referral Management portal.',
      'Commissions are automatically paid to your linked PayPal account on the 1th of each month. You can check details in Referral Management.',
      'Unlinked PayPal accounts will be paid in the next month’s payout.',
      'A minimum of $20 is required before payouts can be processed.',
    ],
  },
];

export function ReferralRules() {
  return (
    <div className="flex flex-col gap-6">
      {REFERRAL_RULES.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <h3 className="font-poppins text-[16px] font-medium leading-6 text-black">
            {section.title}
          </h3>
          <div className="flex flex-col pl-[6px]">
            {section.rules.map((rule, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="mt-[7px] size-[4px] flex-shrink-0 rounded-full bg-black" />
                <span className="font-poppins text-[14px] font-normal leading-[21px] text-black">
                  {rule}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
