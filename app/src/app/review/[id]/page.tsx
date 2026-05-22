"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ExtractionReview from "@/components/ExtractionReview";
import type { Proposal, Assessment } from "@/types";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) return;

    const pollProposal = async () => {
      try {
        const response = await fetch(`/api/proposals/${proposalId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch proposal");
        }

        const data = await response.json();
        setProposal(data);

        if (data.status === "completed" || data.status === "approved") {
          setLoading(false);
        } else if (data.status === "failed") {
          setError(data.error || "Extraction failed. Please try again.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Poll error:", err);
        setError("Failed to load proposal");
        setLoading(false);
      }
    };

    // Initial poll
    pollProposal();

    // Poll every 2 seconds while processing
    const interval = setInterval(() => {
      if (proposal?.status === "processing") {
        pollProposal();
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [proposalId, proposal?.status]);

  const handleEdit = async (assessmentId: string, updates: Partial<Assessment>) => {
    if (!proposal) return;

    try {
      const updatedAssessments = proposal.assessments?.map((a) =>
        a.id === assessmentId ? { ...a, ...updates } : a
      );

      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessments: updatedAssessments }),
      });

      if (!response.ok) {
        throw new Error("Failed to update assessment");
      }

      const updatedProposal = await response.json();
      setProposal(updatedProposal);
    } catch (err) {
      console.error("Edit error:", err);
      alert("Failed to update assessment");
    }
  };

  const handleApprove = async () => {
    if (!proposal) return;

    try {
      const response = await fetch(`/api/proposals/${proposalId}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to approve proposal");
      }

      await response.json();
      
      // Redirect to dashboard to see conflicts and schedule
      router.push("/dashboard");
    } catch (err) {
      console.error("Approve error:", err);
      alert("Failed to approve deadlines");
    }
  };

  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="bg-surface border border-error rounded-lg shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4">
              <svg
                className="w-8 h-8 text-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">Extraction Failed</h2>
            <p className="text-text-muted mb-6">
              {error}
            </p>
            <button 
              onClick={() => router.push("/")} 
              className="
                inline-flex items-center gap-2 px-6 py-3
                bg-primary hover:bg-primary-hover text-white font-medium rounded-lg
                transition-all duration-150 shadow-sm hover:shadow
              "
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !proposal) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-surface border border-border rounded-lg shadow-sm p-8">
            {/* Animated Header Skeleton */}
            <div className="flex items-center gap-4 mb-6">
              <div className="loading-skeleton h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="loading-skeleton h-5 w-3/4 rounded" />
                <div className="loading-skeleton h-4 w-1/2 rounded" />
              </div>
            </div>

            {/* Progress Message */}
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <svg className="w-8 h-8 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">
                Extracting deadlines from your syllabus
              </h3>
              <p className="text-text-muted">
                This usually takes 5-10 seconds...
              </p>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border rounded-lg p-5">
                  <div className="flex items-start gap-4">
                    <div className="loading-skeleton h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="loading-skeleton h-4 w-2/3 rounded" />
                      <div className="loading-skeleton h-3 w-1/2 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.push("/")}
            className="
              inline-flex items-center gap-2 text-sm font-medium
              text-text-muted hover:text-text transition-colors duration-150
            "
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Upload
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <ExtractionReview
            proposal={proposal}
            onApprove={handleApprove}
            onEdit={handleEdit}
          />
        </div>
      </div>
    </div>
  );
}
