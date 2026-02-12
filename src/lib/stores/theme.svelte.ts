export type Theme = 'retro-beige' | 'miami-nights' | 'godspeed';

const STORAGE_KEY = 'typeart-theme';
const THEMES: Theme[] = ['retro-beige', 'miami-nights', 'godspeed'];

class ThemeStore {
	current: Theme = $state('retro-beige');

	toggle(): void {
		const idx = THEMES.indexOf(this.current);
		this.current = THEMES[(idx + 1) % THEMES.length];
		this.apply();
		this.persist();
	}

	set(theme: Theme): void {
		this.current = theme;
		this.apply();
		this.persist();
	}

	hydrate(): void {
		if (typeof window === 'undefined') return;
		try {
			const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
			if (saved && THEMES.includes(saved)) {
				this.current = saved;
			}
		} catch {
			// Corrupt data — use default
		}
		this.apply();
	}

	private apply(): void {
		if (typeof document === 'undefined') return;
		if (this.current === 'retro-beige') {
			document.documentElement.removeAttribute('data-theme');
		} else {
			document.documentElement.setAttribute('data-theme', this.current);
		}
	}

	private persist(): void {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, this.current);
		} catch {
			// Storage unavailable
		}
	}
}

export const themeStore = new ThemeStore();
