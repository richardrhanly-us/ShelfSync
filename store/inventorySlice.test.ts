import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

vi.mock("../lib/api", () => ({
  INVENTORY_SYNC_URL:
    "http://localhost:4000/api/inventory/sync",
}));

import inventoryReducer, {
    addInventoryRecord,
    syncInventoryRecords,
} from "./inventorySlice";

describe("inventorySlice", () => {
  it("creates a new pending inventory record", () => {
    const state = inventoryReducer(
      undefined,
      addInventoryRecord({
        assignmentId: "assignment-1",
        barcode: "100000000001",
        result: "Found",
      })
    );

    expect(state.records).toHaveLength(1);

    expect(state.records[0]).toMatchObject({
      assignmentId: "assignment-1",
      barcode: "100000000001",
      result: "Found",
      syncStatus: "pending",
    });

    expect(state.records[0].id).toContain(
      "100000000001"
    );

    expect(
      Number.isNaN(
        Date.parse(
          state.records[0].recordedAt
        )
      )
    ).toBe(false);

    expect(state.syncState).toBe("idle");
    expect(state.lastSyncError).toBeNull();
  });

  it("marks a record as synced after a successful response", () => {
    const pendingState = inventoryReducer(
      undefined,
      addInventoryRecord({
        assignmentId: "assignment-1",
        barcode: "100000000001",
        result: "Found",
      })
    );

    const recordId =
      pendingState.records[0].id;

    const synchronizedAt =
      "2026-07-26T12:00:00.000Z";

    const syncedState = inventoryReducer(
      pendingState,
      syncInventoryRecords.fulfilled(
        {
          synchronizedAt,
          results: [
            {
              id: recordId,
              success: true,
              message:
                "Record synchronized.",
            },
          ],
        },
        "test-request-id",
        undefined
      )
    );

    expect(
      syncedState.records[0].syncStatus
    ).toBe("synced");

    expect(syncedState.syncState).toBe(
      "succeeded"
    );

    expect(
      syncedState.lastSyncedAt
    ).toBe(synchronizedAt);

    expect(
      syncedState.lastSyncError
    ).toBeNull();
  });

  it("marks an individual record as failed when the server rejects it", () => {
    const pendingState = inventoryReducer(
      undefined,
      addInventoryRecord({
        assignmentId: "assignment-1",
        barcode: "100000000001",
        result: "Missing",
      })
    );

    const recordId =
      pendingState.records[0].id;

    const failedState = inventoryReducer(
      pendingState,
      syncInventoryRecords.fulfilled(
        {
          synchronizedAt:
            "2026-07-26T12:00:00.000Z",
          results: [
            {
              id: recordId,
              success: false,
              message:
                "The record was rejected.",
            },
          ],
        },
        "test-request-id",
        undefined
      )
    );

    expect(
      failedState.records[0].syncStatus
    ).toBe("failed");

    expect(failedState.syncState).toBe(
      "failed"
    );

    expect(
      failedState.lastSyncError
    ).toBe(
      "1 record failed to synchronize."
    );
  });

  it("marks pending records as failed when the sync request fails", () => {
    const pendingState = inventoryReducer(
      undefined,
      addInventoryRecord({
        assignmentId: "assignment-1",
        barcode: "100000000001",
        result: "Damaged",
      })
    );

    const failedState = inventoryReducer(
      pendingState,
      syncInventoryRecords.rejected(
        new Error(
          "Could not reach server"
        ),
        "test-request-id",
        undefined,
        "Could not reach the ShelfSync server."
      )
    );

    expect(
      failedState.records[0].syncStatus
    ).toBe("failed");

    expect(failedState.syncState).toBe(
      "failed"
    );

    expect(
      failedState.lastSyncError
    ).toBe(
      "Could not reach the ShelfSync server."
    );
  });
});