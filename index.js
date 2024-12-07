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
		const response = await handlers[path].handle(request, { proto, baseURL, decoder });

		return new Response(response.body, {
      ...response, // Preserve the existing response options
      headers: {
        ...response.headers, // Preserve existing headers
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'GET', // Allow only GET requests
        'Access-Control-Allow-Headers': 'Content-Type', // Allow specific headers
      },
    });
	} catch (error) {
		return new Response(error, { status: 500 });
	}
    
}

export default {
	fetch: handleRequest
};