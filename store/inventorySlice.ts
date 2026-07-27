import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit";
import { INVENTORY_SYNC_URL } from "../lib/api";

import type {
    InventoryResult,
} from "../data/mockData";


export type SyncStatus =
  | "pending"
  | "synced"
  | "failed";

export type SyncState =
  | "idle"
  | "syncing"
  | "succeeded"
  | "failed";

export type SavedInventoryRecord = {
  id: string;
  assignmentId: string;
  barcode: string;
  result: InventoryResult;
  recordedAt: string;
  syncStatus: SyncStatus;
};

type InventoryState = {
  records: SavedInventoryRecord[];
  syncState: SyncState;
  lastSyncError: string | null;
  lastSyncedAt: string | null;
};

const initialState: InventoryState = {
  records: [],
  syncState: "idle",
  lastSyncError: null,
  lastSyncedAt: null,
};

type AddInventoryRecordPayload = {
  assignmentId: string;
  barcode: string;
  result: InventoryResult;
};

type SyncApiResult = {
  id: string;
  success: boolean;
  message: string;
};

type SyncApiResponse = {
  success: boolean;
  receivedCount: number;
  synchronizedAt: string;
  results: SyncApiResult[];
};

type SyncThunkResult = {
  synchronizedAt: string;
  results: SyncApiResult[];
};

export const syncInventoryRecords = createAsyncThunk<
  SyncThunkResult,
  void,
  {
    state: {
      inventory: InventoryState;
    };
    rejectValue: string;
  }
>(
  "inventory/syncInventoryRecords",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();

    const recordsToSync =
      state.inventory.records.filter(
        (record) =>
          record.syncStatus === "pending" ||
          record.syncStatus === "failed"
      );

    if (recordsToSync.length === 0) {
      return {
        synchronizedAt:
          new Date().toISOString(),
        results: [],
      };
    }

    try {
      const response = await fetch(
        INVENTORY_SYNC_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            records: recordsToSync.map(
              (record) => ({
                id: record.id,
                assignmentId:
                  record.assignmentId,
                barcode: record.barcode,
                result: record.result,
                recordedAt:
                  record.recordedAt,
              })
            ),
          }),
        }
      );

      const responseBody =
        (await response.json()) as
          | SyncApiResponse
          | {
              success?: boolean;
              message?: string;
            };

        if (!response.ok) {
        const errorMessage =
            "message" in responseBody &&
            typeof responseBody.message === "string"
            ? responseBody.message
            : `The server returned status ${response.status}.`;

        return rejectWithValue(errorMessage);
        }

      const syncResponse =
        responseBody as SyncApiResponse;

      if (
        !syncResponse.success ||
        !Array.isArray(syncResponse.results)
      ) {
        return rejectWithValue(
          "The server returned an invalid synchronization response."
        );
      }

      return {
        synchronizedAt:
          syncResponse.synchronizedAt,
        results: syncResponse.results,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(
          `Could not reach the ShelfSync server: ${error.message}`
        );
      }

      return rejectWithValue(
        "Could not reach the ShelfSync server."
      );
    }
  }
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    addInventoryRecord: (
      state,
      action: PayloadAction<AddInventoryRecordPayload>
    ) => {
      state.records.push({
        id: `${Date.now()}-${action.payload.barcode}`,
        assignmentId:
          action.payload.assignmentId,
        barcode: action.payload.barcode,
        result: action.payload.result,
        recordedAt: new Date().toISOString(),
        syncStatus: "pending",
      });

      state.syncState = "idle";
      state.lastSyncError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        syncInventoryRecords.pending,
        (state) => {
          state.syncState = "syncing";
          state.lastSyncError = null;
        }
      )
      .addCase(
        syncInventoryRecords.fulfilled,
        (state, action) => {
          for (const result of action.payload.results) {
            const record =
              state.records.find(
                (existingRecord) =>
                  existingRecord.id ===
                  result.id
              );

            if (record) {
              record.syncStatus =
                result.success
                  ? "synced"
                  : "failed";
            }
          }

          const failedResults =
            action.payload.results.filter(
              (result) => !result.success
            );

          state.lastSyncedAt =
            action.payload.synchronizedAt;

          if (failedResults.length > 0) {
            state.syncState = "failed";
            state.lastSyncError =
              `${failedResults.length} ${
                failedResults.length === 1
                  ? "record failed"
                  : "records failed"
              } to synchronize.`;
          } else {
            state.syncState = "succeeded";
            state.lastSyncError = null;
          }
        }
      )
      .addCase(
        syncInventoryRecords.rejected,
        (state, action) => {
          state.syncState = "failed";
          state.lastSyncError =
            action.payload ??
            "Synchronization failed.";

          for (const record of state.records) {
            if (
              record.syncStatus === "pending"
            ) {
              record.syncStatus = "failed";
            }
          }
        }
      );
  },
});

export const {
  addInventoryRecord,
} = inventorySlice.actions;

export default inventorySlice.reducer;