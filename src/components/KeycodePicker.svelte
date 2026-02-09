<script lang="ts">
	import { KEYCODE_CATEGORIES, type KeycodeEntry } from '$lib/keycodes/catalog.js';
	import { getKeycodeLabel } from '$lib/keycodes/labels.js';

	interface Props {
		currentKeycode: number;
		onselect: (keycode: number) => void;
		onclose: () => void;
	}

	let { currentKeycode, onselect, onclose }: Props = $props();

	let activeCategory = $state(0);
	let searchQuery = $state('');

	const filteredKeycodes = $derived.by(() => {
		const cat = KEYCODE_CATEGORIES[activeCategory];
		if (!cat) return [];

		if (!searchQuery.trim()) return cat.keycodes;

		const q = searchQuery.toLowerCase();
		return cat.keycodes.filter(
			(kc) =>
				kc.label.toLowerCase().includes(q) ||
				kc.name.toLowerCase().includes(q) ||
				kc.shortLabel.toLowerCase().includes(q)
		);
	});

	/** Search across all categories */
	const globalSearch = $derived.by(() => {
		if (!searchQuery.trim()) return null;
		const q = searchQuery.toLowerCase();
		const results: KeycodeEntry[] = [];
		for (const cat of KEYCODE_CATEGORIES) {
			for (const kc of cat.keycodes) {
				if (
					kc.label.toLowerCase().includes(q) ||
					kc.name.toLowerCase().includes(q) ||
					kc.shortLabel.toLowerCase().includes(q)
				) {
					results.push(kc);
				}
			}
		}
		return results;
	});

	const displayKeycodes = $derived(globalSearch ?? filteredKeycodes);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="picker">
	<div class="picker-header">
		<span class="current">
			Current: <strong>{getKeycodeLabel(currentKeycode)}</strong>
			<code>0x{currentKeycode.toString(16).padStart(4, '0')}</code>
		</span>
		<button class="close-btn" onclick={onclose}>×</button>
	</div>

	<input
		class="search"
		type="text"
		placeholder="Search keycodes..."
		bind:value={searchQuery}
	/>

	{#if !searchQuery.trim()}
		<div class="categories">
			{#each KEYCODE_CATEGORIES as cat, i}
				<button
					class="cat-tab"
					class:active={activeCategory === i}
					onclick={() => (activeCategory = i)}
				>
					{cat.name}
				</button>
			{/each}
		</div>
	{/if}

	<div class="keycodes-grid">
		{#each displayKeycodes as entry (entry.code)}
			<button
				class="kc-btn"
				class:active={entry.code === currentKeycode}
				onclick={() => onselect(entry.code)}
				title={`${entry.name} (0x${entry.code.toString(16).padStart(4, '0')})`}
			>
				<span class="kc-label">{entry.shortLabel}</span>
				<span class="kc-name">{entry.label}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.picker {
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-lg);
		padding: 16px;
		max-height: 400px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.picker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.current {
		font-size: 0.875rem;
		color: var(--base00);
	}

	.current strong {
		color: var(--base1);
	}

	.current code {
		font-size: 0.75rem;
		color: var(--base01);
		margin-left: 8px;
	}

	.close-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		font-size: 1.25rem;
		color: var(--base00);
		transition: background-color 100ms ease;
	}

	.close-btn:hover {
		background-color: var(--base03);
	}

	.search {
		padding: 8px 12px;
		background-color: var(--base03);
		border: 1px solid var(--base01);
		border-radius: var(--radius-md);
		color: var(--base0);
		font-size: 0.875rem;
		outline: none;
	}

	.search:focus {
		border-color: var(--blue);
	}

	.search::placeholder {
		color: var(--base01);
	}

	.categories {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.cat-tab {
		padding: 4px 10px;
		font-size: 0.75rem;
		border-radius: var(--radius-sm);
		color: var(--base00);
		transition: background-color 100ms ease, color 100ms ease;
	}

	.cat-tab:hover {
		background-color: var(--base03);
		color: var(--base0);
	}

	.cat-tab.active {
		background-color: var(--blue);
		color: var(--base03);
	}

	.keycodes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
		gap: 4px;
		overflow-y: auto;
		flex: 1;
	}

	.kc-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 6px 4px;
		background-color: var(--base03);
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		min-height: 44px;
		transition: border-color 100ms ease, background-color 100ms ease;
	}

	.kc-btn:hover {
		border-color: var(--blue);
	}

	.kc-btn.active {
		border-color: var(--yellow);
		background-color: color-mix(in srgb, var(--base03) 80%, var(--yellow));
	}

	.kc-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--base1);
	}

	.kc-name {
		font-size: 0.5625rem;
		color: var(--base01);
		margin-top: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}
</style>
