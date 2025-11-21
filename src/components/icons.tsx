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
      <path d="M12 2l3.09 6.31L22 9.27l-5 4.87L18.18 22 12 18.31 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
};
