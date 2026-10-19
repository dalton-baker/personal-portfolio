import { json } from '@sveltejs/kit';
import { ardManifest } from '$lib/server/agents.js';

export const prerender = true;

export function GET() {
	return json(ardManifest());
}
