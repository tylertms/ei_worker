# ei_worker

ei_worker makes it easy to interact with the Egg, Inc. API using HTTP requests and JSON. The checked-in protobuf bindings target backup version 73.

Base URL: `https://ei_worker.tylertms.workers.dev`

## Public API policy

- Requests are public and require no Worker-level authentication.
- There is no rate limiting.
- Every endpoint accepts `GET` and `OPTIONS` only.
- CORS allows every origin with `Access-Control-Allow-Origin: *`.
- Account-specific responses use `Cache-Control: no-store`.
- `leaderboard_info` and `season_info` are public metadata cached for five minutes.
- Unknown, missing, conflicting, and out-of-range parameters return a structured `400` response.
- Upstream Egg, Inc. failures return `502` or `504` instead of being reported as successful responses.

Successful JSON responses use the field names produced by the official protobuf JavaScript generator. Those response fields remain camelCase because they are part of the generated protobuf interface. Worker paths, request parameters, filenames, and handwritten identifiers use snake_case.

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

`scope` accepts `0` for all time or `1` for the current season. `grade` accepts `0` through `5`, where `1` is C and `5` is AAA.

## Compatibility aliases

Legacy names still work. Alias responses include `Deprecation: true` and a `Link` header pointing to the canonical URL.

| Legacy name                  | Canonical name       |
| ---------------------------- | -------------------- |
| `/activeArtifacts`           | `/active_artifacts`  |
| `/minmaxCxPChange`           | `/minmax_cxp_change` |
| `/yonFarmInfo`               | `/yon_farm_info`     |
| `EID`                        | `eid`                |
| `resetIndex`                 | `reset_index`        |
| `id` on `/completed_mission` | `mission_id`         |

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
