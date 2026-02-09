'use client';

export const getChannelBgColor = (
  canal: 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'web'
): string => {
  const colors: Record<string, string> = {
    facebook: 'bg-blue-600',
    instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
    telegram: 'bg-blue-500',
    web: 'bg-gray-100',
    whatsapp: 'bg-green-100',
  };

  return colors[canal] || colors.web;
};

