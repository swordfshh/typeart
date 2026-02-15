<script lang="ts">
	import { page } from '$app/state';

	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	const token = $derived(page.url.searchParams.get('token') || '');

	async function handleSubmit() {
		error = '';
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		if (!token) {
			error = 'Invalid reset link';
			return;
		}
		loading = true;
		try {
			const res = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, password })
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error || 'Something went wrong';
				return;
			}
			success = true;
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password — TypeArt</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<h2 class="title">Reset password</h2>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		{#if success}
			<p class="success">Password reset successfully. You can now log in.</p>
			<a href="/login" class="back-link">Go to login</a>
		{:else if !token}
			<p class="error">Invalid reset link. Please request a new one.</p>
			<a href="/forgot-password" class="back-link">Request new link</a>
		{:else}
			<form onsubmit={handleSubmit}>
				<label>
					New Password
					<input type="password" bind:value={password} required minlength="8" autocomplete="new-password" />
				</label>
				<label>
					Confirm Password
					<input type="password" bind:value={confirmPassword} required minlength="8" autocomplete="new-password" />
				</label>
				<button type="submit" class="submit" disabled={loading}>
					{loading ? 'Resetting...' : 'Reset Password'}
				</button>
			</form>
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

	form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--base00);
	}

	input {
		padding: 10px 12px;
		font-size: 0.9rem;
		font-family: inherit;
		border: 1px solid var(--base01);
		border-radius: var(--radius-sm);
		background: var(--base03);
		color: var(--base1);
		outline: none;
		transition: border-color 150ms ease;
	}

	input:focus {
		border-color: var(--blue);
	}

	.submit {
		margin-top: 8px;
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

	.error {
		background: color-mix(in srgb, var(--red) 15%, transparent);
		color: var(--red);
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		font-weight: 500;
		margin-bottom: 8px;
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

	.back-link {
		display: inline-block;
		margin-top: 16px;
		font-size: 0.8rem;
		color: var(--blue);
	}
</style>
