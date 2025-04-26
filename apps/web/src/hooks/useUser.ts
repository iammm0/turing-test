import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/user";

export const useCurrentUser = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
  });
