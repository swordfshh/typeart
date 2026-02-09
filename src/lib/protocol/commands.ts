/**
 * VIA Protocol command IDs.
 * These match the VIA firmware implementation.
 */
export enum ViaCommand {
	GetProtocolVersion = 0x01,
	GetKeyboardValue = 0x02,
	SetKeyboardValue = 0x03,
	DynamicKeymapGetKeycode = 0x04,
	DynamicKeymapSetKeycode = 0x05,
	DynamicKeymapReset = 0x06,
	CustomSetValue = 0x07,
	CustomGetValue = 0x08,
	CustomSave = 0x09,
	EEPROMReset = 0x0a,
	BootloaderJump = 0x0b,
	DynamicKeymapMacroGetCount = 0x0c,
	DynamicKeymapMacroGetBufferSize = 0x0d,
	DynamicKeymapMacroGetBuffer = 0x0e,
	DynamicKeymapMacroSetBuffer = 0x0f,
	DynamicKeymapMacroReset = 0x10,
	DynamicKeymapGetLayerCount = 0x11,
	DynamicKeymapGetBuffer = 0x12,
	DynamicKeymapSetBuffer = 0x13,
	DynamicKeymapGetEncoder = 0x14,
	DynamicKeymapSetEncoder = 0x15,
	Vial_Prefix = 0xfe
}

/**
 * Keyboard value IDs for GetKeyboardValue / SetKeyboardValue.
 */
export enum KeyboardValue {
	Uptime = 0x01,
	LayoutOptions = 0x02,
	SwitchMatrixState = 0x03,
	FirmwareVersion = 0x04,
	DeviceIndication = 0x05
}
