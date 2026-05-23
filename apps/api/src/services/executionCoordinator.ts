import type { ExecutionState, PauseState } from "@v01/core";

class ExecutionCoordinator {
  private pauseState: PauseState = {
    requested: false,
    requestedAt: null,
    nextCheckpoint: null
  };

  getState(): ExecutionState {
    return {
      activeRunId: null,
      currentTaskId: null,
      currentCheckpoint: null,
      pause: this.pauseState
    };
  }

  requestPause(): PauseState {
    this.pauseState = {
      requested: true,
      requestedAt: new Date().toISOString(),
      nextCheckpoint: "after-current-safe-operation"
    };
    return this.pauseState;
  }

  resume(): PauseState {
    this.pauseState = {
      requested: false,
      requestedAt: null,
      nextCheckpoint: null
    };
    return this.pauseState;
  }

  shouldPause(): boolean {
    return this.pauseState.requested;
  }
}

export const executionCoordinator = new ExecutionCoordinator();
