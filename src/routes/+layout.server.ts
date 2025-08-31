import { loadUserModels, loadGuestModels } from '$lib/services/model-loader.server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	// Load models based on user's API keys
	const models = session?.session?.token
		? await loadUserModels(session.session.token)
		: loadGuestModels();

	return {
		session,
		models,
	};
};

// Enable SSR for better performance
export const ssr = true;
