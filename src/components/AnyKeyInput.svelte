<script lang="ts">
	import { parseKeycodeString } from '$lib/keycodes/parser.js';
	import { getKeycodeLabel } from '$lib/keycodes/labels.js';

	interface Props {
		onselect: (keycode: number) => void;
	}

	let { onselect }: Props = $props();

	let inputValue = $state('');
	let error = $state('');

	const parsed = $derived.by(() => {
		if (!inputValue.trim()) return null;
		return parseKeycodeString(inputValue);
	});

	const preview = $derived(parsed !== null ? getKeycodeLabel(parsed) : null);

	function handleSubmit() {
		if (parsed !== null) {
			onselect(parsed);
			inputValue = '';
			error = '';
		} else {
			error = 'Invalid keycode';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<div class="any-key">
	<div class="any-row">
		<span class="any-label">Any</span>
		<input
			class="any-input"
			type="text"
			placeholder="e.g. LT(1,KC_SPC) or 0x5C16"
			bind:value={inputValue}
			onkeydown={handleKeydown}
		/>
		<button class="any-btn" disabled={parsed === null} onclick={handleSubmit}>
			Assign
		</button>
	</div>
	{#if preview}
		<span class="preview">{preview} (0x{parsed?.toString(16).padStart(4, '0')})</span>
	{/if}
	{#if error && !preview}
		<span class="error">{error}</span>
	{/if}
</div>

<style>
	.any-key {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.any-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.any-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--base00);
		flex-shrink: 0;
	}

	.any-input {
		flex: 1;
		padding: 6px 10px;
		background-color: var(--base03);
		border: 1px solid var(--base01);
		border-radius: var(--radius-sm);
		color: var(--base0);
		font-size: 0.8125rem;
		font-family: monospace;
		outline: none;
	}

	.any-input:focus {
		border-color: var(--blue);
	}

	.any-input::placeholder {
		color: var(--base01);
		font-family: inherit;
	}

	.any-btn {
		padding: 6px 12px;
		font-size: 0.75rem;
		font-weight: 500;
		background-color: var(--blue);
		color: var(--on-accent);
		border-radius: var(--radius-sm);
		flex-shrink: 0;
		transition: opacity 100ms ease;
	}

	.any-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.preview {
		font-size: 0.6875rem;
		color: var(--cyan);
		padding-left: 32px;
	}

	.error {
		font-size: 0.6875rem;
		color: var(--red);
		padding-left: 32px;
	}
</style>
