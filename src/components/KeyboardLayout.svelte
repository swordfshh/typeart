<script lang="ts">
	import type { ParsedKey } from '$lib/keyboard/types.js';
	import Key from './Key.svelte';

	interface Props {
		keys: ParsedKey[];
		keycodes: (key: ParsedKey) => number;
		selectedKey?: ParsedKey | null;
		pressedKeys?: Set<string>;
		unitSize?: number;
		onkeyclick?: (key: ParsedKey) => void;
	}

	let {
		keys,
		keycodes,
		selectedKey = null,
		pressedKeys = new Set<string>(),
		unitSize = 54,
		onkeyclick
	}: Props = $props();

	function keyId(key: ParsedKey): string {
		if (key.encoder) return `enc:${key.encoder.id}:${key.encoder.direction}`;
		return `${key.row},${key.col}`;
	}

	function isSelected(key: ParsedKey): boolean {
		if (!selectedKey) return false;
		return keyId(key) === keyId(selectedKey);
	}

	/** Calculate the bounding box to size the container, accounting for offset */
	const bounds = $derived.by(() => {
		if (keys.length === 0) return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
		let minX = Infinity;
		let minY = Infinity;
		let maxX = 0;
		let maxY = 0;
		for (const key of keys) {
			if (key.x < minX) minX = key.x;
			if (key.y < minY) minY = key.y;
			const right = key.x + key.w;
			const bottom = key.y + key.h;
			if (right > maxX) maxX = right;
			if (bottom > maxY) maxY = bottom;
		}
		return {
			width: (maxX - minX) * unitSize,
			height: (maxY - minY) * unitSize,
			offsetX: minX * unitSize,
			offsetY: minY * unitSize
		};
	});
</script>

<div class="keyboard-layout" style:width="{bounds.width}px" style:height="{bounds.height}px">
	<div class="keyboard-offset" style:transform="translate({-bounds.offsetX}px, {-bounds.offsetY}px)">
		{#each keys as key (keyId(key))}
			<Key
				parsedKey={key}
				keycode={keycodes(key)}
				selected={isSelected(key)}
				pressed={pressedKeys.has(keyId(key))}
				{unitSize}
				onclick={() => onkeyclick?.(key)}
			/>
		{/each}
	</div>
</div>

<style>
	.keyboard-layout {
		position: relative;
		margin: 0 auto;
		overflow: hidden;
	}

	.keyboard-offset {
		position: relative;
		width: max-content;
		height: 100%;
	}
</style>
