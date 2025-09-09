<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { authClient } from '$lib/backend/auth/client.js';
	import { goto } from '$app/navigation';

	let { mode = $bindable('sign-in') }: { mode: 'sign-in' | 'sign-up' } = $props();

	let email = $state('');
	let password = $state('');
	let name = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleSubmit(event: Event) {
		event.preventDefault();
		loading = true;
		error = '';

		try {
			if (mode === 'sign-up') {
				const result = await authClient.signUp.email({
					email,
					password,
					name,
					callbackURL: '/chat'
				});
				
				if (result.error) {
					error = result.error.message || 'Failed to create account';
				} else {
					await goto('/chat');
				}
			} else {
				const result = await authClient.signIn.email({
					email,
					password,
					callbackURL: '/chat'
				});
				
				if (result.error) {
					error = result.error.message || 'Invalid email or password';
				} else {
					await goto('/chat');
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function toggleMode() {
		mode = mode === 'sign-in' ? 'sign-up' : 'sign-in';
		error = '';
	}
</script>

<div class="w-full max-w-sm">
	<form onsubmit={handleSubmit} class="space-y-6">
		{#if mode === 'sign-up'}
			<div class="space-y-2">
				<Label for="name" class="text-sm font-medium">
					{#snippet children()}Name{/snippet}
				</Label>
				<Input
					id="name"
					type="text"
					bind:value={name}
					placeholder="Enter your name"
					required
					disabled={loading}
					class="w-full"
				/>
			</div>
		{/if}
		
		<div class="space-y-2">
			<Label for="email" class="text-sm font-medium">
				{#snippet children()}Email{/snippet}
			</Label>
			<Input
				id="email"
				type="email"
				bind:value={email}
				placeholder="Enter your email"
				required
				disabled={loading}
				class="w-full"
			/>
		</div>
		
		<div class="space-y-2">
			<Label for="password" class="text-sm font-medium">
				{#snippet children()}Password{/snippet}
			</Label>
			<Input
				id="password"
				type="password"
				bind:value={password}
				placeholder="Enter your password"
				required
				disabled={loading}
				class="w-full"
			/>
		</div>

		{#if error}
			<div class="text-destructive bg-destructive/10 border-destructive/20 text-sm p-3 rounded-lg border">
				{error}
			</div>
		{/if}

		<Button type="submit" class="w-full" {loading}>
			{mode === 'sign-in' ? 'Sign In' : 'Create Account'}
		</Button>
		
		<div class="text-center">
			<button
				type="button"
				class="text-primary hover:text-primary/80 text-sm underline-offset-4 hover:underline transition-colors"
				onclick={toggleMode}
				disabled={loading}
			>
				{mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
			</button>
		</div>
	</form>
</div>