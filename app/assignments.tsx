import {
    router,
    useFocusEffect,
} from "expo-router";
import {
    useCallback,
    useState,
} from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { graphqlRequest } from "../lib/graphql";

type AssignmentStatus =
  | "Not started"
  | "In progress"
  | "Complete";

type Assignment = {
  id: string;
  title: string;
  location: string;
  dueDate: string;
  completedItems: number;
  totalItems: number;
  status: AssignmentStatus;
};

const ASSIGNMENTS_QUERY = `
  query GetAssignments {
    assignments {
      id
      title
      location
      dueDate
      completedItems
      totalItems
      status
    }
  }
`;

export default function AssignmentsScreen() {
  const [assignments, setAssignments] =
    useState<Assignment[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const loadAssignments =
    useCallback(
      async (
        showFullLoadingScreen = false
      ) => {
        if (showFullLoadingScreen) {
          setIsLoading(true);
        }

        setErrorMessage(null);

        try {
          const data = await graphqlRequest<{
            assignments: Assignment[];
          }>(ASSIGNMENTS_QUERY);

          if (
            !Array.isArray(data.assignments)
          ) {
            throw new Error(
              "The server returned an invalid assignments response."
            );
          }

          setAssignments(data.assignments);
        } catch (error: unknown) {
          if (error instanceof Error) {
            setErrorMessage(error.message);
          } else {
            setErrorMessage(
              "The assignments could not be loaded."
            );
          }
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      void loadAssignments(
        assignments.length === 0
      );
    }, [
      assignments.length,
      loadAssignments,
    ])
  );

  function refreshAssignments() {
    setIsRefreshing(true);
    void loadAssignments(false);
  }

  function retryAssignments() {
    void loadAssignments(true);
  }

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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.back()
            }
          >
            <Text style={styles.backText}>
              ‹ Dashboard
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Assignments
          </Text>

          <Text style={styles.subtitle}>
            Loading assignments from the
            ShelfSync server.
          </Text>
        </View>

        <View style={styles.centeredState}>
          <ActivityIndicator
            size="large"
            color="#17324d"
          />

          <Text style={styles.stateMessage}>
            Loading assignments...
          </Text>
        </View>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.back()
            }
          >
            <Text style={styles.backText}>
              ‹ Dashboard
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Assignments
          </Text>

          <Text style={styles.subtitle}>
            Select an assignment to begin or
            continue inventory work.
          </Text>
        </View>

        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>
            Could not load assignments
          </Text>

          <Text style={styles.errorMessage}>
            {errorMessage}
          </Text>

          <Text style={styles.errorHint}>
            Confirm the ShelfSync backend is
            running and that the phone is
            connected to the same network as
            the computer.
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={retryAssignments}
          >
            <Text style={styles.retryButtonText}>
              Try again
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹ Dashboard
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Assignments
        </Text>

        <Text style={styles.subtitle}>
          Select an assignment to begin or
          continue inventory work.
        </Text>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) =>
          item.id
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.list,
          assignments.length === 0 &&
            styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={
              refreshAssignments
            }
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No assignments available
            </Text>

            <Text style={styles.emptyMessage}>
              The server is connected, but
              no inventory assignments were
              returned.
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={
                refreshAssignments
              }
            >
              <Text
                style={
                  styles.retryButtonText
                }
              >
                Refresh
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const progress =
            item.totalItems === 0
              ? 0
              : Math.min(
                  100,
                  Math.round(
                    (item.completedItems /
                      item.totalItems) *
                      100
                  )
                );

          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname:
                    "/assignment/[id]",
                  params: {
                    id: item.id,
                  },
                })
              }
            >
              <View
                style={
                  styles.cardHeader
                }
              >
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  {item.title}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    item.status ===
                      "In progress" &&
                      styles.inProgressBadge,
                    item.status ===
                      "Complete" &&
                      styles.completeBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status ===
                        "In progress" &&
                        styles.inProgressText,
                      item.status ===
                        "Complete" &&
                        styles.completeText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.location}>
                {item.location}
              </Text>

              <Text style={styles.dueDate}>
                Due{" "}
                {formatDueDate(
                  item.dueDate
                )}
              </Text>

              <View
                style={
                  styles.progressHeader
                }
              >
                <Text
                  style={
                    styles.progressLabel
                  }
                >
                  Progress
                </Text>

                <Text
                  style={
                    styles.progressValue
                  }
                >
                  {item.completedItems} of{" "}
                  {item.totalItems}
                </Text>
              </View>

              <View
                style={
                  styles.progressTrack
                }
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

              <Text
                style={
                  styles.progressPercent
                }
              >
                {progress}% complete
              </Text>
            </Pressable>
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
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    marginBottom: 18,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
    color: "#17212b",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    fontSize: 12,
    fontWeight: "700",
    color: "#344454",
  },
  inProgressText: {
    color: "#8a6112",
  },
  completeText: {
    color: "#287a4d",
  },
  location: {
    marginTop: 12,
    fontSize: 15,
    color: "#53616e",
  },
  dueDate: {
    marginTop: 5,
    fontSize: 14,
    color: "#7c8994",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#344454",
  },
  progressValue: {
    fontSize: 14,
    color: "#657482",
  },
  progressTrack: {
    height: 9,
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#dde3e8",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#287a4d",
  },
  progressPercent: {
    marginTop: 8,
    fontSize: 13,
    color: "#657482",
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  stateMessage: {
    marginTop: 16,
    fontSize: 15,
    color: "#657482",
  },
  errorCard: {
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#a43c32",
  },
  errorMessage: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#53616e",
  },
  errorHint: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#7c8994",
  },
  retryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    marginTop: 22,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#17324d",
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  emptyCard: {
    alignItems: "center",
    padding: 28,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#17324d",
  },
  emptyMessage: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    color: "#657482",
  },
});