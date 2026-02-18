interface AuthUser {
	id: string;
	username: string;
	email: string;
	email_verified: boolean;
	created_at: string;
}

class AuthStore {
	user: AuthUser | null = $state(null);

	get loggedIn(): boolean {
		return this.user !== null;
	}

	init(user: AuthUser | null): void {
		this.user = user;
	}

	async login(email: string, password: string): Promise<void> {
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || 'Login failed');
		this.user = data.user;
	}

	async register(username: string, email: string, password: string): Promise<void> {
		const res = await fetch('/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, email, password })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || 'Registration failed');
		this.user = data.user;
	}

	async logout(): Promise<void> {
		await fetch('/api/auth/logout', { method: 'POST' });
		this.user = null;
	}

	async fetchUser(): Promise<void> {
		try {
			const res = await fetch('/api/auth/me');
			if (res.ok) {
				const data = await res.json();
				this.user = data.user;
			}
		} catch {
			// Network error — leave user as null
		}
	}
}

export const authStore = new AuthStore();
