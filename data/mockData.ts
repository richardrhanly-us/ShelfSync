export type AssignmentStatus =
  | "Not started"
  | "In progress"
  | "Complete";

export type InventoryResult =
  | "Found"
  | "Missing"
  | "Damaged"
  | "Wrong location";

export type Assignment = {
  id: string;
  title: string;
  location: string;
  dueDate: string;
  completedItems: number;
  totalItems: number;
  status: AssignmentStatus;
};

export type LibraryItem = {
  barcode: string;
  title: string;
  callNumber: string;
  expectedLocation: string;
  currentStatus: string;
};

export const mockAssignments: Assignment[] = [
  {
    id: "1",
    title: "Adult Fiction Inventory",
    location: "Main Library — Second Floor",
    dueDate: "July 30, 2026",
    completedItems: 42,
    totalItems: 150,
    status: "In progress",
  },
  {
    id: "2",
    title: "DVD Collection Inventory",
    location: "Main Library — Media Area",
    dueDate: "August 2, 2026",
    completedItems: 0,
    totalItems: 85,
    status: "Not started",
  },
  {
    id: "3",
    title: "Children's New Books",
    location: "Westside Branch",
    dueDate: "July 28, 2026",
    completedItems: 36,
    totalItems: 36,
    status: "Complete",
  },
];

export const mockItems: Record<string, LibraryItem> = {
  "100000000001": {
    barcode: "100000000001",
    title: "The Great Gatsby",
    callNumber: "FIC FIT",
    expectedLocation: "Adult Fiction — F",
    currentStatus: "Available",
  },
  "100000000002": {
    barcode: "100000000002",
    title: "Pride and Prejudice",
    callNumber: "FIC AUS",
    expectedLocation: "Adult Fiction — A",
    currentStatus: "Available",
  },
  "100000000003": {
    barcode: "100000000003",
    title: "The Lord of the Rings",
    callNumber: "FIC TOL",
    expectedLocation: "Adult Fiction — T",
    currentStatus: "Available",
  },
};

export const inventoryResultOptions: InventoryResult[] = [
  "Found",
  "Missing",
  "Damaged",
  "Wrong location",
];

export function getAssignmentById(
  assignmentId: string
): Assignment | undefined {
  return mockAssignments.find(
    (assignment) => assignment.id === assignmentId
  );
}

export function getItemByBarcode(
  barcode: string
): LibraryItem | undefined {
  return mockItems[barcode];
}