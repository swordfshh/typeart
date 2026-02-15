<script lang="ts">
	let email = $state('');
	let loading = $state(false);
	let error = $state('');
	let sent = $state(false);

	async function handleSubmit() {
		error = '';
		loading = true;
		try {
			const res = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			if (!res.ok) {
				const data = await res.json();
				error = data.error || 'Something went wrong';
				return;
			}
			sent = true;
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password — TypeArt</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<h2 class="title">Forgot password</h2>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		{#if sent}
			<p class="success">If an account with that email exists, we sent a reset link. Check your inbox.</p>
			<a href="/login" class="back-link">Back to login</a>
		{:else}
			<p class="subtitle">Enter your email and we'll send you a reset link.</p>
			<form onsubmit={handleSubmit}>
				<label>
					Email
					<input type="email" bind:value={email} required autocomplete="email" />
				</label>
				<button type="submit" class="submit" disabled={loading}>
					{loading ? 'Sending...' : 'Send Reset Link'}
				</button>
			</form>
			<a href="/login" class="back-link">Back to login</a>
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
		margin-bottom: 8px;
	}

	.subtitle {
		font-size: 0.85rem;
		color: var(--base00);
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
