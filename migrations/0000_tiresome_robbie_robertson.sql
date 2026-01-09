CREATE TABLE "erc20_transfers" (
	"blockNumber" integer NOT NULL,
	"txHash" varchar(66) NOT NULL,
	"logIndex" integer NOT NULL,
	"timestamp" bigint NOT NULL,
	"from" varchar(42) NOT NULL,
	"to" varchar(42) NOT NULL,
	"value" numeric NOT NULL,
	"tokenAddress" varchar(42) NOT NULL,
	CONSTRAINT "erc20_transfers_blockNumber_txHash_logIndex_pk" PRIMARY KEY("blockNumber","txHash","logIndex")
);
--> statement-breakpoint
CREATE TABLE "uniswap_v3_swaps" (
	"blockNumber" integer NOT NULL,
	"txHash" varchar(66) NOT NULL,
	"logIndex" integer NOT NULL,
	"timestamp" bigint NOT NULL,
	"pool" varchar(42) NOT NULL,
	"token0" varchar(42) NOT NULL,
	"token1" varchar(42) NOT NULL,
	"tick" integer NOT NULL,
	CONSTRAINT "uniswap_v3_swaps_blockNumber_txHash_logIndex_pk" PRIMARY KEY("blockNumber","txHash","logIndex")
);
