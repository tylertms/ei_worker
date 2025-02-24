# Usage

Contact any of the following published endpoints through a browser or code.

**Base URL:**  
`https://ei_worker.tylertms.workers.dev`

## Backup Info's & Ultra Status
- **Fetch a contract archive:**  
  [`/archive?EID=EIxxxx`](https://ei_worker.tylertms.workers.dev/archive?EID=EIxxxx)  
- **Fetch a backup:**  
  [`/backup?EID=EIxxxx`](https://ei_worker.tylertms.workers.dev/backup?EID=EIxxxx)  
- **Check ultra status:**  
  [`/sub_status?EID=EIxxxx`](https://ei_worker.tylertms.workers.dev/sub_status?EID=EIxxxx)  

## Farm & Contract Information  
- **Get CSV-formatted farm overview:**  
  [`/yonFarmInfo?EID=EIxxxx`](https://ei_worker.tylertms.workers.dev/yonFarmInfo?EID=EIxxxx)  
- **Get current contracts and events (periodicals):**  
  [`/periodicals?EID=EIxxxx`](https://ei_worker.tylertms.workers.dev/periodicals?EID=EIxxxx)  
- **Get contract info (coop status):**  
  [`/contract?EID=EIxxxx&contract=KEV-ID&coop=COOP-NAME`](https://ei_worker.tylertms.workers.dev/contract?EID=EIxxxx&contract=KEV-ID&coop=COOP-NAME)  

## Artifacts & Configurations  
- **Get equipped artifacts (home farm):**  
  [`/activeArtifacts?EID=EIxxxx`](https://ei_worker.tylertms.workers.dev/activeArtifacts?EID=EIxxxx)  
- **Get equipped artifacts (contract farm):**  
  [`/activeArtifacts?EID=EIxxxx&contract=KEV-ID`](https://ei_worker.tylertms.workers.dev/activeArtifacts?EID=EIxxxx&contract=KEV-ID)  
- **Get artifacts config:**  
  [`/afx_config?EID=EIxxxx`](https://ei_worker.tylertms.workers.dev/afx_config?EID=EIxxxx)  
- **Get active missions:**  
  [`/active_missions?EID=EIxxxx`](https://ei_worker.tylertms.workers.dev/active_missions?EID=EIxxxx)

## CS & Leaderboards  
- **Get highest/lowest CS change from backup:**  
  [`/minmaxCxPChange?EID=EIxxxx`](https://ei_worker.tylertms.workers.dev/minmaxCxPChange?EID=EIxxxx)  
- **Get CS leaderboard:**  
  [`/leaderboard?EID=EIxxxx&scope=SCOPE&grade=GRADE`](https://ei_worker.tylertms.workers.dev/leaderboard?EID=EIxxxx&scope=SCOPE&grade=GRADE)  
  _Scope: use `/leaderboard_info` for available codes_  
  _Grade: `1` = C, `2` = B, `3` = A, `4` = AA, `5` = AAA_  
- **Get CS leaderboard info:**  
  [`/leaderboard_info`](https://ei_worker.tylertms.workers.dev/leaderboard_info)  


# Installation (for development purposes)
1. Clone and open the source

	`git clone https://github.com/tylertms/ei_worker/`

	`cd ei_worker`

2. Install the required packages

   `npm install`
  
4. Run/deploy the worker
   
	`wrangler dev` / `wrangler deploy`
