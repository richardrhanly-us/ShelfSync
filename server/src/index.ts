import "dotenv/config";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { PrismaPg } from "@prisma/adapter-pg";
import cors from "cors";
import express, {
    type Request,
    type Response,
} from "express";

import {
    PrismaClient,
} from "./generated/prisma/client.js";

const PORT = 4000;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing from server/.env."
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

type InventoryResult =
  | "Found"
  | "Missing"
  | "Damaged"
  | "Wrong location";

type InventorySyncRecord = {
  id: string;
  assignmentId: string;
  barcode: string;
  result: InventoryResult;
  recordedAt: string;
};

type InventorySyncRequest = {
  records: InventorySyncRecord[];
};

type InventorySyncResult = {
  id: string;
  success: boolean;
  message: string;
};

const typeDefs = `#graphql
  type InventoryRecord {
    id: ID!
    assignmentId: String!
    barcode: String!
    result: String!
    recordedAt: String!
    synchronizedAt: String!
  }

  type LibraryItem {
    id: ID!
    barcode: String!
    title: String!
    callNumber: String!
    expectedLocation: String!
    currentStatus: String!
    assignmentId: String!
  }

  type Assignment {
    id: ID!
    title: String!
    location: String!
    dueDate: String!
    completedItems: Int!
    totalItems: Int!
    status: String!
    items: [LibraryItem!]!
  }

  type Query {
    health: String!
    appName: String!
    inventoryRecords: [InventoryRecord!]!
    assignments: [Assignment!]!
    assignment(id: ID!): Assignment
    libraryItem(barcode: String!): LibraryItem
  }
`;

const resolvers = {
  Query: {
    health: () =>
      "ShelfSync GraphQL API is running",

    appName: () => "ShelfSync",

    inventoryRecords: async () => {
      const records =
        await prisma.inventoryRecord.findMany({
          orderBy: {
            synchronizedAt: "desc",
          },
        });

      return records.map((record) => ({
        ...record,
        recordedAt:
          record.recordedAt.toISOString(),
        synchronizedAt:
          record.synchronizedAt.toISOString(),
      }));
    },

    assignments: async () => {
      const assignments =
        await prisma.assignment.findMany({
          include: {
            items: {
              orderBy: {
                title: "asc",
              },
            },
          },
          orderBy: {
            dueDate: "asc",
          },
        });

      return assignments.map(
        (assignment) => ({
          ...assignment,
          dueDate:
            assignment.dueDate.toISOString(),
        })
      );
    },

    assignment: async (
      _parent: unknown,
      args: { id: string }
    ) => {
      const assignment =
        await prisma.assignment.findUnique({
          where: {
            id: args.id,
          },
          include: {
            items: {
              orderBy: {
                title: "asc",
              },
            },
          },
        });

      if (!assignment) {
        return null;
      }

      return {
        ...assignment,
        dueDate:
          assignment.dueDate.toISOString(),
      };
    },

    libraryItem: async (
      _parent: unknown,
      args: { barcode: string }
    ) => {
      return prisma.libraryItem.findUnique({
        where: {
          barcode: args.barcode,
        },
      });
    },
  },
};

function isInventoryResult(
  value: unknown
): value is InventoryResult {
  return (
    value === "Found" ||
    value === "Missing" ||
    value === "Damaged" ||
    value === "Wrong location"
  );
}

function isInventoryRecord(
  value: unknown
): value is InventorySyncRecord {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const record = value as Record<
    string,
    unknown
  >;

  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    typeof record.assignmentId ===
      "string" &&
    record.assignmentId.length > 0 &&
    typeof record.barcode === "string" &&
    record.barcode.length > 0 &&
    isInventoryResult(record.result) &&
    typeof record.recordedAt === "string" &&
    !Number.isNaN(
      Date.parse(record.recordedAt)
    )
  );
}

async function recalculateAssignmentProgress(
  assignmentId: string
) {
  const assignment =
    await prisma.assignment.findUnique({
      where: {
        id: assignmentId,
      },
      include: {
        items: {
          select: {
            barcode: true,
          },
        },
      },
    });

  if (!assignment) {
    console.warn(
      `Could not update progress because assignment ${assignmentId} was not found.`
    );

    return;
  }

  const assignedBarcodes =
    assignment.items.map(
      (item) => item.barcode
    );

  let completedItems = 0;

  if (assignedBarcodes.length > 0) {
    const completedRecords =
      await prisma.inventoryRecord.findMany({
        where: {
          assignmentId,
          barcode: {
            in: assignedBarcodes,
          },
        },
        distinct: ["barcode"],
        select: {
          barcode: true,
        },
      });

    completedItems = Math.min(
      completedRecords.length,
      assignment.totalItems
    );
  }

  let status = "Not started";

  if (
    assignment.totalItems > 0 &&
    completedItems >= assignment.totalItems
  ) {
    status = "Complete";
  } else if (completedItems > 0) {
    status = "In progress";
  }

  await prisma.assignment.update({
    where: {
      id: assignmentId,
    },
    data: {
      completedItems,
      status,
    },
  });

  console.log(
    `Assignment ${assignmentId} progress updated: ${completedItems} of ${assignment.totalItems}, ${status}.`
  );
}

async function startServer() {
  const app = express();

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();

  app.use(cors());
  app.use(express.json());

  app.get(
    "/health",
    async (
      _request: Request,
      response: Response
    ) => {
      try {
        const storedRecordCount =
          await prisma.inventoryRecord.count();

        const assignmentCount =
          await prisma.assignment.count();

        const libraryItemCount =
          await prisma.libraryItem.count();

        response.status(200).json({
          status: "ok",
          service: "ShelfSync API",
          timestamp: new Date().toISOString(),
          database: "connected",
          storedRecordCount,
          assignmentCount,
          libraryItemCount,
        });
      } catch (error: unknown) {
        console.error(
          "Database health check failed:",
          error
        );

        response.status(503).json({
          status: "error",
          service: "ShelfSync API",
          timestamp: new Date().toISOString(),
          database: "unavailable",
        });
      }
    }
  );

  app.post(
    "/api/inventory/sync",
    async (
      request: Request<
        object,
        object,
        InventorySyncRequest
      >,
      response: Response
    ) => {
      const records = request.body?.records;

      if (!Array.isArray(records)) {
        response.status(400).json({
          success: false,
          message:
            "The request body must contain a records array.",
        });

        return;
      }

      if (records.length === 0) {
        response.status(400).json({
          success: false,
          message:
            "At least one inventory record is required.",
        });

        return;
      }

      const invalidRecordIndex =
        records.findIndex(
          (record) =>
            !isInventoryRecord(record)
        );

      if (invalidRecordIndex !== -1) {
        response.status(400).json({
          success: false,
          message:
            `Record at index ${invalidRecordIndex} is invalid.`,
        });

        return;
      }

      const synchronizedAt = new Date();

      try {
        await prisma.$transaction(
          records.map((record) =>
            prisma.inventoryRecord.upsert({
              where: {
                id: record.id,
              },
              create: {
                id: record.id,
                assignmentId:
                  record.assignmentId,
                barcode: record.barcode,
                result: record.result,
                recordedAt: new Date(
                  record.recordedAt
                ),
                synchronizedAt,
              },
              update: {
                assignmentId:
                  record.assignmentId,
                barcode: record.barcode,
                result: record.result,
                recordedAt: new Date(
                  record.recordedAt
                ),
                synchronizedAt,
              },
            })
          )
        );

        const affectedAssignmentIds = [
          ...new Set(
            records.map(
              (record) =>
                record.assignmentId
            )
          ),
        ];

        for (
          const assignmentId
          of affectedAssignmentIds
        ) {
          await recalculateAssignmentProgress(
            assignmentId
          );
        }

        const storedRecordCount =
          await prisma.inventoryRecord.count();

        const results: InventorySyncResult[] =
          records.map((record) => ({
            id: record.id,
            success: true,
            message:
              "Inventory record synchronized.",
          }));

        console.log(
          `Stored ${records.length} inventory ${
            records.length === 1
              ? "record"
              : "records"
          } in PostgreSQL. Total stored: ${storedRecordCount}.`
        );

        response.status(200).json({
          success: true,
          receivedCount: records.length,
          synchronizedAt:
            synchronizedAt.toISOString(),
          results,
        });
      } catch (error: unknown) {
        console.error(
          "Inventory synchronization failed:",
          error
        );

        response.status(500).json({
          success: false,
          message:
            "The inventory records could not be saved to the database.",
        });
      }
    }
  );

  app.use(
    "/graphql",
    expressMiddleware(apolloServer)
  );

  app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `ShelfSync API running at http://localhost:${PORT}`
      );

      console.log(
        `REST health check: http://localhost:${PORT}/health`
      );

      console.log(
        `Inventory sync: http://localhost:${PORT}/api/inventory/sync`
      );

      console.log(
        `GraphQL endpoint: http://localhost:${PORT}/graphql`
      );
    }
  );
}

async function shutDownServer(
  signal: string
) {
  console.log(
    `${signal} received. Disconnecting from PostgreSQL.`
  );

  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutDownServer("SIGINT");
});

process.on("SIGTERM", () => {
  void shutDownServer("SIGTERM");
});

startServer().catch(
  async (error: unknown) => {
    console.error(
      "Failed to start ShelfSync API:",
      error
    );

    await prisma.$disconnect();
    process.exit(1);
  }
);