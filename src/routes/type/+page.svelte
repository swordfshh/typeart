<script lang="ts">
	import { onMount } from 'svelte';
	import { randomWords, randomQuote } from '$lib/typing/words.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import Leaderboard from '../../components/Leaderboard.svelte';

	// --- Types ---
	type Mode = 'time' | 'words' | 'quote';
	interface Score {
		username: string;
		wpm: number;
		accuracy: number;
		created_at: string;
	}

	// --- State ---
	let mode: Mode = $state('time');
	let timeOption = $state(30);
	let wordsOption = $state(25);

	let words: string[] = $state([]);
	let currentWordIndex = $state(0);
	let currentInput = $state('');
	let wordResults: Array<'correct' | 'incorrect' | null> = $state([]);
	let charResults: Array<Array<'correct' | 'incorrect' | 'extra' | null>> = $state([]);

	let started = $state(false);
	let finished = $state(false);
	let startTime = $state(0);
	let elapsed = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;
	let timeLeft = $state(0);

	let totalCorrectChars = $state(0);
	let totalTypedChars = $state(0);
	let totalCorrectWords = $state(0);

	let inputEl: HTMLInputElement | undefined = $state();
	let wordsEl: HTMLDivElement | undefined = $state();
	let displayStart = $state(0);

	let scoreSubmitted: 'idle' | 'submitting' | 'done' | 'error' = $state('idle');
	let leaderboardScores: Score[] = $state([]);
	let leaderboardLoading = $state(false);
	let showLeaderboard = $state(false);

	// --- Derived ---
	const wpm = $derived.by(() => {
		const mins = elapsed / 60;
		if (mins === 0) return 0;
		return Math.round((totalCorrectChars / 5) / mins);
	});

	const rawWpm = $derived.by(() => {
		const mins = elapsed / 60;
		if (mins === 0) return 0;
		return Math.round((totalTypedChars / 5) / mins);
	});

	const accuracy = $derived.by(() => {
		if (totalTypedChars === 0) return 100;
		return Math.round((totalCorrectChars / totalTypedChars) * 100);
	});

	// --- Init ---
	function generateWords() {
		if (mode === 'time') {
			words = randomWords(200);
		} else if (mode === 'words') {
			words = randomWords(wordsOption);
		} else {
			words = randomQuote().split(' ');
		}
		charResults = words.map(w => Array(w.length).fill(null));
	}

	function reset() {
		if (timer) clearInterval(timer);
		timer = null;
		started = false;
		finished = false;
		showLeaderboard = false;
		startTime = 0;
		elapsed = 0;
		currentWordIndex = 0;
		currentInput = '';
		wordResults = [];
		totalCorrectChars = 0;
		totalTypedChars = 0;
		totalCorrectWords = 0;
		displayStart = 0;
		timeLeft = mode === 'time' ? timeOption : 0;
		scoreSubmitted = 'idle';
		leaderboardScores = [];
		leaderboardLoading = false;
		generateWords();
		requestAnimationFrame(() => inputEl?.focus());
	}

	function setMode(m: Mode) {
		mode = m;
		showLeaderboard = false;
		reset();
	}

	function setTimeOption(t: number) {
		timeOption = t;
		showLeaderboard = false;
		reset();
	}

	function setWordsOption(w: number) {
		wordsOption = w;
		showLeaderboard = false;
		reset();
	}

	function toggleLeaderboard() {
		showLeaderboard = !showLeaderboard;
		if (showLeaderboard) {
			fetchLeaderboard();
		}
	}

	async function handleSubmitScore() {
		if (scoreSubmitted !== 'idle') return;
		scoreSubmitted = 'submitting';
		try {
			const res = await fetch('/api/scores', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mode,
					mode_param: mode === 'quote' ? null : String(mode === 'time' ? timeOption : wordsOption),
					wpm,
					raw_wpm: rawWpm,
					accuracy,
					char_count: totalCorrectChars,
					elapsed_seconds: Math.round(elapsed * 10) / 10
				})
			});
			if (res.ok) {
				scoreSubmitted = 'done';
				fetchLeaderboard();
			} else {
				scoreSubmitted = 'error';
			}
		} catch {
			scoreSubmitted = 'error';
		}
	}

	function startTest() {
		started = true;
		startTime = Date.now();
		timer = setInterval(() => {
			elapsed = (Date.now() - startTime) / 1000;
			if (mode === 'time') {
				timeLeft = Math.max(0, timeOption - elapsed);
				if (timeLeft <= 0) {
					finishTest();
				}
			}
		}, 100);
	}

	function finishTest() {
		if (timer) clearInterval(timer);
		timer = null;
		finished = true;
		elapsed = (Date.now() - startTime) / 1000;
		fetchLeaderboard();
	}

	async function fetchLeaderboard() {
		leaderboardLoading = true;
		try {
			const param = mode === 'quote' ? '' : String(mode === 'time' ? timeOption : wordsOption);
			const res = await fetch(`/api/scores?mode=${mode}&param=${param}&limit=10`);
			if (res.ok) {
				const data = await res.json();
				leaderboardScores = data.scores;
			}
		} catch {
			// silently fail — leaderboard is non-critical
		} finally {
			leaderboardLoading = false;
		}
	}

	/** For timed mode: after advancing a word, scroll if current word is past line 2. Keeps 1 completed line visible. */
	function checkLineScroll() {
		if (!wordsEl || mode !== 'time') return;
		const wordEls = wordsEl.querySelectorAll('.word');
		if (wordEls.length < 2) return;

		const firstTop = (wordEls[0] as HTMLElement).offsetTop;

		// Find where line 2 starts
		let secondLineTop = -1;
		for (let i = 1; i < wordEls.length; i++) {
			if ((wordEls[i] as HTMLElement).offsetTop > firstTop) {
				secondLineTop = (wordEls[i] as HTMLElement).offsetTop;
				break;
			}
		}
		if (secondLineTop === -1) return;

		const currentEl = wordsEl.querySelector('.word.current') as HTMLElement;
		if (!currentEl || currentEl.offsetTop <= secondLineTop) return;

		// Current word is on line 3+ — remove the top line so completed line 2 stays visible
		for (let i = 0; i < wordEls.length; i++) {
			if ((wordEls[i] as HTMLElement).offsetTop > firstTop) {
				displayStart = displayStart + i;
				break;
			}
		}

		// Append more words if running low
		if (currentWordIndex + 50 >= words.length) {
			const moreWords = randomWords(100);
			words = [...words, ...moreWords];
			charResults = [...charResults, ...moreWords.map(w => Array(w.length).fill(null))];
		}
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = target.value;

		if (!started && !finished) {
			startTest();
		}

		if (finished) return;

		// Space pressed — advance to next word
		if (value.endsWith(' ')) {
			const typed = value.trimEnd();
			const expected = words[currentWordIndex];
			const isCorrect = typed === expected;

			wordResults[currentWordIndex] = isCorrect ? 'correct' : 'incorrect';
			totalTypedChars += typed.length + 1;
			if (isCorrect) {
				totalCorrectChars += expected.length + 1;
				totalCorrectWords++;
			} else {
				for (let i = 0; i < Math.min(typed.length, expected.length); i++) {
					if (typed[i] === expected[i]) totalCorrectChars++;
				}
			}

			// Update per-char results for the completed word
			const wordChars: Array<'correct' | 'incorrect' | 'extra' | null> = [];
			for (let i = 0; i < expected.length; i++) {
				if (i < typed.length) {
					wordChars.push(typed[i] === expected[i] ? 'correct' : 'incorrect');
				} else {
					wordChars.push('incorrect');
				}
			}
			for (let i = expected.length; i < typed.length; i++) {
				wordChars.push('extra');
			}
			charResults[currentWordIndex] = wordChars;

			currentWordIndex++;
			currentInput = '';

			if (mode !== 'time' && currentWordIndex >= words.length) {
				finishTest();
			} else if (mode === 'time') {
				requestAnimationFrame(() => checkLineScroll());
			}
			return;
		}

		currentInput = value;

		// Update live char coloring for current word
		const expected = words[currentWordIndex];
		const wordChars: Array<'correct' | 'incorrect' | 'extra' | null> = [];
		for (let i = 0; i < expected.length; i++) {
			if (i < value.length) {
				wordChars.push(value[i] === expected[i] ? 'correct' : 'incorrect');
			} else {
				wordChars.push(null);
			}
		}
		for (let i = expected.length; i < value.length; i++) {
			wordChars.push('extra');
		}
		charResults[currentWordIndex] = wordChars;

		// Auto-finish on last word when typed correctly (no space needed)
		if (mode !== 'time' && currentWordIndex === words.length - 1 && value === expected) {
			wordResults[currentWordIndex] = 'correct';
			totalTypedChars += value.length;
			totalCorrectChars += value.length;
			totalCorrectWords++;
			finishTest();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Tab') {
			e.preventDefault();
		}
		if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
			if (finished || started) {
				e.preventDefault();
				reset();
			}
		}
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (e.key === 'Tab') {
			e.preventDefault();
		}
		if (e.key === 'Enter' && finished) {
			e.preventDefault();
			reset();
		}
		// Auto-focus input on any printable key
		if (!finished && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
			inputEl?.focus();
		}
	}

	onMount(() => {
		generateWords();
		timeLeft = timeOption;
		document.addEventListener('keydown', handleGlobalKeydown);
		requestAnimationFrame(() => inputEl?.focus());
		return () => {
			document.removeEventListener('keydown', handleGlobalKeydown);
			if (timer) clearInterval(timer);
		};
	});
</script>

<div class="typing-test">
	<!-- Mode selector -->
	<div class="mode-bar">
		<div class="mode-group">
			<button class="mode-btn" class:active={mode === 'time'} onclick={() => setMode('time')}>time</button>
			<button class="mode-btn" class:active={mode === 'words'} onclick={() => setMode('words')}>words</button>
			<button class="mode-btn" class:active={mode === 'quote'} onclick={() => setMode('quote')}>quote</button>
		</div>
		<div class="mode-divider"></div>
		<button class="mode-btn" class:active={showLeaderboard} onclick={toggleLeaderboard}>leaderboard</button>
		<div class="mode-divider"></div>
		{#if mode === 'time'}
			<div class="mode-group">
				{#each [15, 30, 60] as t}
					<button class="mode-btn" class:active={timeOption === t} onclick={() => setTimeOption(t)}>{t}</button>
				{/each}
			</div>
		{:else if mode === 'words'}
			<div class="mode-group">
				{#each [10, 25, 50] as w}
					<button class="mode-btn" class:active={wordsOption === w} onclick={() => setWordsOption(w)}>{w}</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Live stats (hidden when results or leaderboard shown) -->
	{#if !finished && !showLeaderboard}
		<div class="live-stats">
			{#if mode === 'time'}
				<span class="stat-value timer">{Math.ceil(timeLeft)}</span>
			{:else}
				<span class="stat-label">{currentWordIndex}/{words.length}</span>
			{/if}
			{#if started}
				<span class="stat-label">{wpm} wpm</span>
				<span class="stat-label">{accuracy}%</span>
			{/if}
		</div>
	{/if}

	{#if showLeaderboard}
		<div class="leaderboard-section">
			<h2 class="leaderboard-title">Leaderboard</h2>
			<Leaderboard scores={leaderboardScores} loading={leaderboardLoading} />
		</div>
	{:else if finished}
		<!-- Score screen — replaces the words area -->
		<div class="score-display">
			<span class="score-wpm">{wpm}</span>
			<span class="score-unit">wpm</span>
			<div class="score-stats">
				<span>{accuracy}% accuracy</span>
				<span class="score-dot">·</span>
				<span>{rawWpm} raw</span>
				<span class="score-dot">·</span>
				<span>{Math.round(elapsed)}s</span>
			</div>
			<div class="score-actions">
				{#if authStore.loggedIn}
					{#if scoreSubmitted === 'idle'}
						<button class="submit-score" onclick={handleSubmitScore}>Submit Score</button>
					{:else if scoreSubmitted === 'submitting'}
						<span class="submit-status">Submitting...</span>
					{:else if scoreSubmitted === 'done'}
						<span class="submit-status done">Score saved</span>
					{:else}
						<span class="submit-status err">Failed to save</span>
					{/if}
				{:else}
					<a href="/login" class="login-link">Log in to save scores</a>
				{/if}
			</div>
			<span class="restart-hint">press <kbd>enter</kbd> to restart</span>
		</div>
		<div class="leaderboard-section">
			<h2 class="leaderboard-title">Leaderboard</h2>
			<Leaderboard scores={leaderboardScores} loading={leaderboardLoading} />
		</div>
	{:else}
		<!-- Word display -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="words-display" bind:this={wordsEl} onclick={() => inputEl?.focus()}>
			{#each words.slice(displayStart) as word, i}
				{@const wi = displayStart + i}
				<span
					class="word"
					class:current={wi === currentWordIndex}
					class:typed-correct={wordResults[wi] === 'correct'}
					class:typed-incorrect={wordResults[wi] === 'incorrect'}
				>
					{#each word.split('') as char, ci}
						<span
							class="char"
							class:correct={charResults[wi]?.[ci] === 'correct'}
							class:incorrect={charResults[wi]?.[ci] === 'incorrect'}
						>{char}</span>
					{/each}
					{#if charResults[wi]}
						{#each charResults[wi].filter(c => c === 'extra') as _}
							<span class="char extra">?</span>
						{/each}
					{/if}
					<span class="word-space"></span>
				</span>
			{/each}
		</div>

		<!-- Hidden input -->
		<input
			bind:this={inputEl}
			bind:value={currentInput}
			oninput={handleInput}
			onkeydown={handleKeydown}
			class="hidden-input"
			autocomplete="off"
			autocapitalize="off"
			autocorrect="off"
			spellcheck="false"
		/>
	{/if}
</div>

<style>
	.typing-test {
		max-width: 800px;
		margin: 0 auto;
		padding-top: 48px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
	}

	/* Mode bar */
	.mode-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-lg);
	}

	.mode-group {
		display: flex;
		gap: 4px;
	}

	.mode-divider {
		width: 1px;
		height: 20px;
		background-color: var(--base01);
		margin: 0 4px;
	}

	.mode-btn {
		padding: 6px 14px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--base00);
		border-radius: var(--radius-md);
		transition: color 100ms ease, background-color 100ms ease;
	}

	.mode-btn:hover {
		color: var(--base0);
	}

	.mode-btn.active {
		color: var(--base1);
		background-color: var(--base03);
	}

	/* Live stats */
	.live-stats {
		display: flex;
		gap: 24px;
		align-items: baseline;
		min-height: 32px;
	}

	.stat-value.timer {
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--blue);
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--base00);
	}

	/* Words display */
	.words-display {
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-size: 1.25rem;
		line-height: 2;
		max-height: calc(1.25rem * 2 * 3);
		overflow: hidden;
		width: 100%;
		cursor: text;
		user-select: none;
	}

	.word {
		display: inline-block;
		color: var(--base01);
		border-bottom: 2px solid transparent;
	}

	.word-space {
		display: inline-block;
		width: 0.5em;
		position: relative;
	}

	.word.current {
		color: var(--base0);
	}

	.word.typed-incorrect {
		border-bottom-color: var(--red);
	}

	.char {
		position: relative;
	}

	.char.correct {
		color: var(--green);
	}

	.char.incorrect {
		color: var(--red);
	}

	.char.extra {
		color: color-mix(in srgb, var(--red), transparent 40%);
		font-size: 0.8em;
	}


	/* Hidden input */
	.hidden-input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
		width: 0;
		height: 0;
	}

	/* Score display — occupies the same space as words-display */
	.score-display {
		width: 100%;
		min-height: calc(1.25rem * 2 * 3);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.score-wpm {
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-size: 4rem;
		font-weight: 700;
		color: var(--blue);
		line-height: 1;
	}

	.score-unit {
		font-size: 0.875rem;
		color: var(--base00);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.score-stats {
		margin-top: 12px;
		font-size: 0.875rem;
		color: var(--base00);
		display: flex;
		gap: 6px;
	}

	.score-dot {
		color: var(--base01);
	}

	.score-actions {
		margin-top: 16px;
	}

	.submit-score {
		padding: 8px 20px;
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--on-accent);
		background: var(--blue);
		border-radius: var(--radius-sm);
		transition: filter 150ms ease;
	}

	.submit-score:hover {
		filter: brightness(1.1);
	}

	.submit-status {
		font-size: 0.85rem;
		color: var(--base00);
	}

	.submit-status.done {
		color: var(--green);
	}

	.submit-status.err {
		color: var(--red);
	}

	.login-link {
		font-size: 0.85rem;
	}

	.restart-hint {
		margin-top: 16px;
		font-size: 0.75rem;
		color: var(--base01);
	}

	kbd {
		display: inline-block;
		padding: 1px 6px;
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-size: 0.6875rem;
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-sm);
		color: var(--base0);
	}

	.leaderboard-section {
		width: 100%;
		margin-top: 16px;
		padding: 20px;
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-lg);
	}

	.leaderboard-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--base00);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 12px;
	}
</style>
