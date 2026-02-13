<script lang="ts">
	interface Score {
		username: string;
		wpm: number;
		accuracy: number;
		created_at: string;
	}

	let { scores = [], loading = false }: { scores: Score[]; loading: boolean } = $props();
</script>

{#if loading}
	<p class="loading">Loading leaderboard...</p>
{:else if scores.length === 0}
	<p class="empty">No scores yet. Be the first!</p>
{:else}
	<table class="leaderboard">
		<thead>
			<tr>
				<th>#</th>
				<th>User</th>
				<th>WPM</th>
				<th>Accuracy</th>
			</tr>
		</thead>
		<tbody>
			{#each scores as score, i}
				<tr>
					<td class="rank">{i + 1}</td>
					<td class="user">{score.username}</td>
					<td class="wpm">{score.wpm}</td>
					<td class="acc">{score.accuracy}%</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.leaderboard {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
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

	.rank {
		color: var(--base00);
		font-weight: 600;
		width: 40px;
	}

	.user {
		font-weight: 500;
	}

	.wpm {
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-weight: 700;
		color: var(--base1);
	}

	.acc {
		color: var(--base00);
	}

	.loading, .empty {
		text-align: center;
		color: var(--base00);
		padding: 24px;
		font-size: 0.85rem;
	}
</style>
