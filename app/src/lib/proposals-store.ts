/**
 * Mate - In-Memory Proposals Store
 * Temporary storage for extraction proposals before approval
 */

import type { Proposal } from '@/types';

declare global {
	// eslint-disable-next-line no-var
	var __mateProposals: Map<string, Proposal> | undefined;
}

// In-memory store for proposals (extraction results before approval).
// Use a global map to avoid losing state during dev hot reloads.
export const proposals = globalThis.__mateProposals ?? new Map<string, Proposal>();

if (!globalThis.__mateProposals) {
	globalThis.__mateProposals = proposals;
}
