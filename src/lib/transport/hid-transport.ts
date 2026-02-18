/**
 * WebHID transport layer for VIA-compatible keyboards.
 * Handles device discovery, connection, and raw HID report send/receive.
 * Commands are queued to prevent overlapping requests.
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

	/** Command queue to serialize HID communication */
	private commandQueue: Array<{
		data: Uint8Array;
		resolve: (data: Uint8Array) => void;
		reject: (err: Error) => void;
	}> = [];
	private processing = false;

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
				const viaDevices = devices.filter((d) =>
					d.collections.some((c) => c.usagePage === USAGE_PAGE && c.usage === USAGE)
				);
				if (viaDevices.length === 0) {
					this.setState('disconnected');
					return;
				}
				// Multiple VIA devices: don't auto-reconnect — let user pick via Connect
				if (viaDevices.length > 1) {
					this.setState('disconnected');
					return;
				}
				this.device = viaDevices[0];
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
		this.flushQueue(new Error('Device disconnected'));
		this.clearPending();
		this.setState('disconnected');
	}

	/**
	 * Sends a command and waits for the response.
	 * Commands are queued so only one is in-flight at a time.
	 */
	async sendCommand(data: Uint8Array): Promise<Uint8Array> {
		if (!this.device || !this.device.opened) {
			throw new Error('Device not connected');
		}

		return new Promise<Uint8Array>((resolve, reject) => {
			this.commandQueue.push({ data, resolve, reject });
			this.processQueue();
		});
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
		this.flushQueue(new Error('Transport destroyed'));
		this.clearPending();
	}

	/**
	 * Process queued commands one at a time.
	 */
	private async processQueue(): Promise<void> {
		if (this.processing) return;
		this.processing = true;

		while (this.commandQueue.length > 0) {
			const cmd = this.commandQueue.shift()!;

			if (!this.device || !this.device.opened) {
				cmd.reject(new Error('Device not connected'));
				continue;
			}

			try {
				const result = await this.sendImmediate(cmd.data);
				cmd.resolve(result);
			} catch (err) {
				cmd.reject(err instanceof Error ? err : new Error(String(err)));
			}
		}

		this.processing = false;
	}

	/**
	 * Send a single command and await its response (internal, no queuing).
	 */
	private async sendImmediate(data: Uint8Array): Promise<Uint8Array> {
		if (!this.device || !this.device.opened) {
			throw new Error('Device not connected');
		}

		const report = new Uint8Array(REPORT_SIZE);
		report.set(data.subarray(0, REPORT_SIZE));

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

	private handleInputReport = (event: HIDInputReportEvent): void => {
		if (this.pendingResolve) {
			const data = new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength);
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
			this.flushQueue(new Error('Device disconnected'));
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
		this.pendingResolve = null;
		this.pendingReject = null;
	}

	private flushQueue(error: Error): void {
		const queued = this.commandQueue.splice(0);
		for (const cmd of queued) {
			cmd.reject(error);
		}
		this.processing = false;
	}

	private setState(state: ConnectionState): void {
		this._state = state;
		this.events.onStateChange?.(state);
	}
}
