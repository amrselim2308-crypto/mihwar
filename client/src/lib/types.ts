import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type CurrentUser = NonNullable<RouterOutputs["auth"]["me"]>;
export type Teacher = RouterOutputs["teachers"]["search"][number];
export type Student = RouterOutputs["students"]["mine"][number];
export type Booking = RouterOutputs["bookings"]["mine"][number];
