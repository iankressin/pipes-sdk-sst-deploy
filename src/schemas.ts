import {
  bigint,
  integer,
  numeric,
  pgTable,
  primaryKey,
  varchar,
} from 'drizzle-orm/pg-core'

export const erc20TransfersTable = pgTable(
  'erc20_transfers',
  {
    blockNumber: integer().notNull(),
    txHash: varchar({ length: 66 }).notNull(),
    logIndex: integer().notNull(),
    timestamp: bigint({ mode: 'number' }).notNull(),
    from: varchar({ length: 42 }).notNull(),
    to: varchar({ length: 42 }).notNull(),
    value: numeric({ mode: 'bigint' }).notNull(),
    tokenAddress: varchar({ length: 42 }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.blockNumber, table.txHash, table.logIndex],
    }),
  ],
)

export const uniswapV3SwapsTable = pgTable(
  'uniswap_v3_swaps',
  {
    blockNumber: integer().notNull(),
    txHash: varchar({ length: 66 }).notNull(),
    logIndex: integer().notNull(),
    timestamp: bigint({ mode: 'number' }).notNull(),
    pool: varchar({ length: 42 }).notNull(),
    token0: varchar({ length: 42 }).notNull(),
    token1: varchar({ length: 42 }).notNull(),
    tick: integer().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.blockNumber, table.txHash, table.logIndex],
    }),
  ],
)

export default {
  erc20TransfersTable,
  uniswapV3SwapsTable,
}
