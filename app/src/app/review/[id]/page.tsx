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
          setError("Extraction failed. Please try again.");
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

      const result = await response.json();
      
      // Redirect to dashboard (to be built)
      alert(result.message);
      router.push("/");
    } catch (err) {
      console.error("Approve error:", err);
      alert("Failed to approve deadlines");
    }
  };

  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-4">
        <div className="container max-w-2xl">
          <div className="card p-8 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12"
                style={{ color: "var(--color-error)" }}
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
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="mb-4" style={{ color: "var(--color-text-muted)" }}>
              {error}
            </p>
            <button onClick={() => router.push("/")} className="btn btn-primary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !proposal) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-4">
        <div className="container max-w-2xl">
          <div className="card p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="loading-skeleton h-8 w-8 rounded-full"></div>
              <div className="flex-1">
                <div className="loading-skeleton h-4 w-3/4 rounded mb-2"></div>
                <div className="loading-skeleton h-3 w-1/2 rounded"></div>
              </div>
            </div>
            <p className="text-center" style={{ color: "var(--color-text-muted)" }}>
              Extracting deadlines from your syllabus...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-4">
      <div className="container max-w-2xl py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm flex items-center gap-2"
            style={{ color: "var(--color-primary)" }}
          >
            ← Back
          </button>
        </div>

        <ExtractionReview
          proposal={proposal}
          onApprove={handleApprove}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}
