const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_BASE_URL is missing from the mobile .env file."
  );
}

export const API_BASE_URL =
  apiBaseUrl.replace(/\/+$/, "");

export const GRAPHQL_URL =
  `${API_BASE_URL}/graphql`;

export const INVENTORY_SYNC_URL =
  `${API_BASE_URL}/api/inventory/sync`;