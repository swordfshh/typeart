<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { goto } from '$app/navigation';

	let tab: 'login' | 'register' = $state('login');
	let email = $state('');
	let password = $state('');
	let username = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin() {
		error = '';
		loading = true;
		try {
			await authStore.login(email, password);
			goto('/type');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login failed';
		} finally {
			loading = false;
		}
	}

	async function handleRegister() {
		error = '';
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		loading = true;
		try {
			await authStore.register(username, email, password);
			goto('/type');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Registration failed';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Log In — TypeArt</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<div class="tabs">
			<button class="tab" class:active={tab === 'login'} onclick={() => { tab = 'login'; error = ''; }}>Log In</button>
			<button class="tab" class:active={tab === 'register'} onclick={() => { tab = 'register'; error = ''; }}>Register</button>
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		{#if tab === 'login'}
			<form onsubmit={handleLogin}>
				<label>
					Email
					<input type="email" bind:value={email} required autocomplete="email" />
				</label>
				<label>
					Password
					<input type="password" bind:value={password} required autocomplete="current-password" />
				</label>
				<a href="/forgot-password" class="forgot-link">Forgot password?</a>
				<button type="submit" class="submit" disabled={loading}>
					{loading ? 'Logging in...' : 'Log In'}
				</button>
			</form>
		{:else}
			<form onsubmit={handleRegister}>
				<label>
					Username
					<input type="text" bind:value={username} required minlength="2" maxlength="30" autocomplete="username" />
				</label>
				<label>
					Email
					<input type="email" bind:value={email} required autocomplete="email" />
				</label>
				<label>
					Password
					<input type="password" bind:value={password} required minlength="8" autocomplete="new-password" />
				</label>
				<label>
					Confirm Password
					<input type="password" bind:value={confirmPassword} required minlength="8" autocomplete="new-password" />
				</label>
				<button type="submit" class="submit" disabled={loading}>
					{loading ? 'Creating account...' : 'Register'}
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

	.tabs {
		display: flex;
		gap: 0;
		margin-bottom: 24px;
		border-bottom: 2px solid var(--base01);
	}

	.tab {
		flex: 1;
		padding: 10px;
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--base00);
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		transition: color 150ms ease, border-color 150ms ease;
	}

	.tab.active {
		color: var(--base1);
		border-bottom-color: var(--blue);
	}

	.tab:hover:not(.active) {
		color: var(--base0);
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

	.forgot-link {
		font-size: 0.8rem;
		color: var(--blue);
		text-align: right;
		margin-top: -8px;
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
</style>
