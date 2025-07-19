
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

const CurrencyDollarIcon: React.FC<IconProps> = ({ title, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22m-4-10.5h8.5a3.5 3.5 0 000-7H9.5a3.5 3.5 0 010-7H16" />
  </svg>
);
export default CurrencyDollarIcon;
