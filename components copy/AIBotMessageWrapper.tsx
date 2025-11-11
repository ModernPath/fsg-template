'use client';

import { useEffect, useState } from 'react';
import { isOpenAIUserAgent } from '@/utils/userAgent';
import AIBotMessage from './AIBotMessage';

export default function AIBotMessageWrapper() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    try {
      const userAgent = navigator.userAgent || '';
      setShouldShow(isOpenAIUserAgent(userAgent));
    } catch (error) {
      console.error('Error in AIBotMessageWrapper:', error);
      setShouldShow(false);
    }
  }, []);

  if (!shouldShow) {
    return null;
  }

  return <AIBotMessage />;
} 