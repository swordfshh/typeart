<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Not Found' : 'Error'} — TypeArt</title>
</svelte:head>

<div class="error-page">
	<h1>{page.status}</h1>
	<p class="message">
		{#if page.status === 404}
			This page does not exist.
		{:else}
			Something went wrong.
		{/if}
	</p>
	{#if page.error?.message && page.status !== 404}
		<p class="detail">{page.error.message}</p>
	{/if}
	<a href="/" class="home-link">&larr; Back to home</a>
</div>

<style>
	.error-page {
		max-width: 720px;
		margin: 0 auto;
		padding-top: 80px;
		text-align: center;
	}

	.error-page h1 {
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-size: 4rem;
		font-weight: 700;
		color: var(--base1);
		line-height: 1;
	}

	.message {
		margin-top: 12px;
		font-size: 1.125rem;
		color: var(--base00);
	}

	.detail {
		margin-top: 8px;
		font-size: 0.875rem;
		color: var(--base00);
	}

	.home-link {
		display: inline-block;
		margin-top: 32px;
		font-size: 0.875rem;
		color: var(--blue);
	}

	.home-link:hover {
		color: var(--base1);
		text-decoration: none;
	}
</style>
