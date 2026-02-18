export interface ColorOption {
	name: string;
	price: number;
}

export interface StabilizerOption {
	name: string;
	price: number;
}

export interface SpecItem {
	label: string;
	value: string;
}

export interface Product {
	name: string;
	slug: string;
	tagline: string;
	description: string;
	price: number;
	placeholderColor: string;
	imageCount: number;
	colors: ColorOption[];
	stabilizers: StabilizerOption[];
	wristRestPrice: number;
	specs: SpecItem[];
}

export interface VariantSelection {
	color: ColorOption;
	stabilizer: StabilizerOption;
	wristRest: boolean;
}

export interface CartItem {
	id: string;
	productSlug: string;
	productName: string;
	basePrice: number;
	color: string;
	colorPrice: number;
	stabilizer: StabilizerOption;
	wristRest: boolean;
	wristRestPrice: number;
	quantity: number;
}
