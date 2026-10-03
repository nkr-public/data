import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CURRENT_USER_QUERY_KEY } from "./useCurrentUser";

type AppProvidersProps = {
  children: React.ReactNode;
  queryStaleTime?: number;
};

export function AppProviders({ children, queryStaleTime = 5_000 }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: queryStaleTime,
            retry: 1
          }
        }
      })
  );

  useEffect(() => {
    const handleUnauthorized = () => {
      const hadUser = queryClient.getQueryData(CURRENT_USER_QUERY_KEY) !== undefined;
      queryClient.cancelQueries();
      if (hadUser) {
        queryClient.clear();
      }
    };
    window.addEventListener("app:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("app:unauthorized", handleUnauthorized);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
