import { z } from "zod";

/** Generic Birdeye envelope. `data` schema varies per endpoint. */
export const BirdeyeEnvelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    data: data,
    message: z.string().optional(),
    statusCode: z.number().optional(),
  });

/** Address used by Birdeye — Solana base58 OR EVM 0x-prefixed. */
export const AddressSchema = z.string().min(1);

/** Pagination — most endpoints use offset/limit. */
export const PaginationSchema = z.object({
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/** OHLCV time intervals supported by Birdeye. */
export const TimeframeSchema = z.enum([
  "1s",
  "15s",
  "30s",
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1H",
  "2H",
  "4H",
  "6H",
  "8H",
  "12H",
  "1D",
  "3D",
  "1W",
  "1M",
]);

export type Timeframe = z.infer<typeof TimeframeSchema>;

/** Sort direction. */
export const SortTypeSchema = z.enum(["asc", "desc"]);
export type SortType = z.infer<typeof SortTypeSchema>;

/** Common time-window enum used by trader endpoints. */
export const TimeWindowSchema = z.enum([
  "1h",
  "2h",
  "4h",
  "8h",
  "24h",
  "today",
  "yesterday",
  "1d",
  "1w",
  "1m",
  "1y",
  "all",
]);
export type TimeWindow = z.infer<typeof TimeWindowSchema>;

/** Common tx_type filter. */
export const TxTypeSchema = z.enum(["swap", "add", "remove", "all"]);
