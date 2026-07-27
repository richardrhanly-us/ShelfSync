import { GRAPHQL_URL } from "./api";

type GraphQLError = {
  message: string;
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLError[];
};

export async function graphqlRequest<
  TData,
  TVariables extends Record<
    string,
    unknown
  > = Record<string, never>,
>(
  query: string,
  variables?: TVariables
): Promise<TData> {
  const response = await fetch(
    GRAPHQL_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    }
  );

  let responseBody: GraphQLResponse<TData>;

  try {
    responseBody =
      (await response.json()) as
        GraphQLResponse<TData>;
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new Error(
      responseBody.errors?.[0]?.message ??
        `The server returned status ${response.status}.`
    );
  }

  if (
    responseBody.errors &&
    responseBody.errors.length > 0
  ) {
    throw new Error(
      responseBody.errors[0]?.message ??
        "The GraphQL request failed."
    );
  }

  if (!responseBody.data) {
    throw new Error(
      "The GraphQL response did not contain data."
    );
  }

  return responseBody.data;
}