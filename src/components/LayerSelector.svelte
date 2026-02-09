<script lang="ts">
	interface Props {
		layerCount: number;
		activeLayer: number;
		onselect: (layer: number) => void;
	}

	let { layerCount, activeLayer, onselect }: Props = $props();
</script>

<div class="layer-selector">
	{#each Array(layerCount) as _, i}
		<button
			class="layer-tab"
			class:active={activeLayer === i}
			onclick={() => onselect(i)}
		>
			Layer {i}
		</button>
	{/each}
</div>

<style>
	.layer-selector {
		display: flex;
		gap: 4px;
	}

	.layer-tab {
		padding: 8px 16px;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: var(--radius-md) var(--radius-md) 0 0;
		color: var(--base00);
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-bottom: none;
		transition: color 100ms ease, background-color 100ms ease;
	}

	.layer-tab:hover {
		color: var(--base0);
	}

	.layer-tab.active {
		color: var(--base1);
		background-color: var(--base03);
		border-color: var(--blue);
		border-bottom: 2px solid var(--base03);
		margin-bottom: -1px;
	}
</style>
