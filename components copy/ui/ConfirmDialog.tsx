'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  isLoading = false,
  variant = 'default'
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center">
            {variant === 'destructive' && (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
            )}
            <h2 className="text-lg font-semibold text-[#FFD700]">
              {title}
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
            className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 leading-relaxed">
            {description}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              variant === 'destructive'
                ? 'bg-red-600 text-white hover:bg-red-700 border-red-600'
                : 'bg-[#FFD700] text-black hover:bg-[#FFFFE0] border-[#FFD700]'
            }
          >
            {isLoading ? 'Loading...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog; 