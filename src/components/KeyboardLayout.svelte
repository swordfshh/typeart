<script lang="ts">
	import type { ParsedKey } from '$lib/keyboard/types.js';
	import Key from './Key.svelte';

	interface Props {
		keys: ParsedKey[];
		keycodes: (row: number, col: number) => number;
		selectedRow?: number;
		selectedCol?: number;
		pressedKeys?: Set<string>;
		unitSize?: number;
		onkeyclick?: (key: ParsedKey) => void;
	}

	let {
		keys,
		keycodes,
		selectedRow = -1,
		selectedCol = -1,
		pressedKeys = new Set<string>(),
		unitSize = 54,
		onkeyclick
	}: Props = $props();

	/** Calculate the bounding box to size the container */
	const bounds = $derived.by(() => {
		let maxX = 0;
		let maxY = 0;
		for (const key of keys) {
			const right = key.x + key.w;
			const bottom = key.y + key.h;
			if (right > maxX) maxX = right;
			if (bottom > maxY) maxY = bottom;
		}
		return {
			width: maxX * unitSize,
			height: maxY * unitSize
		};
	});
</script>

<div class="keyboard-layout" style:width="{bounds.width}px" style:height="{bounds.height}px">
	{#each keys as key (key.row + ',' + key.col + ',' + key.optionGroup + ',' + key.optionChoice)}
		<Key
			parsedKey={key}
			keycode={keycodes(key.row, key.col)}
			selected={key.row === selectedRow && key.col === selectedCol}
			pressed={pressedKeys.has(key.row + ',' + key.col)}
			{unitSize}
			onclick={() => onkeyclick?.(key)}
		/>
	{/each}
</div>

<style>
	.keyboard-layout {
		position: relative;
		margin: 0 auto;
	}
</style>
