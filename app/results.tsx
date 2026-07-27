import { router } from "expo-router";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { getItemByBarcode } from "../data/mockData";
import { useAppSelector } from "../store/hooks";

export default function SavedResultsScreen() {
  const inventoryRecords = useAppSelector(
    (state) => state.inventory.records
  );

  const newestFirst = [...inventoryRecords].reverse();

  const pendingCount = inventoryRecords.filter(
    (record) => record.syncStatus === "pending"
  ).length;

  const exceptionCount = inventoryRecords.filter(
    (record) => record.result !== "Found"
  ).length;

  function formatRecordedAt(recordedAt: string) {
    return new Date(recordedAt).toLocaleString();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>
            ‹ Dashboard
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Saved Results
        </Text>

        <Text style={styles.subtitle}>
          Review inventory records saved on this device.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {inventoryRecords.length}
          </Text>

          <Text style={styles.summaryLabel}>
            Total
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {exceptionCount}
          </Text>

          <Text style={styles.summaryLabel}>
            Exceptions
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {pendingCount}
          </Text>

          <Text style={styles.summaryLabel}>
            Pending
          </Text>
        </View>
      </View>

      <FlatList
        data={newestFirst}
        keyExtractor={(record) => record.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          newestFirst.length === 0 &&
            styles.emptyList,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No saved results
            </Text>

            <Text style={styles.emptyMessage}>
              Inventory results will appear here after
              you scan an item and save a result.
            </Text>

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
          </View>
        }
        renderItem={({ item: record }) => {
          const libraryItem =
            getItemByBarcode(record.barcode);

          const isException =
            record.result !== "Found";

          return (
            <View style={styles.resultCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.itemTitle}>
                    {libraryItem?.title ??
                      "Unknown item"}
                  </Text>

                  <Text style={styles.barcode}>
                    {record.barcode}
                  </Text>
                </View>

                <View
                  style={[
                    styles.resultBadge,
                    isException
                      ? styles.exceptionBadge
                      : styles.foundBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.resultBadgeText,
                      isException
                        ? styles.exceptionBadgeText
                        : styles.foundBadgeText,
                    ]}
                  >
                    {record.result}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Assignment
                </Text>

                <Text style={styles.detailValue}>
                  {record.assignmentId}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Recorded
                </Text>

                <Text style={styles.detailValue}>
                  {formatRecordedAt(
                    record.recordedAt
                  )}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Sync status
                </Text>

                <Text
                  style={[
                    styles.syncStatus,
                    record.syncStatus === "pending" &&
                      styles.pendingStatus,
                    record.syncStatus === "synced" &&
                      styles.syncedStatus,
                    record.syncStatus === "failed" &&
                      styles.failedStatus,
                  ]}
                >
                  {record.syncStatus}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backText: {
    marginBottom: 24,
    fontSize: 16,
    fontWeight: "600",
    color: "#17324d",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#17324d",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 23,
    color: "#657482",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 88,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#ffffff",
  },
  summaryNumber: {
    fontSize: 25,
    fontWeight: "800",
    color: "#17324d",
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 13,
    color: "#657482",
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyList: {
    flexGrow: 1,
  },
  resultCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  cardHeaderText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17212b",
  },
  barcode: {
    marginTop: 5,
    fontSize: 14,
    color: "#657482",
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  foundBadge: {
    backgroundColor: "#e2f3e9",
  },
  exceptionBadge: {
    backgroundColor: "#fbe9e7",
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  foundBadgeText: {
    color: "#287a4d",
  },
  exceptionBadgeText: {
    color: "#a43c32",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#657482",
  },
  detailValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    color: "#17212b",
  },
  syncStatus: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  pendingStatus: {
    color: "#9a6a12",
  },
  syncedStatus: {
    color: "#287a4d",
  },
  failedStatus: {
    color: "#a43c32",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#17324d",
  },
  emptyMessage: {
    marginTop: 10,
    marginBottom: 24,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    color: "#657482",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    width: "100%",
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#17324d",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});