'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X, Camera, Loader2 } from 'lucide-react';

export default function ReportUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload an image (JPG, PNG, WEBP) or PDF.');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null); // PDF preview not shown
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Upload file with expense_report_id
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadSource', 'file');
      formData.append('expense_report_id', reportId); // Link to report

      const uploadResponse = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      console.log('Upload successful:', uploadResult);

      // Extract data with OpenAI
      setUploading(false);
      setExtracting(true);

      const extractResponse = await fetch('/api/receipts/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId: uploadResult.receipt.id,
          imageUrl: uploadResult.receipt.imageUrl,
        }),
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || 'Extraction failed');
      }

      const extractResult = await extractResponse.json();
      console.log('Extraction successful:', extractResult);

      // Wait 3 seconds for database write to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Redirect to receipt edit page
      router.push(`/receipts/${uploadResult.receipt.id}`);

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUploading(false);
      setExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/reports/${reportId}`)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Report
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Upload Receipt
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload a receipt image or PDF and we'll extract the data automatically
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }`}
        >
          {preview ? (
            <div className="space-y-4">
              <div className="relative w-full max-w-md mx-auto">
                <Image
                  src={preview}
                  alt="Receipt preview"
                  width={400}
                  height={500}
                  className="rounded-lg shadow-lg"
                />
                <button
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {file?.name}
              </p>
              <button
                onClick={handleUpload}
                disabled={uploading || extracting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : extracting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extracting data...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Extract
                  </>
                )}
              </button>
            </div>
          ) : file && file.type === 'application/pdf' ? (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-16 h-16 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {file.name}
              </p>
              <button
                onClick={handleUpload}
                disabled={uploading || extracting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : extracting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extracting data...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Extract
                  </>
                )}
              </button>
              <button
                onClick={handleRemoveFile}
                className="ml-4 text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop your receipt here
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                or click to browse
              </p>

              <label className="cursor-pointer inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                <Upload className="w-5 h-5 mr-2" />
                Choose File
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>

              <div className="mt-6 flex items-center justify-center gap-4">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Camera className="w-5 h-5 mr-2" />
                  Take Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                Supports: JPG, PNG, WEBP, PDF (max 10MB)
              </p>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
