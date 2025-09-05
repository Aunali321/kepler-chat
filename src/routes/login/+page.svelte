<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Icons from '$lib/components/icons';
	import { authClient } from '$lib/backend/auth/client.js';
	import EmailAuthForm from '$lib/components/auth/email-auth-form.svelte';
	import DeviconGoogle from '~icons/devicon/google';
	import MailIcon from '~icons/lucide/mail';

	let showEmailForm = $state(false);

	async function signInGitHub() {
		await authClient.signIn.social({ provider: 'github', callbackURL: '/chat' });
	}

	async function signInGoogle() {
		await authClient.signIn.social({ provider: 'google', callbackURL: '/chat' });
	}
</script>

<div class="flex h-svh flex-col place-items-center justify-center gap-6 p-4">
	<div class="text-center">
		<h1 class="text-2xl font-bold">Sign in to thom.chat</h1>
		<p class="text-muted-foreground text-sm mt-2">Choose your preferred sign-in method</p>
	</div>

	{#if !showEmailForm}
		<div class="flex w-full max-w-sm flex-col gap-3">
			<Button variant="outline" onClickPromise={signInGoogle} class="w-full">
				<DeviconGoogle /> Continue with Google
			</Button>
			<Button variant="outline" onClickPromise={signInGitHub} class="w-full">
				<Icons.GitHub /> Continue with GitHub
			</Button>
			<Button 
				variant="outline" 
				onclick={() => showEmailForm = true}
				class="w-full"
			>
				<MailIcon /> Continue with Email
			</Button>
		</div>
	{:else}
		<EmailAuthForm />
		<Button 
			variant="ghost" 
			onclick={() => showEmailForm = false}
			class="text-muted-foreground text-sm"
		>
			← Back to other options
		</Button>
	{/if}
</div>
