<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte.js';

	let loading = $state(true);
	let error = $state('');
	let success = $state(false);
	let resending = $state(false);
	let resent = $state(false);

	const token = $derived(page.url.searchParams.get('token') || '');

	onMount(async () => {
		if (!token) {
			error = 'Invalid verification link';
			loading = false;
			return;
		}

		try {
			const res = await fetch('/api/auth/verify-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error || 'Verification failed';
				return;
			}
			success = true;
			// Refresh user state so email_verified updates
			await authStore.fetchUser();
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	});

	async function handleResend() {
		resending = true;
		resent = false;
		try {
			const res = await fetch('/api/auth/resend-verification', {
				method: 'POST'
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error || 'Could not resend';
				return;
			}
			resent = true;
		} catch {
			error = 'Network error';
		} finally {
			resending = false;
		}
	}
</script>

<svelte:head>
	<title>Verify Email — TypeArt</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<h2 class="title">Email verification</h2>

		{#if loading}
			<p class="info">Verifying your email...</p>
		{:else if success}
			<p class="success">Email verified successfully!</p>
			<a href="/store" class="back-link">Browse the store</a>
		{:else}
			{#if error}
				<p class="error">{error}</p>
			{/if}
			{#if resent}
				<p class="success">Verification email sent. Check your inbox.</p>
			{:else if authStore.loggedIn}
				<button class="submit" onclick={handleResend} disabled={resending}>
					{resending ? 'Sending...' : 'Resend verification email'}
				</button>
			{:else}
				<p class="info">
					<a href="/login" class="back-link">Log in</a> to resend the verification email.
				</p>
			{/if}
		{/if}
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		justify-content: center;
		padding-top: 60px;
	}

	.auth-card {
		width: 100%;
		max-width: 400px;
		background: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-lg);
		padding: 32px;
		box-shadow: var(--shadow-md);
	}

	.title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--base1);
		margin-bottom: 20px;
	}

	.info {
		font-size: 0.85rem;
		color: var(--base00);
	}

	.error {
		background: color-mix(in srgb, var(--red) 15%, transparent);
		color: var(--red);
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		font-weight: 500;
		margin-bottom: 16px;
	}

	.success {
		background: color-mix(in srgb, var(--green) 15%, transparent);
		color: var(--green);
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		font-weight: 500;
		margin-bottom: 16px;
	}

	.submit {
		width: 100%;
		padding: 12px;
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--on-accent);
		background: var(--blue);
		border-radius: var(--radius-sm);
		transition: filter 150ms ease;
	}

	.submit:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.back-link {
		display: inline-block;
		margin-top: 8px;
		font-size: 0.85rem;
		color: var(--blue);
	}
</style>
