export interface StabilizerOption {
	name: string;
	price: number;
}

export interface Product {
	name: string;
	slug: string;
	tagline: string;
	description: string;
	price: number;
	placeholderColor: string;
	colors: string[];
	stabilizers: StabilizerOption[];
	wristRestPrice: number;
}

export interface VariantSelection {
	color: string;
	stabilizer: StabilizerOption;
	wristRest: boolean;
}

export interface CartItem {
	id: string;
	productSlug: string;
	productName: string;
	basePrice: number;
	color: string;
	stabilizer: StabilizerOption;
	wristRest: boolean;
	wristRestPrice: number;
	quantity: number;
}
