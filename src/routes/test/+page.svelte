<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { deviceStore } from '$lib/stores/device.svelte.js';
	import { definitionStore } from '$lib/stores/definition.svelte.js';
	import ConnectionStatus from '../../components/ConnectionStatus.svelte';
	import KeyboardLayout from '../../components/KeyboardLayout.svelte';

	let matrixPressedKeys = $state(new Set<string>());
	let encoderPressedKeys = $state(new Set<string>());
	let pressedKeys = $derived(new Set([...matrixPressedKeys, ...encoderPressedKeys]));
	let polling = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Encoder detection via HID consumer reports + browser keyboard events
	let encoderQmkMap = new Map<number, string>();
	let encoderFlashTimers = new Map<string, ReturnType<typeof setTimeout>>();
	let consumerDevice: HIDDevice | null = null;

	// USB HID consumer usage → QMK keycode mapping
	const CONSUMER_TO_QMK: Record<number, number> = {
		0x00e9: 0x00a9, // Volume Up
		0x00ea: 0x00aa, // Volume Down
		0x00e2: 0x00a8, // Mute
		0x00b5: 0x00ab, // Next Track
		0x00b6: 0x00ac, // Prev Track
		0x00b7: 0x00ad, // Stop
		0x00cd: 0x00ae, // Play/Pause
		0x006f: 0x00b5, // Brightness Up
		0x0070: 0x00b6, // Brightness Down
	};

	// Browser event.key → QMK keycode for non-consumer keys
	const BROWSER_KEY_TO_QMK: Record<string, number> = {
		ArrowRight: 0x4f, ArrowLeft: 0x50, ArrowDown: 0x51, ArrowUp: 0x52,
		Home: 0x4a, PageUp: 0x4b, End: 0x4d, PageDown: 0x4e,
		Escape: 0x29, ' ': 0x2c, Enter: 0x28, Backspace: 0x2a, Tab: 0x2b,
	};
	// Letters a-z
	for (let i = 0; i < 26; i++) BROWSER_KEY_TO_QMK[String.fromCharCode(97 + i)] = 0x04 + i;
	// Digits 1-9, 0
	for (let i = 1; i <= 9; i++) BROWSER_KEY_TO_QMK[String(i)] = 0x1d + i;
	BROWSER_KEY_TO_QMK['0'] = 0x27;
	// F1-F12
	for (let i = 1; i <= 12; i++) BROWSER_KEY_TO_QMK[`F${i}`] = 0x39 + i;

	onMount(async () => {
		await definitionStore.loadRegistry();
		await deviceStore.reconnect();
		if (deviceStore.isConnected) {
			await handleConnected();
		}
		window.addEventListener('keydown', handleKeyDown, true);
	});

	onDestroy(() => {
		stopPolling();
		closeConsumerDevice();
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyDown, true);
		}
		for (const timer of encoderFlashTimers.values()) clearTimeout(timer);
	});

	$effect(() => {
		if (deviceStore.isConnected && !polling) {
			handleConnected();
		}
		if (!deviceStore.isConnected) {
			stopPolling();
			closeConsumerDevice();
			matrixPressedKeys = new Set();
			encoderPressedKeys = new Set();
			encoderQmkMap.clear();
			definitionStore.reset();
		}
	});

	async function loadEncoderKeycodes() {
		const protocol = deviceStore.protocol;
		if (!protocol) return;

		const count = definitionStore.encoderCount;
		encoderQmkMap.clear();

		for (let enc = 0; enc < count; enc++) {
			for (const dir of [0, 1]) {
				try {
					const qmkCode = await protocol.getEncoderKeycode(0, enc, dir);
					if (qmkCode > 0) {
						encoderQmkMap.set(qmkCode, `enc:${enc}:${dir}`);
					}
				} catch { /* skip */ }
			}
		}
	}

	/** Try to open the consumer control HID interface for media key detection */
	async function openConsumerDevice() {
		if (!('hid' in navigator)) return;
		const info = deviceStore.transport?.deviceInfo;
		if (!info) return;

		try {
			const devices = await navigator.hid.getDevices();
			const consumer = devices.find(d =>
				d.vendorId === info.vendorId &&
				d.productId === info.productId &&
				d.collections.some(c => c.usagePage === 0x0c)
			);
			if (!consumer) return;
			if (!consumer.opened) await consumer.open();
			consumer.addEventListener('inputreport', handleConsumerReport);
			consumerDevice = consumer;
		} catch {
			// Chrome may block consumer control access — fall back to keyboard events
		}
	}

	function closeConsumerDevice() {
		if (consumerDevice) {
			consumerDevice.removeEventListener('inputreport', handleConsumerReport);
			consumerDevice = null;
		}
	}

	function handleConsumerReport(event: HIDInputReportEvent) {
		if (event.data.byteLength < 1) return;
		const usage = event.data.byteLength >= 2
			? event.data.getUint16(0, true)
			: event.data.getUint8(0);
		if (usage === 0) return; // release
		const qmkCode = CONSUMER_TO_QMK[usage];
		if (qmkCode !== undefined) {
			flashEncoder(encoderQmkMap.get(qmkCode));
		}
	}

	/** Browser keyboard event fallback — works for non-media encoder keycodes */
	function handleKeyDown(e: KeyboardEvent) {
		const qmkCode = BROWSER_KEY_TO_QMK[e.key];
		if (qmkCode !== undefined) {
			flashEncoder(encoderQmkMap.get(qmkCode));
		}
	}

	function flashEncoder(encId: string | undefined) {
		if (!encId) return;

		const prev = encoderFlashTimers.get(encId);
		if (prev) clearTimeout(prev);

		encoderPressedKeys = new Set([...encoderPressedKeys, encId]);
		encoderFlashTimers.set(encId, setTimeout(() => {
			encoderPressedKeys = new Set([...encoderPressedKeys].filter(k => k !== encId));
			encoderFlashTimers.delete(encId);
		}, 150));
	}

	async function handleConnected() {
		const info = deviceStore.transport?.deviceInfo;
		if (!info) return;

		// Always reload definition for the connected device
		const found = await definitionStore.loadForDevice(info.vendorId, info.productId);
		if (!found) return;

		await loadEncoderKeycodes();
		await openConsumerDevice();
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
				const rawMatrix = await deviceStore.protocol.getSwitchMatrixState();
				const cols = definitionStore.cols;
				const rows = definitionStore.rows;
				const bytesPerRow = Math.ceil(cols / 8);
				matrixPressedKeys = parseMatrix(rawMatrix, rows, cols, bytesPerRow);
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

	function parseMatrix(data: Uint8Array, rows: number, cols: number, bytesPerRow: number): Set<string> {
		const pressed = new Set<string>();
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				// QMK packs matrix big-endian: high byte first
				const byteInRow = bytesPerRow - 1 - Math.floor(col / 8);
				const byteIdx = row * bytesPerRow + byteInRow;
				const bitIdx = col % 8;
				if (byteIdx < data.length && data[byteIdx] & (1 << bitIdx)) {
					pressed.add(`${row},${col}`);
				}
			}
		}
		return pressed;
	}

	/** Return 0 for all keys — matrix tester only shows pressed state, not keycodes */
	function noKeycodes(_key: import('$lib/keyboard/types.js').ParsedKey): number {
		return 0;
	}
</script>

<svelte:head>
	<title>Matrix Test — TypeArt</title>
	<meta name="description" content="Real-time keyboard matrix tester — visualize key presses and encoder rotation on your VIA-compatible mechanical keyboard." />
	<meta property="og:title" content="Matrix Test — TypeArt" />
	<meta property="og:description" content="Visualize key presses and encoder rotation on your VIA-compatible mechanical keyboard in real time." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://typeart.co/test" />
	<meta property="og:image" content="https://typeart.co/logo-dark.png" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="test-page">
	<ConnectionStatus />

	{#if definitionStore.definition}
		<div class="tester">
			<h2>Matrix Tester</h2>
			<p class="hint">Press keys on your keyboard to see them highlight. Encoder rotation is detected via assigned keycodes.</p>

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
			<p class="attribution">Built on <a href="https://qmk.fm" target="_blank" rel="noopener">QMK</a> and <a href="https://usevia.app" target="_blank" rel="noopener">VIA</a></p>
			<p class="cross-link">Need a board? Check out our <a href="/store">keyboard kits</a>. Already built? <a href="/configure">Configure your keymap</a>.</p>
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

	.attribution {
		font-size: 0.8125rem;
		color: var(--base00);
		margin-top: 24px;
	}

	.attribution a {
		color: var(--base0);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.cross-link {
		font-size: 0.8125rem;
		color: var(--base00);
		margin-top: 12px;
	}

	.cross-link a {
		color: var(--blue);
	}
</style>
