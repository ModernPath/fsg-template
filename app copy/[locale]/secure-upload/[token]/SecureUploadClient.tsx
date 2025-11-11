'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, UploadCloud, FileText, AlertCircle } from 'lucide-react';

interface SecureUploadClientProps {
  token: string;
}

// Define states for loading, validation, files, errors, success
type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid' | 'expired' | 'error' | 'used';
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'partial';

const SecureUploadClient: React.FC<SecureUploadClientProps> = ({ token }) => {
  const t = useTranslations('SecureUpload');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('validating');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<any[] | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [requestingUserName, setRequestingUserName] = useState<string | null>(null);

  // Effect to validate the token on component mount
  useEffect(() => {
    const validateToken = async () => {
      setValidationStatus('validating');
      setErrorMessage(null);
      try {
        const response = await fetch(`/api/validate-doc-request/${token}`);
        const data = await response.json();

        if (!response.ok) {
          const reason = data.reason || 'error';
          setValidationStatus(reason);
          setErrorMessage(data.message || t(`error${reason.charAt(0).toUpperCase() + reason.slice(1)}`, { default: 'Validation failed.' }));
        } else if (data.valid) {
          setValidationStatus('valid');
          setCompanyName(data.companyName);
          setRequestingUserName(data.userName);
        } else {
          setValidationStatus('invalid');
          setErrorMessage(t('errorInvalidToken', { default: 'This upload link is invalid.' }));
        }

      } catch (error) {
        console.error('Token validation API call failed:', error);
        setValidationStatus('error');
        setErrorMessage(t('errorValidationFailed', { default: 'Could not validate the upload link. Please try again later.' }));
      }
    };

    validateToken();
  }, [token, t]);

  // Handlers for file selection, drag/drop, upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      // Append new files to existing ones, avoiding duplicates by name
      setFiles(prevFiles => {
          const existingNames = new Set(prevFiles.map(f => f.name));
          const uniqueNewFiles = newFiles.filter(nf => !existingNames.has(nf.name));
          return [...prevFiles, ...uniqueNewFiles];
      });
      setUploadStatus('idle'); 
      setErrorMessage(null);
      setUploadResults(null);
      // Clear the input value to allow selecting the same file again if needed
      event.target.value = ''; 
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files) {
      const newFiles = Array.from(event.dataTransfer.files);
      // Append new files to existing ones, avoiding duplicates by name
      setFiles(prevFiles => {
          const existingNames = new Set(prevFiles.map(f => f.name));
          const uniqueNewFiles = newFiles.filter(nf => !existingNames.has(nf.name));
          return [...prevFiles, ...uniqueNewFiles];
      });
      setUploadStatus('idle');
      setErrorMessage(null);
      setUploadResults(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleUpload = async () => {
    if (files.length === 0 || validationStatus !== 'valid') return;

    setUploadStatus('uploading');
    setErrorMessage(null);
    setUploadResults(null);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`/api/secure-upload/${token}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setUploadResults(data.results || []);

      if (!response.ok) {
        setUploadStatus('error');
        setErrorMessage(data.message || t('errorUploadFailed', { default: 'File upload failed. Please try again.' }));
        if (response.status === 207) {
          setUploadStatus('partial');
        }
      } else {
        setUploadStatus('success');
      }

    } catch (error) {
      console.error('Secure upload API call failed:', error);
      setUploadStatus('error');
      setErrorMessage(t('errorUploadFailed', { default: 'File upload failed. Please try again.' }));
    }
  };

  // Render logic based on validation and upload status
  const renderContent = () => {
    if (validationStatus === 'validating') {
      return (
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-gold-primary mb-4" />
          <p>{t('validating', { default: 'Validating upload link...' })}</p>
        </div>
      );
    }

    if (validationStatus !== 'valid') {
      return (
        <div className="text-center text-red-400">
          <AlertCircle className="mx-auto h-12 w-12 mb-4" />
          <p className="font-semibold">{t('validationFailedTitle', { default: 'Link Invalid or Expired' })}</p>
          <p className="mt-2 text-sm">{errorMessage || t('errorGenericValidation', { default: 'This secure upload link is not valid.' })}</p>
        </div>
      );
    }

    if (uploadStatus === 'success' || uploadStatus === 'partial') {
      return (
        <div className={`text-center ${uploadStatus === 'success' ? 'text-green-400' : 'text-yellow-400'}`}>
          <UploadCloud className="mx-auto h-12 w-12 mb-4" />
          <p className="font-semibold">
            {uploadStatus === 'success' 
              ? t('uploadSuccessTitle', { default: 'Documents Uploaded Successfully!' })
              : t('uploadPartialTitle', { default: 'Upload Partially Successful' })
            }
          </p>
          <p className="mt-2 text-sm text-gray-light">
            {uploadStatus === 'success'
              ? t('uploadSuccessMessage', { default: 'Thank you, the documents have been sent securely.' })
              : t('uploadPartialMessage', { default: 'Some documents were uploaded, but others failed. Please review below.' })
            }
          </p>
          {uploadStatus === 'partial' && uploadResults && uploadResults.length > 0 && (
            <div className="mt-4 text-left text-sm bg-gray-dark-medium p-4 rounded">
              <p className="font-medium text-gold-secondary mb-2">{t('uploadDetails', { default: 'Upload Details:' })}</p>
              <ul className="space-y-1">
                {uploadResults.map((result, index) => (
                  <li key={index} className={`flex items-start ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-grow">
                      <span>{result.name}</span>
                      {!result.success && <span className="ml-2 text-xs">({result.error || 'Failed'})</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        <h2 className="text-2xl font-bold text-gold-primary mb-2 text-center">{t('formTitle', { default: 'Secure Document Upload' })}</h2>
        <p className="text-center text-gray-light mb-6">{t('formSubtitle', { default: '{userName} from {companyName} has requested documents.', userName: requestingUserName || '...', companyName: companyName || '...' })}</p>
        
        <label 
          htmlFor="secure-file-upload"
          className={`block border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors border-gray-dark hover:border-gold-primary/50 bg-black mb-6`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={(e) => e.preventDefault()}
        >
          <UploadCloud className="mx-auto h-12 w-12 text-gold-primary/80" />
          <p className="mt-3 text-base text-gray-light">{t('dropzoneText', { default: 'Drag & Drop Files Here or Click to Select' })}</p>
          <p className="text-sm text-gray-medium mt-2">{t('supportedFormats', { default: 'Supports PDF, DOC, DOCX, XLS, XLSX' })}</p>
          <input
            id="secure-file-upload"
            name="files"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
          />
        </label>

        {files.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gold-secondary mb-2">{t('selectedFiles', { default: 'Selected files:' })}</p>
            <ul className="space-y-1 text-sm text-gray-light">
              {files.map((file, index) => (
                <li key={index} className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{file.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded-md border border-red-500/50 text-sm">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={files.length === 0 || uploadStatus === 'uploading'}
          className="w-full px-5 py-3 bg-gold-primary text-black rounded-lg font-semibold text-base hover:bg-gold-highlight disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center disabled:bg-gold-primary"
        >
          {uploadStatus === 'uploading' ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('uploadingButton', { default: 'Uploading...' })}
            </>
          ) : (
            t('uploadButton', { default: 'Upload Documents' })
          )}
        </button>
      </>
    );
  };

  return (
    <div className="w-full max-w-lg bg-gray-dark p-8 rounded-xl shadow-lg border border-gray-medium/30">
      {renderContent()}
    </div>
  );
};

export default SecureUploadClient; 