<script lang="ts">
	import { deviceStore } from '$lib/stores/device.svelte.js';

	async function handleConnect() {
		await deviceStore.connect();
	}

	async function handleDisconnect() {
		await deviceStore.disconnect();
	}
</script>

<div class="connection-status">
	{#if deviceStore.isConnected}
		<div class="status-info">
			<span class="indicator connected"></span>
			<span class="device-name">{deviceStore.deviceName}</span>
			<span class="protocol">V{deviceStore.protocolVersion}</span>
		</div>
		<button class="btn btn-disconnect" onclick={handleDisconnect}>
			Disconnect
		</button>
	{:else if deviceStore.connectionState === 'connecting'}
		<div class="status-info">
			<span class="indicator connecting"></span>
			<span class="status-text">Connecting...</span>
		</div>
	{:else}
		<div class="status-info">
			{#if deviceStore.error}
				<span class="indicator error"></span>
				<span class="error-text">{deviceStore.error}</span>
			{:else}
				<span class="indicator disconnected"></span>
				<span class="status-text">No device connected</span>
			{/if}
		</div>
		<button class="btn btn-connect" onclick={handleConnect}>
			Connect Keyboard
		</button>
	{/if}
</div>

<style>
	.connection-status {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-md);
		gap: 12px;
	}

	.status-info {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.indicator.connected {
		background-color: var(--cyan);
		box-shadow: 0 0 6px var(--cyan);
	}

	.indicator.connecting {
		background-color: var(--yellow);
		animation: pulse 1s infinite;
	}

	.indicator.disconnected {
		background-color: var(--base01);
	}

	.indicator.error {
		background-color: var(--red);
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	.device-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--base1);
	}

	.protocol {
		font-size: 0.75rem;
		color: var(--base01);
		padding: 2px 6px;
		background-color: var(--base03);
		border-radius: var(--radius-sm);
	}

	.status-text {
		font-size: 0.875rem;
		color: var(--base00);
	}

	.error-text {
		font-size: 0.875rem;
		color: var(--red);
	}

	.btn {
		padding: 8px 16px;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: var(--radius-md);
		transition: background-color 100ms ease;
	}

	.btn-connect {
		background-color: var(--blue);
		color: var(--on-accent);
	}

	.btn-connect:hover {
		background-color: color-mix(in srgb, var(--blue) 85%, white);
	}

	.btn-disconnect {
		background-color: var(--base03);
		color: var(--base00);
		border: 1px solid var(--base01);
	}

	.btn-disconnect:hover {
		border-color: var(--red);
		color: var(--red);
	}
</style>
