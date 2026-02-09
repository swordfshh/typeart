/**
 * WebHID transport layer for VIA-compatible keyboards.
 * Handles device discovery, connection, and raw HID report send/receive.
 */

const USAGE_PAGE = 0xff60;
const USAGE = 0x61;
const REPORT_SIZE = 32;
const REPORT_ID = 0x00;
const RECEIVE_TIMEOUT_MS = 1000;

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface TransportEvents {
	onStateChange: (state: ConnectionState) => void;
	onDeviceDisconnect: () => void;
}

export class HIDTransport {
	private device: HIDDevice | null = null;
	private pendingResolve: ((data: Uint8Array) => void) | null = null;
	private pendingReject: ((err: Error) => void) | null = null;
	private timeoutId: ReturnType<typeof setTimeout> | null = null;
	private events: Partial<TransportEvents> = {};
	private _state: ConnectionState = 'disconnected';

	get state(): ConnectionState {
		return this._state;
	}

	get deviceInfo(): { vendorId: number; productId: number; productName: string } | null {
		if (!this.device) return null;
		return {
			vendorId: this.device.vendorId,
			productId: this.device.productId,
			productName: this.device.productName
		};
	}

	get isConnected(): boolean {
		return this._state === 'connected' && this.device !== null && this.device.opened;
	}

	constructor(events?: Partial<TransportEvents>) {
		this.events = events ?? {};
		if (typeof navigator !== 'undefined' && 'hid' in navigator) {
			navigator.hid.addEventListener('disconnect', this.handleDisconnect);
		}
	}

	/**
	 * Opens the browser HID device picker filtered to VIA-compatible devices.
	 */
	async requestDevice(): Promise<HIDDevice | null> {
		if (!('hid' in navigator)) {
			throw new Error('WebHID is not supported in this browser');
		}

		const devices = await navigator.hid.requestDevice({
			filters: [{ usagePage: USAGE_PAGE, usage: USAGE }]
		});

		return devices[0] ?? null;
	}

	/**
	 * Connects to a specific HID device.
	 */
	async connect(device?: HIDDevice): Promise<void> {
		this.setState('connecting');

		try {
			if (device) {
				this.device = device;
			} else {
				// Try to reconnect to previously paired device
				const devices = await navigator.hid.getDevices();
				const viaDevice = devices.find((d) =>
					d.collections.some((c) => c.usagePage === USAGE_PAGE && c.usage === USAGE)
				);
				if (!viaDevice) {
					this.setState('disconnected');
					return;
				}
				this.device = viaDevice;
			}

			if (!this.device.opened) {
				await this.device.open();
			}

			this.device.addEventListener('inputreport', this.handleInputReport);
			this.setState('connected');
		} catch (err) {
			this.device = null;
			this.setState('error');
			throw err;
		}
	}

	/**
	 * Disconnects from the current device.
	 */
	async disconnect(): Promise<void> {
		if (this.device) {
			this.device.removeEventListener('inputreport', this.handleInputReport);
			if (this.device.opened) {
				await this.device.close();
			}
			this.device = null;
		}
		this.clearPending();
		this.setState('disconnected');
	}

	/**
	 * Sends a command and waits for the response.
	 * All reports are padded to 32 bytes.
	 */
	async sendCommand(data: Uint8Array): Promise<Uint8Array> {
		if (!this.device || !this.device.opened) {
			throw new Error('Device not connected');
		}

		// Pad to REPORT_SIZE
		const report = new Uint8Array(REPORT_SIZE);
		report.set(data.subarray(0, REPORT_SIZE));

		// Clear any pending request
		this.clearPending();

		const promise = new Promise<Uint8Array>((resolve, reject) => {
			this.pendingResolve = resolve;
			this.pendingReject = reject;

			this.timeoutId = setTimeout(() => {
				this.clearPending();
				reject(new Error('HID response timeout'));
			}, RECEIVE_TIMEOUT_MS);
		});

		await this.device.sendReport(REPORT_ID, report);
		return promise;
	}

	/**
	 * Sends a command without waiting for a response.
	 */
	async sendRaw(data: Uint8Array): Promise<void> {
		if (!this.device || !this.device.opened) {
			throw new Error('Device not connected');
		}

		const report = new Uint8Array(REPORT_SIZE);
		report.set(data.subarray(0, REPORT_SIZE));
		await this.device.sendReport(REPORT_ID, report);
	}

	destroy(): void {
		if (typeof navigator !== 'undefined' && 'hid' in navigator) {
			navigator.hid.removeEventListener('disconnect', this.handleDisconnect);
		}
		this.clearPending();
	}

	private handleInputReport = (event: HIDInputReportEvent): void => {
		if (this.pendingResolve) {
			const data = new Uint8Array(event.data.buffer);
			if (this.timeoutId) clearTimeout(this.timeoutId);
			this.timeoutId = null;
			const resolve = this.pendingResolve;
			this.pendingResolve = null;
			this.pendingReject = null;
			resolve(data);
		}
	};

	private handleDisconnect = (event: HIDConnectionEvent): void => {
		if (this.device && event.device === this.device) {
			this.device = null;
			this.clearPending();
			this.setState('disconnected');
			this.events.onDeviceDisconnect?.();
		}
	};

	private clearPending(): void {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
		if (this.pendingReject) {
			// Don't reject — just discard
			this.pendingResolve = null;
			this.pendingReject = null;
		}
	}

	private setState(state: ConnectionState): void {
		this._state = state;
		this.events.onStateChange?.(state);
	}
}
