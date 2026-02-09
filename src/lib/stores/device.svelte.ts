/**
 * Device connection state store.
 * Manages the HID transport and VIA protocol lifecycle.
 */

import { HIDTransport, type ConnectionState } from '../transport/hid-transport.js';
import { ViaProtocol } from '../protocol/via-protocol.js';

class DeviceStore {
	transport: HIDTransport | null = $state(null);
	protocol: ViaProtocol | null = $state(null);
	connectionState: ConnectionState = $state('disconnected');
	deviceName = $state('');
	protocolVersion = $state(0);
	error = $state('');

	get isConnected(): boolean {
		return this.connectionState === 'connected';
	}

	/**
	 * Request a device from the user and connect to it.
	 */
	async connect(): Promise<boolean> {
		this.error = '';

		try {
			const transport = new HIDTransport({
				onStateChange: (state) => {
					this.connectionState = state;
				},
				onDeviceDisconnect: () => {
					this.handleDisconnect();
				}
			});

			const device = await transport.requestDevice();
			if (!device) {
				return false;
			}

			await transport.connect(device);

			const protocol = new ViaProtocol(transport);
			const version = await protocol.getProtocolVersion();

			this.transport = transport;
			this.protocol = protocol;
			this.protocolVersion = version;
			this.deviceName = transport.deviceInfo?.productName ?? 'Unknown Device';

			return true;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Connection failed';
			this.connectionState = 'error';
			return false;
		}
	}

	/**
	 * Try reconnecting to a previously paired device.
	 */
	async reconnect(): Promise<boolean> {
		this.error = '';

		try {
			const transport = new HIDTransport({
				onStateChange: (state) => {
					this.connectionState = state;
				},
				onDeviceDisconnect: () => {
					this.handleDisconnect();
				}
			});

			await transport.connect(); // No device = try to find previously paired

			if (!transport.isConnected) {
				return false;
			}

			const protocol = new ViaProtocol(transport);
			const version = await protocol.getProtocolVersion();

			this.transport = transport;
			this.protocol = protocol;
			this.protocolVersion = version;
			this.deviceName = transport.deviceInfo?.productName ?? 'Unknown Device';

			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Disconnect from the current device.
	 */
	async disconnect(): Promise<void> {
		if (this.transport) {
			await this.transport.disconnect();
			this.transport.destroy();
		}
		this.reset();
	}

	private handleDisconnect(): void {
		this.reset();
	}

	private reset(): void {
		this.transport = null;
		this.protocol = null;
		this.connectionState = 'disconnected';
		this.deviceName = '';
		this.protocolVersion = 0;
		this.error = '';
	}
}

export const deviceStore = new DeviceStore();
