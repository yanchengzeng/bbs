import { useState, useEffect } from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
}

// Generate a consistent color based on name
function getInitialsColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-indigo-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({ name, avatarUrl, size = 'md' }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Reset error state when avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm', // 36px for md
    lg: 'w-16 h-16 text-lg',
  };
  
  // Check if this is an anonymous user
  const isAnonymous = name.startsWith('anonymous_') || name === 'Anonymous';
  
  // If we have an avatarUrl and image hasn't errored, try to show it
  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        onError={() => {
          console.warn(`Failed to load avatar image for ${name}:`, avatarUrl);
          setImageError(true);
        }}
        referrerPolicy="no-referrer"
      />
    );
  }
  
  // For anonymous users, show a default anonymous avatar
  if (isAnonymous) {
    const colorClass = getInitialsColor('Anonymous'); // Use consistent color for all anonymous users
    return (
      <div
        className={`${sizeClasses[size]} rounded-full ${colorClass} flex items-center justify-center font-semibold text-white`}
      >
        A
      </div>
    );
  }
  
  // Fallback to colored initials badge for regular users
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  const colorClass = getInitialsColor(name);
  
  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${colorClass} flex items-center justify-center font-semibold text-white`}
    >
      {initials}
    </div>
  );
}
