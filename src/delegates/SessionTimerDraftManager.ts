// src/delegates/SessionTimerDraftManager.ts

import type { SessionTimer } from '../models/domain';

/**
 * Stateless helper for resetting/restoring in-progress drafts for session timer forms.
 * Provides a static resetDraft method for use by TimerStateStore.
 */
export class SessionTimerDraftManager {
  /**
   * Returns a clean draft (null or shallow clone of last-persisted timer) for use after cancel/discard.
   * If existingTimer is provided, returns a shallow clone; otherwise, returns null.
   */
  static resetDraft(existingTimer?: SessionTimer): SessionTimer | null {
    if (existingTimer) {
      return { ...existingTimer };
    }
    return null;
  }
}
