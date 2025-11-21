import type { SVGProps } from 'react';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
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
      <title>Dark and Darker Guild Hub Logo</title>
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 11.91 4.59-2.15 8-6.86 8-11.91V5l-8-3z" />
    </svg>
  ),
};
