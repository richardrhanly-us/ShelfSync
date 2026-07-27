import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const databaseUrl = process.env.DIRECT_URL;

if (!databaseUrl) {
  throw new Error(
    "DIRECT_URL is missing from server/.env."
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.assignment.upsert({
    where: {
      id: "1",
    },
    update: {
      title: "Adult Fiction Shelf Audit",
      location: "Main Library – Adult Fiction",
      dueDate: new Date("2026-08-01T23:59:59.000Z"),
      completedItems: 0,
      totalItems: 3,
      status: "Not started",
    },
    create: {
      id: "1",
      title: "Adult Fiction Shelf Audit",
      location: "Main Library – Adult Fiction",
      dueDate: new Date("2026-08-01T23:59:59.000Z"),
      completedItems: 0,
      totalItems: 3,
      status: "Not started",
    },
  });

  await prisma.assignment.upsert({
    where: {
      id: "2",
    },
    update: {
      title: "Children's Collection Review",
      location: "Westside Branch – Children's",
      dueDate: new Date("2026-08-05T23:59:59.000Z"),
      completedItems: 0,
      totalItems: 0,
      status: "Not started",
    },
    create: {
      id: "2",
      title: "Children's Collection Review",
      location: "Westside Branch – Children's",
      dueDate: new Date("2026-08-05T23:59:59.000Z"),
      completedItems: 0,
      totalItems: 0,
      status: "Not started",
    },
  });

  await prisma.assignment.upsert({
    where: {
      id: "3",
    },
    update: {
      title: "DVD Collection Inventory",
      location: "Main Library – Media",
      dueDate: new Date("2026-08-08T23:59:59.000Z"),
      completedItems: 0,
      totalItems: 0,
      status: "Not started",
    },
    create: {
      id: "3",
      title: "DVD Collection Inventory",
      location: "Main Library – Media",
      dueDate: new Date("2026-08-08T23:59:59.000Z"),
      completedItems: 0,
      totalItems: 0,
      status: "Not started",
    },
  });

  const libraryItems = [
    {
      barcode: "100000000001",
      title: "The Great Gatsby",
      callNumber: "F FITZGERALD",
      expectedLocation: "Main Library – Adult Fiction",
      currentStatus: "Available",
      assignmentId: "1",
    },
    {
      barcode: "100000000002",
      title: "Pride and Prejudice",
      callNumber: "F AUSTEN",
      expectedLocation: "Main Library – Adult Fiction",
      currentStatus: "Available",
      assignmentId: "1",
    },
    {
      barcode: "100000000003",
      title: "The Lord of the Rings",
      callNumber: "F TOLKIEN",
      expectedLocation: "Main Library – Adult Fiction",
      currentStatus: "Available",
      assignmentId: "1",
    },
  ];

  for (const item of libraryItems) {
    await prisma.libraryItem.upsert({
      where: {
        barcode: item.barcode,
      },
      update: item,
      create: item,
    });
  }

  console.log("ShelfSync database seeded successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });