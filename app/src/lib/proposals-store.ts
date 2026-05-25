/**
 * Mate - In-Memory Proposals Store
 * Temporary storage for extraction proposals before approval
 */

import type { Proposal } from '@/types';

declare global {
	var __mateProposals: Map<string, Proposal> | undefined;
	var __mateApprovingLocks: Set<string> | undefined;
}

// In-memory store for proposals (extraction results before approval).
// Use a global map to avoid losing state during dev hot reloads.
export const proposals = globalThis.__mateProposals ?? new Map<string, Proposal>();

// Prevents duplicate Cosmos writes when Approve All is double-clicked.
export const approvingLocks =
	globalThis.__mateApprovingLocks ?? new Set<string>();

if (!globalThis.__mateProposals) {
	globalThis.__mateProposals = proposals;
}

if (!globalThis.__mateApprovingLocks) {
	globalThis.__mateApprovingLocks = approvingLocks;
}
