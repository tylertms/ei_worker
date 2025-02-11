# Usage

Contact any of the following published endpoints through browser/code

- Fetch a contract archive:

	`https://ei_worker.tylertms.workers.dev/archive?EID=EIxxxxxxxxxxxxxxxx`

- Fetch a backup:

	`https://ei_worker.tylertms.workers.dev/backup?EID=EIxxxxxxxxxxxxxxxx`

- Get CSV-formatted farm overview:

	`https://ei_worker.tylertms.workers.dev/yonFarmInfo?EID=EIxxxxxxxxxxxxxxxx`

- Get current contracts and events (periodicals):

	`https://ei_worker.tylertms.workers.dev/periodicals?EID=EIxxxxxxxxxxxxxxxx`

- Get information about a contract:

	`https://ei_worker.tylertms.workers.dev/contract?EID=EIxxxxxxxxxxxxxxxx&contract=KEV-ID&coop=COOP-NAME`

- Get currently equipped artifacts (on home farm):

	`https://ei_worker.tylertms.workers.dev/activeArtifacts?EID=EIxxxxxxxxxxxxxxxx`

- Get currently equipped artifacts (on contract farm):

	`https://ei_worker.tylertms.workers.dev/activeArtifacts?EID=EIxxxxxxxxxxxxxxxx&contract=KEV-ID`

- Get highest and lowest change in CS upon rerunning contract from backup:

	`https://ei_worker.tylertms.workers.dev/minmaxCxPChange?EID=EIxxx`

- Get a CS leaderboard:

	`https://ei_worker.tylertms.workers.dev/leaderboard?EID=EIxxx&scope=scope_code&grade=[1-5]`
		- scope, as defined by the `code` variables of /get_leaderboard info
		- grade, 1 for C, 2 for B, etc.

- Get CS leaderboard info:

	`https://ei_worker.tylertms.workers.dev/leaderboard_info`

- Get artifacts config:

	`https://ei_worker.tylertms.workers.dev/afx_config?EID=EIxxx`

- Get seasonal rewards info:

	`https://ei_worker.tylertms.workers.dev/season_info`

# Installation (for development purposes)
1. Clone and open the source

	`git clone https://github.com/tylertms/ei_worker/`

	`cd ei_worker`

2. Install the required packages

   `npm install`
  
4. Run/deploy the worker
   
	`wrangler dev` / `wrangler deploy`
