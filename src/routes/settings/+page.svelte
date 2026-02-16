<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte.js';

	// Password change
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let pwMessage = $state('');
	let pwError = $state(false);
	let pwLoading = $state(false);

	// Account deletion
	let deletePassword = $state('');
	let deleteConfirm = $state(false);
	let delMessage = $state('');
	let delError = $state(false);
	let delLoading = $state(false);

	onMount(() => {
		if (!authStore.loggedIn) {
			goto('/login');
		}
	});

	async function handleChangePassword() {
		pwMessage = '';
		pwError = false;

		if (newPassword.length < 8) {
			pwMessage = 'New password must be at least 8 characters';
			pwError = true;
			return;
		}
		if (newPassword !== confirmPassword) {
			pwMessage = 'Passwords do not match';
			pwError = true;
			return;
		}

		pwLoading = true;
		try {
			const res = await fetch('/api/auth/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword })
			});
			const data = await res.json();
			if (!res.ok) {
				pwMessage = data.error || 'Failed to change password';
				pwError = true;
			} else {
				pwMessage = 'Password changed successfully';
				pwError = false;
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
			}
		} catch {
			pwMessage = 'Network error';
			pwError = true;
		} finally {
			pwLoading = false;
		}
	}

	async function handleDeleteAccount() {
		delMessage = '';
		delError = false;

		if (!deletePassword) {
			delMessage = 'Enter your password to confirm';
			delError = true;
			return;
		}

		delLoading = true;
		try {
			const res = await fetch('/api/auth/delete-account', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: deletePassword })
			});
			const data = await res.json();
			if (!res.ok) {
				delMessage = data.error || 'Failed to delete account';
				delError = true;
			} else {
				authStore.user = null;
				goto('/');
			}
		} catch {
			delMessage = 'Network error';
			delError = true;
		} finally {
			delLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Settings — TypeArt</title>
</svelte:head>

<div class="settings-page">
	<h1>Settings</h1>

	<section class="section">
		<h2>Change Password</h2>
		<form onsubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
			<label>
				<span>Current password</span>
				<input type="password" bind:value={currentPassword} autocomplete="current-password" />
			</label>
			<label>
				<span>New password</span>
				<input type="password" bind:value={newPassword} autocomplete="new-password" />
			</label>
			<label>
				<span>Confirm new password</span>
				<input type="password" bind:value={confirmPassword} autocomplete="new-password" />
			</label>
			{#if pwMessage}
				<p class="message" class:error={pwError}>{pwMessage}</p>
			{/if}
			<button type="submit" class="btn" disabled={pwLoading}>
				{pwLoading ? 'Changing...' : 'Change Password'}
			</button>
		</form>
	</section>

	<section class="section danger-section">
		<h2>Delete Account</h2>
		<p class="warning">This will permanently delete your account, scores, and order history. This cannot be undone.</p>
		{#if !deleteConfirm}
			<button class="btn btn-danger" onclick={() => deleteConfirm = true}>Delete my account</button>
		{:else}
			<form onsubmit={(e) => { e.preventDefault(); handleDeleteAccount(); }}>
				<label>
					<span>Enter your password to confirm</span>
					<input type="password" bind:value={deletePassword} autocomplete="current-password" />
				</label>
				{#if delMessage}
					<p class="message error">{delMessage}</p>
				{/if}
				<div class="delete-actions">
					<button type="button" class="btn btn-cancel" onclick={() => { deleteConfirm = false; deletePassword = ''; delMessage = ''; }}>Cancel</button>
					<button type="submit" class="btn btn-danger" disabled={delLoading}>
						{delLoading ? 'Deleting...' : 'Permanently Delete'}
					</button>
				</div>
			</form>
		{/if}
	</section>
</div>

<style>
	.settings-page {
		max-width: 480px;
		margin: 0 auto;
		padding-top: 48px;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.03em;
		margin-bottom: 32px;
	}

	.section {
		margin-bottom: 40px;
		padding: 24px;
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-lg);
	}

	h2 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--base1);
		margin-bottom: 16px;
	}

	label {
		display: block;
		margin-bottom: 12px;
	}

	label span {
		display: block;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--base00);
		margin-bottom: 4px;
	}

	input {
		width: 100%;
		padding: 8px 12px;
		font-size: 0.875rem;
		font-family: inherit;
		background: var(--base03);
		border: 1px solid var(--base01);
		border-radius: var(--radius-sm);
		color: var(--base0);
	}

	input:focus {
		outline: none;
		border-color: var(--blue);
	}

	.btn {
		padding: 8px 20px;
		font-size: 0.85rem;
		font-weight: 600;
		font-family: inherit;
		border-radius: var(--radius-sm);
		background: var(--base01);
		color: var(--base1);
		cursor: pointer;
		transition: filter 150ms ease;
	}

	.btn:hover {
		filter: brightness(1.1);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-danger {
		background: var(--red);
		color: var(--on-accent);
	}

	.btn-cancel {
		background: var(--base01);
		color: var(--base0);
	}

	.message {
		font-size: 0.8rem;
		color: var(--green);
		margin-bottom: 12px;
	}

	.message.error {
		color: var(--red);
	}

	.warning {
		font-size: 0.8rem;
		color: var(--base00);
		margin-bottom: 16px;
		line-height: 1.5;
	}

	.danger-section {
		border-color: color-mix(in srgb, var(--red) 30%, var(--base01));
	}

	.delete-actions {
		display: flex;
		gap: 8px;
	}
</style>
