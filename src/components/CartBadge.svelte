<script lang="ts">
	interface Props {
		count: number;
	}

	let { count }: Props = $props();
</script>

{#if count > 0}
	<span class="badge">{count}</span>
{/if}

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		background-color: var(--yellow);
		color: var(--base03);
		font-size: 0.7rem;
		font-weight: 700;
		border-radius: 9px;
		line-height: 1;
		margin-left: 4px;
		vertical-align: middle;
	}
</style>
