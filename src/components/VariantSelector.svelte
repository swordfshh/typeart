<script lang="ts">
	interface Props {
		label: string;
		options: string[];
		value: string;
		onchange: (value: string) => void;
	}

	let { label, options, value, onchange }: Props = $props();
</script>

<label class="variant-selector">
	<span class="variant-label">{label}</span>
	<select class="variant-select" {value} onchange={(e) => onchange(e.currentTarget.value)}>
		{#each options as option}
			<option value={option} selected={option === value}>{option}</option>
		{/each}
	</select>
</label>

<style>
	.variant-selector {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.variant-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--base0);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.variant-select {
		appearance: none;
		background-color: var(--base03);
		color: var(--base1);
		border: 1px solid var(--base01);
		border-radius: var(--radius-md);
		padding: 8px 12px;
		font-size: 0.875rem;
		font-family: inherit;
		cursor: pointer;
		transition: border-color 100ms ease;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23839496' d='M3 5l3 3 3-3'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
		padding-right: 28px;
	}

	.variant-select:focus {
		outline: none;
		border-color: var(--blue);
	}

	.variant-select:hover {
		border-color: var(--base0);
	}
</style>
