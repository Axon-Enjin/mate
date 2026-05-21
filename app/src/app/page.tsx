"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
    <div className="flex flex-col flex-1 items-center justify-center p-4">
      <main className="container max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
            Mate
          </h1>
          <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>
            Upload your syllabus and get every deadline extracted — zero setup.
          </p>
        </div>

        <div className="card p-8">
          <div className="mb-6">
            <label
              htmlFor="syllabus-upload"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--color-text)" }}
            >
              Upload Syllabus (PDF or DOC)
            </label>
            <input
              id="syllabus-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="input"
              disabled={isUploading}
            />
            {file && (
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                Selected: {file.name}
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="btn btn-primary w-full"
          >
            {isUploading ? "Reading your syllabus now... 📄" : "Upload & Extract"}
          </button>

          {isUploading && (
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: "var(--color-surface-emphasis)" }}>
              <div className="flex items-center gap-3">
                <div className="loading-skeleton h-4 w-4 rounded-full"></div>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Extracting deadlines from your syllabus...
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
          <p>
            Powered by Microsoft Copilot • KPMG Academic Innovation Challenge 2026
          </p>
        </div>
      </main>
    </div>
  );
}
