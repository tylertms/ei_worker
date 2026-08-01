# ei_worker

ei_worker makes it easy to interact with the Egg, Inc. API using HTTP requests and JSON. The checked-in protobuf bindings target backup version 73.

Base URL: `https://ei_worker.tylertms.workers.dev`

## Endpoints

| Endpoint             | Parameters                    | Response                                                        |
| -------------------- | ----------------------------- | --------------------------------------------------------------- |
| `/active_artifacts`  | `eid`, optional `contract`    | Equipped artifacts as JSON                                      |
| `/active_missions`   | `eid`, optional `reset_index` | Active artifact missions as JSON                                |
| `/afx_config`        | `eid`                         | Artifact configuration as JSON                                  |
| `/archive`           | `eid`                         | Contract archive as JSON                                        |
| `/backup`            | `eid`                         | Player backup as JSON                                           |
| `/completed_mission` | `eid`, `mission_id`           | Completed mission as JSON                                       |
| `/contract`          | `eid`, `contract`, `coop`     | Coop status as JSON                                             |
| `/coop_buffs`        | `eid`, `contract`, `coop`     | Deflector and SIAB totals as CSV                                |
| `/leaderboard`       | `eid`, `scope`, `grade`       | Leaderboard as JSON                                             |
| `/leaderboard_info`  | None                          | Leaderboard metadata as JSON                                    |
| `/minmax_cxp_change` | `eid`                         | Highest and lowest contract XP change as text                   |
| `/periodicals`       | `eid`                         | Current contracts and events as JSON                            |
| `/season_info`       | None                          | Contract season metadata as JSON                                |
| `/sub_status`        | `eid`                         | Subscription status as JSON                                     |
| `/yon_farm_info`     | `eid`                         | Farm, research, artifact, event, and colleggtible report as CSV |

Examples:

```text
/backup?eid=EI1234567890123456
/active_artifacts?eid=EI1234567890123456&contract=contract_id
/contract?eid=EI1234567890123456&contract=contract_id&coop=coop_name
/completed_mission?eid=EI1234567890123456&mission_id=mission_identifier
/leaderboard?eid=EI1234567890123456&scope=1&grade=5
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

```powershell
git clone https://github.com/tylertms/ei_worker.git
cd ei_worker
npm ci
npm run dev
```

Signed Egg, Inc. requests require these values in `.dev.vars` for local development and matching Worker secrets in production:

```dotenv
MAGIC=your_magic_value
INDEX=your_index
MARKER=your_marker
```

Validation commands:

```
npm audit
npm run check
npm test
npm run build
```

Deploy with:

```
npm run deploy
```
