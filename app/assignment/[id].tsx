import {
  Href,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import {
  useCallback,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { graphqlRequest } from "../../lib/graphql";

type AssignmentStatus =
  | "Not started"
  | "In progress"
  | "Complete";

type LibraryItem = {
  id: string;
  barcode: string;
  title: string;
  callNumber: string;
  expectedLocation: string;
  currentStatus: string;
};

type Assignment = {
  id: string;
  title: string;
  location: string;
  dueDate: string;
  completedItems: number;
  totalItems: number;
  status: AssignmentStatus;
  items: LibraryItem[];
};

const ASSIGNMENT_QUERY = `
  query GetAssignment($id: ID!) {
    assignment(id: $id) {
      id
      title
      location
      dueDate
      completedItems
      totalItems
      status
      items {
        id
        barcode
        title
        callNumber
        expectedLocation
        currentStatus
      }
    }
  }
`;

export default function AssignmentDetailScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [assignment, setAssignment] =
    useState<Assignment | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const loadAssignment =
    useCallback(async () => {
      if (!id) {
        setErrorMessage(
          "No assignment ID was provided."
        );
        setIsLoading(false);
        return;
      }

      setErrorMessage(null);

      try {
        const data = await graphqlRequest<
          {
            assignment: Assignment | null;
          },
          {
            id: string;
          }
        >(
          ASSIGNMENT_QUERY,
          {
            id,
          }
        );

        setAssignment(data.assignment);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(
            "The assignment could not be loaded."
          );
        }
      } finally {
        setIsLoading(false);
      }
    }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadAssignment();
    }, [loadAssignment])
  );

  function formatDueDate(
    dueDate: string
  ) {
    const parsedDate =
      new Date(dueDate);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return dueDate;
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function retryAssignment() {
    setIsLoading(true);
    void loadAssignment();
  }

  function openScanner() {
    router.push(
      `/assignment/${id}/scan` as Href
    );
  }

  if (isLoading) {
    return (
      <View
        style={styles.centeredContainer}
      >
        <ActivityIndicator
          size="large"
          color="#17324d"
        />

        <Text style={styles.loadingText}>
          Loading assignment...
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View
        style={styles.centeredContainer}
      >
        <Text style={styles.errorTitle}>
          Could not load assignment
        </Text>

        <Text style={styles.errorMessage}>
          {errorMessage}
        </Text>

        <Text style={styles.errorHint}>
          Confirm the backend is running and
          the phone is connected to the same
          network as the computer.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={retryAssignment}
        >
          <Text
            style={styles.primaryButtonText}
          >
            Try again
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            router.replace("/assignments")
          }
        >
          <Text
            style={
              styles.secondaryButtonText
            }
          >
            Return to assignments
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View
        style={styles.centeredContainer}
      >
        <Text style={styles.errorTitle}>
          Assignment not found
        </Text>

        <Text style={styles.errorMessage}>
          The server could not find assignment{" "}
          {id}.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.replace("/assignments")
          }
        >
          <Text
            style={styles.primaryButtonText}
          >
            Return to assignments
          </Text>
        </Pressable>
      </View>
    );
  }

  const progress =
    assignment.totalItems === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (assignment.completedItems /
              assignment.totalItems) *
              100
          )
        );

  const remainingItems = Math.max(
    0,
    assignment.totalItems -
      assignment.completedItems
  );

  const isComplete =
    assignment.status === "Complete";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>
          ‹ Assignments
        </Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>
          {assignment.title}
        </Text>

        <Text style={styles.location}>
          {assignment.location}
        </Text>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusBadge,
            assignment.status ===
              "In progress" &&
              styles.inProgressBadge,
            assignment.status ===
              "Complete" &&
              styles.completeBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              assignment.status ===
                "In progress" &&
                styles.inProgressText,
              assignment.status ===
                "Complete" &&
                styles.completeText,
            ]}
          >
            {assignment.status}
          </Text>
        </View>

        <Text style={styles.dueDate}>
          Due{" "}
          {formatDueDate(
            assignment.dueDate
          )}
        </Text>
      </View>

      <View style={styles.progressCard}>
        <View
          style={styles.progressHeader}
        >
          <Text style={styles.cardTitle}>
            Assignment progress
          </Text>

          <Text
            style={styles.progressPercent}
          >
            {progress}%
          </Text>
        </View>

        <View
          style={styles.progressTrack}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text
              style={styles.statNumber}
            >
              {assignment.completedItems}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Completed
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stat}>
            <Text
              style={styles.statNumber}
            >
              {remainingItems}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Remaining
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stat}>
            <Text
              style={styles.statNumber}
            >
              {assignment.totalItems}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Total
            </Text>
          </View>
        </View>
      </View>

      <View
        style={styles.instructionsCard}
      >
        <Text style={styles.cardTitle}>
          Inventory instructions
        </Text>

        <Text style={styles.instructions}>
          Scan each item in the assigned
          collection. Confirm its location and
          record any missing, damaged, or
          incorrectly shelved items.
        </Text>
      </View>

      <View style={styles.itemsCard}>
        <View style={styles.itemsHeader}>
          <Text style={styles.cardTitle}>
            Assigned items
          </Text>

          <Text style={styles.itemCount}>
            {assignment.items.length}
          </Text>
        </View>

        {assignment.items.length === 0 ? (
          <Text
            style={styles.emptyItemsText}
          >
            No library items are currently
            assigned to this inventory task.
          </Text>
        ) : (
          assignment.items.map((item) => (
            <View
              key={item.id}
              style={styles.itemRow}
            >
              <View
                style={styles.itemText}
              >
                <Text
                  style={styles.itemTitle}
                >
                  {item.title}
                </Text>

                <Text
                  style={styles.callNumber}
                >
                  {item.callNumber}
                </Text>

                <Text
                  style={styles.itemBarcode}
                >
                  Barcode: {item.barcode}
                </Text>
              </View>

              <View
                style={
                  styles.itemStatusBadge
                }
              >
                <Text
                  style={
                    styles.itemStatusText
                  }
                >
                  {item.currentStatus}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Pressable
        style={[
          styles.primaryButton,
          isComplete &&
            styles.disabledButton,
        ]}
        disabled={isComplete}
        onPress={openScanner}
      >
        <Text
          style={styles.primaryButtonText}
        >
          {isComplete
            ? "Assignment complete"
            : "Start scanning"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#f4f6f8",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#657482",
  },
  backText: {
    marginBottom: 24,
    fontSize: 16,
    fontWeight: "600",
    color: "#17324d",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#17324d",
  },
  location: {
    marginTop: 8,
    fontSize: 16,
    color: "#657482",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#e7edf2",
  },
  inProgressBadge: {
    backgroundColor: "#fff1cf",
  },
  completeBadge: {
    backgroundColor: "#e2f3e9",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#344454",
  },
  inProgressText: {
    color: "#8a6112",
  },
  completeText: {
    color: "#287a4d",
  },
  dueDate: {
    fontSize: 14,
    color: "#657482",
  },
  progressCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17212b",
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: "800",
    color: "#287a4d",
  },
  progressTrack: {
    height: 10,
    marginTop: 18,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#dde3e8",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#287a4d",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#17324d",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: "#657482",
  },
  divider: {
    width: 1,
    height: 42,
    backgroundColor: "#dde3e8",
  },
  instructionsCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  instructions: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 23,
    color: "#53616e",
  },
  itemsCard: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  itemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#17324d",
  },
  emptyItemsText: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    color: "#657482",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e9ed",
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#17212b",
  },
  callNumber: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "600",
    color: "#53616e",
  },
  itemBarcode: {
    marginTop: 5,
    fontSize: 13,
    color: "#7c8994",
  },
  itemStatusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#e2f3e9",
  },
  itemStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#287a4d",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#17324d",
  },
  disabledButton: {
    backgroundColor: "#9aa6b1",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    width: "100%",
    marginTop: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#17324d",
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#17324d",
  },
  errorTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: "#17324d",
  },
  errorMessage: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    color: "#53616e",
  },
  errorHint: {
    marginTop: 10,
    marginBottom: 24,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: "#7c8994",
  },
});