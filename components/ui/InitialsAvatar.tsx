
import React from 'react';

// Simple hash function to get a number from a string
const stringToHash = (str: string): number => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// Function to generate a color from a hash
const hashToHsl = (hash: number, s: number, l: number): string => {
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${s}%, ${l}%)`;
};


interface InitialsAvatarProps {
  name: string;
  className?: string;
}

const InitialsAvatar: React.FC<InitialsAvatarProps> = ({ name, className = '' }) => {
  const getInitials = (nameStr: string): string => {
    if (!nameStr) return '?';
    const names = nameStr.trim().split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  const nameHash = stringToHash(name || '');
  const color1 = hashToHsl(nameHash, 60, 55);
  const color2 = hashToHsl(nameHash + 75, 70, 45); // Shift hue for the second color

  const style = {
    backgroundImage: `linear-gradient(135deg, ${color1}, ${color2})`,
  };

  return (
    <div
      className={`flex items-center justify-center font-bold text-white ${className}`}
      style={style}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};

export default InitialsAvatar;
  