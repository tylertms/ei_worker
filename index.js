const proto = require('./ei_pb');
const decoder = new TextDecoder('utf-8');
const baseURL = "https://ctx-dot-auxbrainhome.appspot.com"

//This must be updated since cloudflare workers can't read directories or do dynamic imports
const handlers = {
	"contract": await import('./handlers/contract.js'), 
	"backup": await import('./handlers/backup.js'), 
	"periodicals": await import('./handlers/periodicals.js'), 
	"archive": await import('./handlers/archive.js'),
	"minmaxCxPChange": await import('./handlers/minmaxCxPChange.js'),
	"activeArtifacts": await import('./handlers/activeArtifacts.js'),
	"yonFarmInfo": await import('./handlers/yonFarmInfo.js')
}

async function handleRequest(request) {
	const path = new URL(request.url).pathname.substring(1);

	try {
		let handler = handlers[path]
		if (handler === undefined) {
			return new Response("Error: Endpoint \"" + path + "\" not found.", { status: 404 });
		}
		return handlers[path].handle(request, { proto, baseURL, decoder });
	} catch (error) {
		return new Response(error, { status: 404 });
	}
    
}

export default {
	fetch: handleRequest
};