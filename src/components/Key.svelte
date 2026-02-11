<script lang="ts">
	import type { ParsedKey } from '$lib/keyboard/types.js';
	import { getKeycodeLabel } from '$lib/keycodes/labels.js';

	interface Props {
		parsedKey: ParsedKey;
		keycode: number;
		selected?: boolean;
		pressed?: boolean;
		unitSize?: number;
		onclick?: () => void;
	}

	let { parsedKey, keycode, selected = false, pressed = false, unitSize = 54, onclick }: Props = $props();

	const label = $derived(getKeycodeLabel(keycode));
	const isEncoder = $derived(!!parsedKey.encoder);
	const dirLabel = $derived(
		parsedKey.encoder?.direction === 0 ? '\u21ba' :
		parsedKey.encoder?.direction === 1 ? '\u21bb' :
		''
	);

	const titleText = $derived.by(() => {
		if (parsedKey.encoder) {
			const dir = parsedKey.encoder.direction === 0 ? 'CCW' : 'CW';
			return `Encoder ${parsedKey.encoder.id} ${dir}: 0x${keycode.toString(16).padStart(4, '0')}`;
		}
		return `${parsedKey.row},${parsedKey.col}: 0x${keycode.toString(16).padStart(4, '0')}`;
	});

	const style = $derived.by(() => {
		const gap = 4;
		const x = parsedKey.x * unitSize;
		const y = parsedKey.y * unitSize;
		const w = parsedKey.w * unitSize - gap;
		const h = parsedKey.h * unitSize - gap;

		let transform = '';
		if (parsedKey.r !== 0) {
			const ox = parsedKey.rx * unitSize;
			const oy = parsedKey.ry * unitSize;
			transform = `transform-origin: ${ox - x}px ${oy - y}px; transform: rotate(${parsedKey.r}deg);`;
		}

		return `left: ${x}px; top: ${y}px; width: ${w}px; height: ${h}px; ${transform}`;
	});

	const fontSize = $derived(parsedKey.w < 1.5 ? '0.625rem' : '0.6875rem');
</script>

<button
	class="key"
	class:selected
	class:pressed
	class:encoder={isEncoder}
	{style}
	onclick={onclick}
	title={titleText}
>
	{#if isEncoder}
		<span class="encoder-dir">{dirLabel}</span>
	{/if}
	<span class="label" style:font-size={fontSize}>{label}</span>
</button>

<style>
	.key {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-sm);
		color: var(--base0);
		padding: 2px;
		cursor: pointer;
		transition: border-color 100ms ease, background-color 100ms ease, box-shadow 100ms ease;
		user-select: none;
		overflow: hidden;
	}

	.key:hover {
		border-color: var(--blue);
		background-color: color-mix(in srgb, var(--base02) 85%, var(--blue));
	}

	.key.selected {
		border-color: var(--yellow);
		background-color: color-mix(in srgb, var(--base02) 80%, var(--yellow));
		box-shadow: 0 0 0 2px var(--yellow);
	}

	.key.pressed {
		border-color: var(--cyan);
		background-color: color-mix(in srgb, var(--base02) 70%, var(--cyan));
	}

	.key.encoder {
		border-radius: 50%;
		border-color: var(--violet);
	}

	.key.encoder:hover {
		border-color: var(--blue);
		background-color: color-mix(in srgb, var(--base02) 85%, var(--blue));
	}

	.key.encoder.selected {
		border-color: var(--yellow);
	}

	.encoder-dir {
		font-size: 0.5rem;
		color: var(--base01);
		position: absolute;
		top: 2px;
		left: 0;
		right: 0;
		text-align: center;
	}

	.label {
		text-align: center;
		line-height: 1.2;
		word-break: break-word;
		overflow: hidden;
	}
</style>
