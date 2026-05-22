"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || 
          droppedFile.type === "application/msword" ||
          droppedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setFile(droppedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/syllabi", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const proposalId = data?.data?.proposalId;

      if (!proposalId) {
        throw new Error("Upload succeeded but no proposal id returned");
      }

      // Redirect to review page
      router.push(`/review/${proposalId}`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Top Navigation */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {status === "loading" ? (
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            Loading...
          </div>
        ) : session ? (
          <>
            <button
              onClick={() => router.push("/dashboard")}
              className="
                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                text-primary hover:text-primary-hover bg-transparent hover:bg-surface-emphasis
                border border-primary rounded-lg transition-all duration-150
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="
                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                text-gray-700 bg-white border border-gray-300 rounded-lg
                hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                transition-colors
              "
            >
              Log Out
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/dashboard" })}
            className="
              inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
              text-white bg-[#0078d4] rounded-lg hover:bg-[#106ebe]
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0078d4]
              transition-colors
            "
          >
            Sign In
          </button>
        )}
      </div>

      <main className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-semibold text-text mb-3">
            Welcome to Mate
          </h1>
          <p className="text-lg sm:text-xl text-text-muted max-w-xl mx-auto">
            Upload your syllabus and get every deadline extracted — zero setup.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-surface border border-border rounded-lg shadow-sm p-6 sm:p-8 mb-6">
          <div className="mb-6">
            <label
              htmlFor="syllabus-upload"
              className="block text-sm font-medium text-text mb-3"
            >
              Upload Syllabus
            </label>
            
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-all duration-150
                ${isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-surface-emphasis/50'
                }
                ${isUploading ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <input
                id="syllabus-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              
              <div className="pointer-events-none">
                <svg 
                  className="mx-auto h-12 w-12 text-text-muted mb-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                  />
                </svg>
                
                {file ? (
                  <div className="space-y-2">
                    <p className="text-base font-medium text-text">
                      {file.name}
                    </p>
                    <p className="text-sm text-text-muted">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-sm text-primary hover:text-primary-hover underline"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-base text-text">
                      <span className="font-medium text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-text-muted">
                      PDF or DOC files (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="
              w-full flex items-center justify-center gap-2 px-6 py-3 
              bg-primary hover:bg-primary-hover text-white font-medium rounded-lg
              transition-all duration-150 shadow-sm hover:shadow
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary
              min-h-[44px]
            "
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Reading your syllabus...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Upload & Extract Deadlines</span>
              </>
            )}
          </button>

          {isUploading && (
            <div className="mt-6 p-4 rounded-lg bg-surface-emphasis border border-border">
              <div className="flex items-start gap-3">
                <div className="loading-skeleton h-5 w-5 rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-text">
                    Extracting deadlines from your syllabus
                  </p>
                  <p className="text-xs text-text-muted">
                    This usually takes 5-10 seconds...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-success/10 mb-3">
              <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text mb-1">Instant Extraction</p>
            <p className="text-xs text-text-muted">AI reads your syllabus in seconds</p>
          </div>
          
          <div className="text-center p-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10 mb-3">
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text mb-1">Conflict Detection</p>
            <p className="text-xs text-text-muted">Flags overlapping deadlines</p>
          </div>
          
          <div className="text-center p-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-3">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text mb-1">Smart Scheduling</p>
            <p className="text-xs text-text-muted">Builds your study plan</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-text-muted">
          <p>
            Powered by Microsoft Copilot • KPMG Academic Innovation Challenge 2026
          </p>
        </div>
      </main>
    </div>
  );
}
