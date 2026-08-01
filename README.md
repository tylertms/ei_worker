# ei_worker

ei_worker makes it easy to interact with the Egg, Inc. API using HTTP requests and JSON.

<https://ei_worker.tylertms.workers.dev>

## Endpoints

| Endpoint             | Parameters                    | Response                                                        |
| -------------------- | ----------------------------- | --------------------------------------------------------------- |
| `/active_artifacts`  | `eid`, optional `contract`    | Equipped artifacts                                              |
| `/active_missions`   | `eid`, optional `reset_index` | Active artifact missions                                        |
| `/afx_config`        | `eid`                         | Artifact configuration                                          |
| `/archive`           | `eid`                         | Contract archive                                                |
| `/backup`            | `eid`                         | Player backup                                                   |
| `/colleggtibles`     | `eid`                         | Colleggtible progress, tiers, and buffs                          |
| `/completed_mission` | `eid`, `mission_id`           | Completed missions                                              |
| `/contract`          | `eid`, `contract`, `coop`     | Coop status                                                     |
| `/contracts`         | `eid`                         | Active, available, and completed contract summaries             |
| `/coop_buffs`        | `eid`, `contract`, `coop`     | Deflector and SIAB totals as CSV                                |
| `/farms`             | `eid`                         | Structured home and contract farm details                       |
| `/leaderboard`       | `eid`, `scope`, `grade`       | Leaderboard data                                                |
| `/leaderboard_info`  | None                          | Leaderboard metadata                                            |
| `/minmax_cxp_change` | `eid`                         | Highest and lowest contract XP change as text                   |
| `/periodicals`       | `eid`                         | Current contracts and events                                    |
| `/season_info`       | None                          | Contract season metadata                                        |
| `/sub_status`        | `eid`                         | Subscription status                                             |
| `/yon_farm_info`     | `eid`                         | Farm, research, artifact, event, and colleggtible report as CSV |

Examples:

```text
/backup?eid=EI1234567890123456
/active_artifacts?eid=EI1234567890123456&contract=contract_id
/contract?eid=EI1234567890123456&contract=contract_id&coop=coop_name
/completed_mission?eid=EI1234567890123456&mission_id=mission_identifier
/leaderboard?eid=EI1234567890123456&scope=ALL_TIME&grade=5
/active_missions?eid=EI1234567890123456&reset_index=12
```

## Errors

Errors use this JSON shape:

```json
{
	"error": {
		"code": "missing_parameter",
		"message": "Missing required parameter: eid"
	}
}
```

## Development

Requires Node.js 22 or newer.

```
git clone https://github.com/tylertms/ei_worker.git
cd ei_worker
npm ci
npm run dev
```

Local development and integration tests read configuration from an ignored `.env` file:

```dotenv
EI_TEST_EID=EI1234567890123456
MAGIC=your_magic_value
INDEX=your_index
MARKER=your_marker
```

All four values are required by the live test suite. Configure matching Worker secrets in Cloudflare for production.

Validation commands:

```
npm audit
npm run check
npm test
npm run build
```

Live API tests are opt-in and read the private test account identifier from `.env`:

```
npm run test_integration
```

The live suite exercises every endpoint against Egg, Inc. Contract and coop identifiers are taken from the test account when available, with guaranteed nonexistent identifiers used otherwise. The completed mission check also uses a guaranteed nonexistent identifier so it cannot collect or change a real mission. The suite does not include the EID or returned account data in test output or tracked files.

Deploy with:

```
npm run deploy
```
