import * as React from "react";

export const ApeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
    aria-hidden="true"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z" />
  </svg>
);

export const CertifiedIcon = (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0054FA]"
      {...props}
    >
      <div
        className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#4285f4] text-xs shadow-[0_2px_4px_rgba(66,133,244,0.3)]"
      >
        <span style={{ fontSize: '10px' }}>🍌</span>
      </div>
    </div>
);