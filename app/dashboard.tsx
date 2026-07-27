import { useNetInfo } from "@react-native-community/netinfo";
import { router } from "expo-router";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    useAppDispatch,
    useAppSelector,
} from "../store/hooks";

import {
    syncInventoryRecords,
} from "../store/inventorySlice";

export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const networkState = useNetInfo();

  const {
    records,
    syncState,
    lastSyncError,
    lastSyncedAt,
  } = useAppSelector(
    (state) => state.inventory
  );

  const isOnline =
    networkState.isConnected === true &&
    networkState.isInternetReachable !== false;

  const itemsScanned = records.length;

  const exceptions = records.filter(
    (record) => record.result !== "Found"
  ).length;

  const pendingCount = records.filter(
    (record) =>
      record.syncStatus === "pending"
  ).length;

  const failedCount = records.filter(
    (record) =>
      record.syncStatus === "failed"
  ).length;

  const unsyncedCount =
    pendingCount + failedCount;

  const latestRecord =
    records.length > 0
      ? records[records.length - 1]
      : undefined;

  const isSyncing =
    syncState === "syncing";

  const canSync =
    isOnline &&
    unsyncedCount > 0 &&
    !isSyncing;

  function handleSync() {
    if (!canSync) {
      return;
    }

    void dispatch(syncInventoryRecords());
  }

  function formatLastSync() {
    if (!lastSyncedAt) {
      return "Not synchronized yet";
    }

    return `Last attempt: ${new Date(
      lastSyncedAt
    ).toLocaleString()}`;
  }

  function getSyncButtonLabel() {
    if (!isOnline) {
      return "Sync unavailable while offline";
    }

    if (isSyncing) {
      return "Synchronizing...";
    }

    if (failedCount > 0) {
      return failedCount === 1
        ? "Retry failed record"
        : `Retry ${failedCount} failed records`;
    }

    if (pendingCount > 0) {
      return pendingCount === 1
        ? "Sync 1 pending record"
        : `Sync ${pendingCount} pending records`;
    }

    return "Everything is synchronized";
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>
            Welcome back
          </Text>

          <Text style={styles.title}>
            ShelfSync Dashboard
          </Text>
        </View>

        <Pressable
          style={styles.signOutButton}
          onPress={() =>
            router.replace("/")
          }
        >
          <Text style={styles.signOutText}>
            Sign out
          </Text>
        </Pressable>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>
          Synchronization status
        </Text>

        <Text
          style={
            isOnline
              ? styles.onlineStatus
              : styles.offlineStatus
          }
        >
          {isOnline
            ? "● Online"
            : "● Offline"}
        </Text>

        {!isOnline ? (
          <Text style={styles.offlineMessage}>
            Saved records will remain on this device until
            an internet connection is available.
          </Text>
        ) : failedCount > 0 ? (
          <Text style={styles.failedStatus}>
            {failedCount}{" "}
            {failedCount === 1
              ? "failed record"
              : "failed records"}
          </Text>
        ) : pendingCount > 0 ? (
          <Text style={styles.pendingStatus}>
            {pendingCount} pending{" "}
            {pendingCount === 1
              ? "change"
              : "changes"}
          </Text>
        ) : (
          <Text style={styles.syncedStatus}>
            All records synchronized
          </Text>
        )}

        <Text style={styles.lastSyncText}>
          {formatLastSync()}
        </Text>

        {lastSyncError && isOnline && (
          <Text style={styles.errorMessage}>
            {lastSyncError}
          </Text>
        )}

        <Pressable
          style={[
            styles.syncButton,
            !canSync &&
              styles.disabledSyncButton,
          ]}
          disabled={!canSync}
          onPress={handleSync}
        >
          {isSyncing && (
            <ActivityIndicator
              size="small"
              color="#ffffff"
            />
          )}

          <Text style={styles.syncButtonText}>
            {getSyncButtonLabel()}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>
        Current session
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {itemsScanned}
          </Text>

          <Text style={styles.statLabel}>
            Items scanned
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {exceptions}
          </Text>

          <Text style={styles.statLabel}>
            Exceptions
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() =>
          router.push("/assignments")
        }
      >
        <Text style={styles.primaryButtonText}>
          View assignments
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() =>
          router.push("/results")
        }
      >
        <Text style={styles.secondaryButtonText}>
          View saved results
        </Text>
      </Pressable>

      {latestRecord && (
        <View style={styles.latestCard}>
          <Text style={styles.latestTitle}>
            Most recent result
          </Text>

          <Text style={styles.latestBarcode}>
            {latestRecord.barcode}
          </Text>

          <Text style={styles.latestResult}>
            Result: {latestRecord.result}
          </Text>

          <Text style={styles.latestStatus}>
            Sync status:{" "}
            {latestRecord.syncStatus}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    marginBottom: 4,
    fontSize: 15,
    color: "#657482",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#17324d",
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17324d",
  },
  statusCard: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  statusTitle: {
    marginBottom: 10,
    fontSize: 17,
    fontWeight: "700",
    color: "#17212b",
  },
  onlineStatus: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "700",
    color: "#287a4d",
  },
  offlineStatus: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "700",
    color: "#a43c32",
  },
  offlineMessage: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#657482",
  },
  pendingStatus: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9a6a12",
  },
  failedStatus: {
    fontSize: 14,
    fontWeight: "700",
    color: "#a43c32",
  },
  syncedStatus: {
    fontSize: 14,
    fontWeight: "700",
    color: "#287a4d",
  },
  lastSyncText: {
    marginTop: 5,
    fontSize: 13,
    color: "#657482",
  },
  errorMessage: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#a43c32",
  },
  syncButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#17324d",
  },
  disabledSyncButton: {
    backgroundColor: "#9aa6b1",
  },
  syncButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#17212b",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minHeight: 105,
    justifyContent: "center",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  statNumber: {
    marginBottom: 8,
    fontSize: 32,
    fontWeight: "800",
    color: "#17324d",
  },
  statLabel: {
    fontSize: 14,
    color: "#657482",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 10,
    backgroundColor: "#17324d",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#17324d",
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#17324d",
  },
  latestCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  latestTitle: {
    marginBottom: 12,
    fontSize: 17,
    fontWeight: "700",
    color: "#17212b",
  },
  latestBarcode: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17324d",
  },
  latestResult: {
    marginTop: 8,
    fontSize: 15,
    color: "#53616e",
  },
  latestStatus: {
    marginTop: 4,
    fontSize: 14,
    color: "#657482",
  },
});