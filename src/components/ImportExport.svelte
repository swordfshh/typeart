<script lang="ts">
	import { keymapStore } from '$lib/stores/keymap.svelte.js';
	import { definitionStore } from '$lib/stores/definition.svelte.js';
	import { exportKeymap, parseImportedKeymap, downloadJson } from '$lib/utils/export.js';

	let fileInput: HTMLInputElement;
	let importError = $state('');

	function handleExport() {
		const def = definitionStore.definition;
		if (!def || keymapStore.keymap.length === 0) return;

		const data = exportKeymap(
			def.name,
			def.vendorId,
			def.productId,
			keymapStore.keymap,
			keymapStore.encoderKeymap.length > 0 ? keymapStore.encoderKeymap : undefined
		);

		downloadJson(data, `${def.name.toLowerCase().replace(/\s+/g, '-')}-keymap.json`);
	}

	function handleImportClick() {
		fileInput.click();
	}

	async function handleFileSelect(e: Event) {
		importError = '';
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const data = parseImportedKeymap(text);
			await keymapStore.importKeymap(data.keymap, data.encoders);
		} catch (err) {
			importError = err instanceof Error ? err.message : 'Import failed';
		}

		// Reset the input so the same file can be selected again
		input.value = '';
	}
</script>

<div class="import-export">
	<button class="btn" onclick={handleExport}>Export Keymap</button>
	<button class="btn" onclick={handleImportClick}>Import Keymap</button>
	<input
		bind:this={fileInput}
		type="file"
		accept=".json"
		style="display: none"
		onchange={handleFileSelect}
	/>
	{#if importError}
		<span class="error">{importError}</span>
	{/if}
</div>

<style>
	.import-export {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn {
		padding: 6px 12px;
		font-size: 0.8125rem;
		border-radius: var(--radius-md);
		background-color: var(--base03);
		color: var(--base00);
		border: 1px solid var(--base01);
		transition: border-color 100ms ease, color 100ms ease;
	}

	.btn:hover {
		border-color: var(--base0);
		color: var(--base0);
	}

	.error {
		font-size: 0.75rem;
		color: var(--red);
	}
</style>
