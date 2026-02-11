<script lang="ts">
	import { onMount } from 'svelte';
	import { deviceStore } from '$lib/stores/device.svelte.js';
	import { keymapStore } from '$lib/stores/keymap.svelte.js';
	import { definitionStore } from '$lib/stores/definition.svelte.js';
	import type { ParsedKey } from '$lib/keyboard/types.js';
	import ConnectionStatus from '../../components/ConnectionStatus.svelte';
	import KeyboardLayout from '../../components/KeyboardLayout.svelte';
	import KeycodePicker from '../../components/KeycodePicker.svelte';
	import LayerSelector from '../../components/LayerSelector.svelte';
	import ImportExport from '../../components/ImportExport.svelte';

	let loadError = $state('');
	let wasConnected = false;

	onMount(async () => {
		await definitionStore.loadRegistry();
		// Try auto-reconnect
		await deviceStore.reconnect();
		if (deviceStore.isConnected) {
			wasConnected = true;
			await handleDeviceConnected();
		}
	});

	// Watch for connection changes
	$effect(() => {
		const connected = deviceStore.isConnected;
		if (connected && !wasConnected) {
			wasConnected = true;
			handleDeviceConnected();
		}
		if (!connected && wasConnected) {
			wasConnected = false;
			keymapStore.reset();
		}
	});

	async function handleDeviceConnected() {
		loadError = '';
		const info = deviceStore.transport?.deviceInfo;
		if (!info) return;

		// Try to auto-detect definition
		const found = await definitionStore.loadForDevice(info.vendorId, info.productId);
		if (!found && definitionStore.registry.length > 0) {
			// Fall back to first available definition
			await definitionStore.loadDefinition(definitionStore.registry[0].path);
		}

		if (!definitionStore.definition) {
			loadError = 'No keyboard definition found for this device.';
			return;
		}

		// Load keymap from device
		try {
			await keymapStore.loadFromDevice(definitionStore.rows, definitionStore.cols);
		} catch (err) {
			loadError = `Failed to read keymap: ${err instanceof Error ? err.message : 'unknown error'}`;
		}
	}

	async function handleManualLoad(path: string) {
		loadError = '';
		await definitionStore.loadDefinition(path);
		if (deviceStore.isConnected && definitionStore.definition) {
			await keymapStore.loadFromDevice(definitionStore.rows, definitionStore.cols);
		}
	}

	function handleKeyClick(key: ParsedKey) {
		if (!deviceStore.isConnected) return;
		keymapStore.selectKey(key);
	}

	async function handleKeycodeSelect(keycode: number) {
		const sel = keymapStore.selectedKey;
		if (!sel) return;
		await keymapStore.setKeycode(sel.layer, sel.row, sel.col, keycode);
	}

	function getKeycode(row: number, col: number): number {
		return keymapStore.getKeycode(keymapStore.activeLayer, row, col);
	}
</script>

<div class="configure-page">
	<ConnectionStatus />

	{#if loadError}
		<div class="error-banner">{loadError}</div>
	{/if}

	{#if !deviceStore.isConnected && definitionStore.registry.length > 0}
		<div class="definition-selector">
			<p class="hint">Or load a keyboard definition to browse offline:</p>
			<div class="def-list">
				{#each definitionStore.registry as entry}
					<button class="def-btn" onclick={() => handleManualLoad(entry.path)}>
						{entry.name}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if definitionStore.definition}
		<div class="editor">
			<div class="editor-header">
				<h2>{definitionStore.definition.name}</h2>
				{#if keymapStore.layerCount > 0}
					<ImportExport />
				{/if}
			</div>

			{#if definitionStore.layoutOptions.length > 0}
				<div class="layout-options">
					{#each definitionStore.layoutOptions as opt, i}
						<label class="option-group">
							<span class="option-label">{opt.label}</span>
							<select
								value={definitionStore.layoutOptionValues[i]}
								onchange={(e) =>
									definitionStore.setLayoutOption(i, parseInt((e.target as HTMLSelectElement).value))}
							>
								{#each opt.choices as choice, ci}
									<option value={ci}>{choice}</option>
								{/each}
							</select>
						</label>
					{/each}
				</div>
			{/if}

			{#if keymapStore.layerCount > 0}
				<LayerSelector
					layerCount={keymapStore.layerCount}
					activeLayer={keymapStore.activeLayer}
					onselect={(layer) => keymapStore.setActiveLayer(layer)}
				/>
			{/if}

			<div class="layout-container">
				{#if keymapStore.loading || definitionStore.loading}
					<div class="loading">Loading keymap...</div>
				{:else}
					<KeyboardLayout
						keys={definitionStore.activeKeys}
						keycodes={getKeycode}
						selectedRow={keymapStore.selectedKey?.row ?? -1}
						selectedCol={keymapStore.selectedKey?.col ?? -1}
						onkeyclick={handleKeyClick}
					/>
				{/if}
			</div>

			{#if keymapStore.layerCount > 0}
				<div class="picker-container">
					<KeycodePicker
						currentKeycode={keymapStore.selectedKey
							? keymapStore.getKeycode(
									keymapStore.selectedKey.layer,
									keymapStore.selectedKey.row,
									keymapStore.selectedKey.col
								)
							: 0}
						onselect={handleKeycodeSelect}
					/>
				</div>
			{/if}
		</div>
	{:else if !definitionStore.loading}
		<div class="empty-state">
			<p>Connect a VIA-compatible keyboard to start editing keymaps.</p>
		</div>
	{/if}
</div>

<style>
	.configure-page {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.error-banner {
		padding: 12px 16px;
		background-color: color-mix(in srgb, var(--base02) 90%, var(--red));
		border: 1px solid var(--red);
		border-radius: var(--radius-md);
		color: var(--red);
		font-size: 0.875rem;
	}

	.definition-selector {
		padding: 16px;
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-md);
	}

	.hint {
		font-size: 0.875rem;
		color: var(--base00);
		margin-bottom: 12px;
	}

	.def-list {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.def-btn {
		padding: 8px 16px;
		font-size: 0.875rem;
		background-color: var(--base03);
		border: 1px solid var(--base01);
		border-radius: var(--radius-md);
		color: var(--base0);
		transition: border-color 100ms ease;
	}

	.def-btn:hover {
		border-color: var(--blue);
	}

	.editor {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.editor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.editor-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--base1);
	}

	.layout-options {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		padding: 12px 16px;
		background-color: var(--base02);
		border-radius: var(--radius-md);
	}

	.option-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.option-label {
		font-size: 0.8125rem;
		color: var(--base00);
	}

	.option-group select {
		padding: 4px 8px;
		font-size: 0.8125rem;
		background-color: var(--base03);
		border: 1px solid var(--base01);
		border-radius: var(--radius-sm);
		color: var(--base0);
		outline: none;
	}

	.option-group select:focus {
		border-color: var(--blue);
	}

	.layout-container {
		padding: 24px;
		background-color: var(--base03);
		border: 1px solid var(--base01);
		border-radius: var(--radius-lg);
		overflow-x: auto;
		min-height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading {
		color: var(--base00);
		font-size: 0.875rem;
	}

	.empty-state {
		text-align: center;
		padding: 48px;
		color: var(--base00);
	}
</style>
