'use client';

import React from 'react';
import { CompanyRow } from '@/components/auth/OnboardingFlow'; // Adjust path as needed
import { Spinner } from './spinner'; // Assuming spinner is in the same directory

interface CompanySelectorProps {
  companies: CompanyRow[];
  selectedCompanyId: string | null;
  onCompanyChange: (companyId: string) => void;
  isLoading: boolean;
  label?: string; // Optional label
  className?: string; // Optional additional classes
}

const selectClasses = "w-full px-4 py-2 text-base text-gold-primary bg-gray-very-dark border border-gray-dark rounded-lg focus:ring-gold-primary/20 focus:border-gold-primary focus:bg-black transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed";

const CompanySelector: React.FC<CompanySelectorProps> = ({
  companies,
  selectedCompanyId,
  onCompanyChange,
  isLoading,
  label = 'Select Company', // Default label
  className = '',
}) => {

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Spinner className="h-5 w-5 text-gold-primary" />
        <span className="text-sm text-gray-light">Loading companies...</span>
      </div>
    );
  }

  if (companies.length === 0) {
    return <p className={`text-sm text-gray-medium ${className}`}>No companies available.</p>;
  }

  // Only render selector if there's more than one company
  if (companies.length <= 1) {
    return null; // Or display the single company name if needed
  }

  return (
    <div className={`w-full ${className}`}>
      {label && <label htmlFor="company-selector" className="block text-sm font-medium text-gold-secondary mb-1">{label}</label>}
      <div className="relative">
        <select
          id="company-selector"
          value={selectedCompanyId || ''} // Handle null selectedCompanyId
          onChange={(e) => onCompanyChange(e.target.value)}
          className={selectClasses}
          disabled={isLoading} // Disable while loading (though handled above)
        >
          {/* Optional: Add a default placeholder option? */} 
          {/* <option value="" disabled>Select a company...</option> */}
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name} {company.business_id ? `(${company.business_id})` : ''}
            </option>
          ))}
        </select>
        {/* Add dropdown arrow indicator if needed using Tailwind/CSS */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-light">
           {/* Heroicon: chevron-down */}
           <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
             <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
           </svg>
         </div>
      </div>
    </div>
  );
};

export default CompanySelector; 