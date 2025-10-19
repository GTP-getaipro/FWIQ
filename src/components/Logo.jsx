import React from 'react';

const Logo = ({ className = 'h-10' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="https://images.squarespace-cdn.com/content/v1/6872b881fea5e278da929cb0/4e18f928-4b83-4ce1-8b16-73f92be51788/FloWorx+Logo+%281000+x+300+px%29+%281%29.png?format=1500w"
        alt="FloWorx Logo"
        className="h-full w-auto"
        src="https://images.squarespace-cdn.com/content/v1/6872b881fea5e278da929cb0/4e18f928-4b83-4ce1-8b16-73f92be51788/FloWorx+Logo+%281000+x+300+px%29+%281%29.png?format=1500w" />
    </div>
  );
};

export default Logo;