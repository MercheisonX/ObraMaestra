import React from 'react';

const ShieldExclamationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.816 4.083A23.475 23.475 0 0012 3.75c2.408 0 4.726.333 6.884.958" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.432 0-8.324-2.887-9.816-7.043A23.475 23.475 0 0012 20.25c2.408 0 4.726-.333 6.884-.958C19.324 16.94 15.432 21 12 21zM12 11.25V15m0 3h.008v.008H12v-.008z" />
  </svg>
);
export default ShieldExclamationIcon;