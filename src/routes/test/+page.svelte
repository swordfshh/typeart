<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { deviceStore } from '$lib/stores/device.svelte.js';
	import { definitionStore } from '$lib/stores/definition.svelte.js';
	import ConnectionStatus from '../../components/ConnectionStatus.svelte';
	import KeyboardLayout from '../../components/KeyboardLayout.svelte';

	let pressedKeys = $state(new Set<string>());
	let polling = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	onMount(async () => {
		await definitionStore.loadRegistry();
		await deviceStore.reconnect();
		if (deviceStore.isConnected) {
			await handleConnected();
		}
	});

	onDestroy(() => {
		stopPolling();
	});

	$effect(() => {
		if (deviceStore.isConnected && !polling) {
			handleConnected();
		}
		if (!deviceStore.isConnected) {
			stopPolling();
			pressedKeys = new Set();
		}
	});

	async function handleConnected() {
		const info = deviceStore.transport?.deviceInfo;
		if (!info) return;

		if (!definitionStore.definition) {
			const found = await definitionStore.loadForDevice(info.vendorId, info.productId);
			if (!found && definitionStore.registry.length > 0) {
				await definitionStore.loadDefinition(definitionStore.registry[0].path);
			}
		}

		startPolling();
	}

	function startPolling() {
		if (pollInterval) return;
		polling = true;

		pollInterval = setInterval(async () => {
			if (!deviceStore.protocol) {
				stopPolling();
				return;
			}

			try {
				const matrixState = await deviceStore.protocol.getSwitchMatrixState();
				const newPressed = new Set<string>();
				const cols = definitionStore.cols;
				const bytesPerRow = Math.ceil(cols / 8);

				// QMK packs matrix bytes big-endian: MSB first
				// For 16 cols: byte 0 = cols 8-15, byte 1 = cols 0-7
				for (let row = 0; row < definitionStore.rows; row++) {
					for (let col = 0; col < cols; col++) {
						// Reverse byte order within the row (big-endian → little-endian)
						const byteInRow = bytesPerRow - 1 - Math.floor(col / 8);
						const byteIdx = row * bytesPerRow + byteInRow;
						const bitIdx = col % 8;
						if (matrixState[byteIdx] & (1 << bitIdx)) {
							newPressed.add(`${row},${col}`);
						}
					}
				}

				pressedKeys = newPressed;
			} catch {
				// Ignore polling errors (device may disconnect)
			}
		}, 16); // ~60Hz
	}

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
		polling = false;
	}

	/** Return 0 for all keys — matrix tester only shows pressed state, not keycodes */
	function noKeycodes(_key: import('$lib/keyboard/types.js').ParsedKey): number {
		return 0;
	}
</script>

<div class="test-page">
	<ConnectionStatus />

	{#if definitionStore.definition}
		<div class="tester">
			<h2>Matrix Tester</h2>
			<p class="hint">Press keys on your keyboard to see them highlight in real-time.</p>

			{#if polling}
				<span class="polling-indicator">Polling</span>
			{/if}

			<div class="layout-container">
				<KeyboardLayout
					keys={definitionStore.activeKeys}
					keycodes={noKeycodes}
					{pressedKeys}
				/>
			</div>

			<div class="pressed-list">
				{#if pressedKeys.size > 0}
					<span class="pressed-label">Pressed:</span>
					{#each [...pressedKeys] as key}
						<span class="pressed-key">{key}</span>
					{/each}
				{:else}
					<span class="no-press">No keys pressed</span>
				{/if}
			</div>
		</div>
	{:else if deviceStore.isConnected}
		<div class="empty-state">
			<p>Loading keyboard definition...</p>
		</div>
	{:else}
		<div class="empty-state">
			<p>Connect a VIA-compatible keyboard to test the switch matrix.</p>
		</div>
	{/if}
</div>

<style>
	.test-page {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.tester {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--base1);
	}

	.hint {
		font-size: 0.875rem;
		color: var(--base00);
	}

	.polling-indicator {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		color: var(--cyan);
	}

	.polling-indicator::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: var(--cyan);
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
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

	.pressed-list {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		min-height: 32px;
	}

	.pressed-label {
		font-size: 0.8125rem;
		color: var(--base00);
	}

	.pressed-key {
		padding: 4px 8px;
		font-size: 0.75rem;
		font-family: monospace;
		background-color: var(--base02);
		border: 1px solid var(--cyan);
		border-radius: var(--radius-sm);
		color: var(--cyan);
	}

	.no-press {
		font-size: 0.8125rem;
		color: var(--base01);
	}

	.empty-state {
		text-align: center;
		padding: 48px;
		color: var(--base00);
	}
</style>
