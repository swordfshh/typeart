<script lang="ts">
	import { KEYCODE_CATEGORIES } from '$lib/keycodes/catalog.js';
	import { getKeycodeLabel } from '$lib/keycodes/labels.js';

	interface Props {
		onselect: (keycode: number) => void;
	}

	let { onselect }: Props = $props();

	let mode = $state<'LT' | 'MT'>('LT');
	let selectedLayer = $state(1);
	let selectedMod = $state(0x02); // Left Shift
	let selectedKc = $state(0x002c); // Space

	const MODS = [
		{ value: 0x01, label: 'LCtrl' },
		{ value: 0x02, label: 'LShift' },
		{ value: 0x04, label: 'LAlt' },
		{ value: 0x08, label: 'LGUI' },
		{ value: 0x11, label: 'RCtrl' },
		{ value: 0x12, label: 'RShift' },
		{ value: 0x14, label: 'RAlt' },
		{ value: 0x18, label: 'RGUI' },
	];

	// Only basic keycodes (0x00-0xFF) can be used as the tap keycode
	const basicKeycodes = $derived(
		KEYCODE_CATEGORIES[0]?.keycodes.filter((kc) => kc.code > 0x01 && kc.code <= 0xff) ?? []
	);

	const computedKeycode = $derived.by(() => {
		if (mode === 'LT') {
			return 0x4000 | (selectedLayer << 8) | (selectedKc & 0xff);
		}
		return 0x2000 | (selectedMod << 8) | (selectedKc & 0xff);
	});

	const previewLabel = $derived(getKeycodeLabel(computedKeycode));

	function handleApply() {
		onselect(computedKeycode);
	}
</script>

<div class="builder">
	<div class="mode-tabs">
		<button class="mode-tab" class:active={mode === 'LT'} onclick={() => (mode = 'LT')}>
			LT (Layer Tap)
		</button>
		<button class="mode-tab" class:active={mode === 'MT'} onclick={() => (mode = 'MT')}>
			MT (Mod Tap)
		</button>
	</div>

	<div class="builder-row">
		{#if mode === 'LT'}
			<label class="field">
				<span>Hold: Layer</span>
				<select bind:value={selectedLayer}>
					{#each Array(16) as _, i}
						<option value={i}>{i}</option>
					{/each}
				</select>
			</label>
		{:else}
			<label class="field">
				<span>Hold: Modifier</span>
				<select bind:value={selectedMod}>
					{#each MODS as mod}
						<option value={mod.value}>{mod.label}</option>
					{/each}
				</select>
			</label>
		{/if}

		<label class="field tap-field">
			<span>Tap: Key</span>
			<select bind:value={selectedKc}>
				{#each basicKeycodes as entry}
					<option value={entry.code}>{entry.shortLabel} — {entry.label}</option>
				{/each}
			</select>
		</label>

		<button class="apply-btn" onclick={handleApply}>Apply</button>
	</div>

	<div class="preview">
		{previewLabel} = 0x{computedKeycode.toString(16).padStart(4, '0')}
	</div>
</div>

<style>
	.builder {
		padding: 12px;
		background-color: var(--base03);
		border: 1px solid var(--base01);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.mode-tabs {
		display: flex;
		gap: 4px;
	}

	.mode-tab {
		padding: 4px 10px;
		font-size: 0.75rem;
		border-radius: var(--radius-sm);
		color: var(--base00);
		transition: background-color 100ms ease, color 100ms ease;
	}

	.mode-tab:hover {
		background-color: var(--base02);
		color: var(--base0);
	}

	.mode-tab.active {
		background-color: var(--blue);
		color: var(--on-accent);
	}

	.builder-row {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		flex-wrap: wrap;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field span {
		font-size: 0.6875rem;
		color: var(--base00);
	}

	.field select {
		padding: 5px 8px;
		font-size: 0.8125rem;
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-sm);
		color: var(--base0);
		outline: none;
	}

	.field select:focus {
		border-color: var(--blue);
	}

	.tap-field {
		flex: 1;
		min-width: 120px;
	}

	.tap-field select {
		width: 100%;
	}

	.apply-btn {
		padding: 6px 14px;
		font-size: 0.75rem;
		font-weight: 500;
		background-color: var(--blue);
		color: var(--on-accent);
		border-radius: var(--radius-sm);
		transition: opacity 100ms ease;
	}

	.apply-btn:hover {
		opacity: 0.9;
	}

	.preview {
		font-size: 0.6875rem;
		color: var(--cyan);
		font-family: monospace;
	}
</style>
