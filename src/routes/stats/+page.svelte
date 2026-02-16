<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte.js';

	interface Score {
		id: string;
		wpm: number;
		raw_wpm: number;
		accuracy: number;
		char_count: number;
		elapsed_seconds: number;
		created_at: string;
		mode: string;
		mode_param: string | null;
	}

	let bests: Score[] = $state([]);
	let recent: Score[] = $state([]);
	let loading = $state(true);
	let error = $state('');

	const modeLabels: Record<string, string> = {
		time: 'Time',
		words: 'Words',
		quote: 'Quote'
	};

	function paramLabel(mode: string, param: string | null): string {
		if (mode === 'quote') return 'Quote';
		if (param == null) return mode;
		if (mode === 'time') return `${param}s`;
		return `${param} words`;
	}

	function formatDate(iso: string): string {
		return new Date(iso + 'Z').toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatDuration(seconds: number): string {
		if (seconds < 60) return `${Math.round(seconds)}s`;
		const m = Math.floor(seconds / 60);
		const s = Math.round(seconds % 60);
		return s > 0 ? `${m}m ${s}s` : `${m}m`;
	}

	// Group bests by mode
	const groupedBests = $derived.by(() => {
		const groups: Record<string, Score[]> = {};
		for (const s of bests) {
			const label = modeLabels[s.mode] || s.mode;
			if (!groups[label]) groups[label] = [];
			groups[label].push(s);
		}
		return groups;
	});

	onMount(async () => {
		if (!authStore.loggedIn) {
			loading = false;
			return;
		}

		try {
			const [bestsRes, recentRes] = await Promise.all([
				fetch('/api/scores/me?type=bests'),
				fetch('/api/scores/me?type=recent')
			]);

			if (bestsRes.ok) {
				const data = await bestsRes.json();
				bests = data.scores;
			}
			if (recentRes.ok) {
				const data = await recentRes.json();
				recent = data.scores;
			}
		} catch {
			error = 'Failed to load stats';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Stats — TypeArt</title>
</svelte:head>

<div class="stats-page">
	{#if !authStore.loggedIn}
		<div class="auth-prompt">
			<h1>Stats</h1>
			<p>Log in to see your typing stats.</p>
			<a href="/login" class="login-link">Log in</a>
		</div>
	{:else if loading}
		<p class="loading">Loading stats...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if bests.length === 0 && recent.length === 0}
		<h1>Stats</h1>
		<div class="empty-state">
			<p>No scores yet.</p>
			<a href="/type" class="test-link">Take a typing test</a>
		</div>
	{:else}
		<h1>Stats</h1>

		{#if bests.length > 0}
			<section class="section">
				<h2>Personal Bests</h2>
				{#each Object.entries(groupedBests) as [mode, scores]}
					<h3 class="mode-label">{mode}</h3>
					<table class="stats-table">
						<thead>
							<tr>
								<th>Mode</th>
								<th>WPM</th>
								<th>Accuracy</th>
								<th>Date</th>
							</tr>
						</thead>
						<tbody>
							{#each scores as score (score.id)}
								<tr>
									<td class="param">{paramLabel(score.mode, score.mode_param)}</td>
									<td class="wpm">{score.wpm}</td>
									<td class="acc">{score.accuracy}%</td>
									<td class="date">{formatDate(score.created_at)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/each}
			</section>
		{/if}

		{#if recent.length > 0}
			<section class="section">
				<h2>Recent Scores</h2>
				<table class="stats-table">
					<thead>
						<tr>
							<th>Date</th>
							<th>Mode</th>
							<th>WPM</th>
							<th>Accuracy</th>
							<th>Chars</th>
							<th>Duration</th>
						</tr>
					</thead>
					<tbody>
						{#each recent as score (score.id)}
							<tr>
								<td class="date">{formatDate(score.created_at)}</td>
								<td class="param">{paramLabel(score.mode, score.mode_param)}</td>
								<td class="wpm">{score.wpm}</td>
								<td class="acc">{score.accuracy}%</td>
								<td class="chars">{score.char_count}</td>
								<td class="duration">{formatDuration(score.elapsed_seconds)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/if}
	{/if}
</div>

<style>
	.stats-page {
		max-width: 720px;
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

	.auth-prompt {
		text-align: center;
		padding-top: 32px;
	}

	.auth-prompt p {
		font-size: 0.9rem;
		color: var(--base00);
		margin-top: 8px;
	}

	.login-link, .test-link {
		display: inline-block;
		margin-top: 16px;
		font-size: 0.875rem;
		font-weight: 600;
		padding: 8px 20px;
		border-radius: var(--radius-sm);
		background: var(--base01);
		color: var(--base1);
		transition: filter 150ms ease;
	}

	.login-link:hover, .test-link:hover {
		filter: brightness(1.15);
		text-decoration: none;
	}

	.loading, .error {
		text-align: center;
		color: var(--base00);
		padding: 48px 0;
		font-size: 0.9rem;
	}

	.error {
		color: var(--red);
	}

	.empty-state {
		text-align: center;
		padding: 32px 0;
	}

	.empty-state p {
		font-size: 0.9rem;
		color: var(--base00);
	}

	.section {
		margin-bottom: 40px;
	}

	h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--base1);
		margin-bottom: 16px;
	}

	.mode-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--base00);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 16px 0 8px;
	}

	.stats-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
		margin-bottom: 8px;
	}

	th {
		text-align: left;
		padding: 8px 12px;
		font-weight: 600;
		color: var(--base00);
		border-bottom: 2px solid var(--base01);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	td {
		padding: 8px 12px;
		border-bottom: 1px solid var(--base01);
	}

	.wpm {
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-weight: 700;
		color: var(--base1);
	}

	.acc {
		color: var(--base00);
	}

	.param {
		font-weight: 500;
	}

	.date {
		color: var(--base00);
		font-size: 0.8rem;
	}

	.chars, .duration {
		color: var(--base00);
		font-size: 0.8rem;
	}
</style>
