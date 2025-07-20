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

export const CertifiedIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19.5 12.5c0 5-3.5 6-3.5 6s-3.5-1-3.5-6c0-5 1.5-7.5 3.5-7.5s3.5 2.5 3.5 7.5z" fill="#0072F5" stroke="none" />
      <path d="M16 12.5c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5 2.5-1 2.5-2.5-1-2.5-2.5-2.5z" fill="#0072F5" stroke="none" />
      <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" fill="#0072F5" stroke="none" />
      <path d="M14.5 9.5c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5c0 1 .5 2.5 2.5 2.5s2.5-1.5 2.5-2.5z" fill="#FFD700" stroke="none"/>
      <path d="M12 9.5c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5 2.5-1 2.5-2.5-1-2.5-2.5-2.5z" fill="#FFD700" stroke="none" />
      <path d="M9.5 9.5c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5c0 1-.5 2.5-2.5 2.5s-2.5-1.5-2.5-2.5z" fill="#FFD700" stroke="none" />
    </svg>
);
