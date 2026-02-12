<script lang="ts">
	import { onMount } from 'svelte';
	import { randomWords } from '$lib/typing/words.js';

	// --- Constants ---
	const CW = 800;
	const CH = 400;
	const SHIP_X = 120;
	const BASE_SPEED = 1;
	const SPEED_RAMP = 0.0005;
	const BASE_SPAWN = 90;
	const MIN_SPAWN = 15;
	const SPAWN_RAMP = 0.005;
	const STEER = 0.3;
	const BASELINE_WPM = 40;
	const DAMP = 0.92;
	const GRAVITY = 0.05;
	const WPM_WINDOW = 3000;
	const SHIP_R = 12;

	// --- Types ---
	interface Asteroid {
		x: number;
		y: number;
		r: number;
		verts: Array<{ x: number; y: number }>;
		rot: number;
		rotSpeed: number;
	}

	interface Star {
		x: number;
		y: number;
		size: number;
		speed: number;
	}

	// --- Template-bound state ---
	let gameState: 'idle' | 'playing' | 'over' = $state('idle');
	let words: string[] = $state([]);
	let currentWordIndex = $state(0);
	let currentInput = $state('');

	// --- Canvas-only state ---
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let inputEl: HTMLInputElement | undefined = $state();
	let animFrame = 0;

	let shipY = CH / 2;
	let shipVY = 0;
	let asteroids: Asteroid[] = [];
	let stars: Star[] = [];
	let gameSpeed = BASE_SPEED;
	let frameCount = 0;
	let score = 0;
	let spawnTimer = 0;
	let keyTimestamps: number[] = [];
	let wpm = 0;
	let prevWpm = 0;

	// --- Stars ---
	function initStars() {
		stars = [];
		for (let i = 0; i < 80; i++) {
			stars.push({
				x: Math.random() * CW,
				y: Math.random() * CH,
				size: Math.random() * 2 + 0.5,
				speed: Math.random() * 1.5 + 0.5,
			});
		}
	}

	// --- Asteroids ---
	function createAsteroid(): Asteroid {
		const r = 15 + Math.random() * 30;
		const n = 7 + Math.floor(Math.random() * 5);
		const verts = [];
		for (let i = 0; i < n; i++) {
			const a = (i / n) * Math.PI * 2;
			const d = r * (0.7 + Math.random() * 0.3);
			verts.push({ x: Math.cos(a) * d, y: Math.sin(a) * d });
		}
		return {
			x: CW + r,
			y: r + Math.random() * (CH - r * 2),
			r,
			verts,
			rot: Math.random() * Math.PI * 2,
			rotSpeed: (Math.random() - 0.5) * 0.02,
		};
	}

	// --- WPM ---
	function computeWPM(): number {
		const now = Date.now();
		const cutoff = now - WPM_WINDOW;
		while (keyTimestamps.length > 0 && keyTimestamps[0] < cutoff) {
			keyTimestamps.shift();
		}
		if (keyTimestamps.length < 2) return 0;
		const mins = (now - keyTimestamps[0]) / 60000;
		if (mins === 0) return 0;
		return (keyTimestamps.length / 5) / mins;
	}

	// --- Game lifecycle ---
	function resetGame() {
		gameState = 'idle';
		score = 0;
		gameSpeed = BASE_SPEED;
		frameCount = 0;
		shipY = CH / 2;
		shipVY = 0;
		asteroids = [];
		spawnTimer = 0;
		keyTimestamps = [];
		wpm = 0;
		prevWpm = 0;
		words = randomWords(200);
		currentWordIndex = 0;
		currentInput = '';
		initStars();
	}

	function startGame() {
		gameState = 'playing';
		frameCount = 0;
	}

	function endGame() {
		gameState = 'over';
	}

	// --- Update ---
	function update() {
		if (gameState !== 'playing') return;

		frameCount++;
		gameSpeed = BASE_SPEED + frameCount * SPEED_RAMP;

		// Steering from WPM delta (relative to baseline)
		prevWpm = wpm;
		wpm = computeWPM();
		const delta = (wpm || BASELINE_WPM) - (prevWpm || BASELINE_WPM);
		shipVY -= delta * STEER;
		shipVY += GRAVITY;
		shipVY *= DAMP;
		shipY += shipVY;
		shipY = Math.max(20, Math.min(CH - 20, shipY));

		// Spawn
		spawnTimer++;
		const interval = Math.max(MIN_SPAWN, BASE_SPAWN - frameCount * SPAWN_RAMP);
		if (spawnTimer >= interval) {
			asteroids.push(createAsteroid());
			spawnTimer = 0;
		}

		// Move asteroids
		for (let i = asteroids.length - 1; i >= 0; i--) {
			const a = asteroids[i];
			a.x -= gameSpeed;
			a.rot += a.rotSpeed;
			if (a.x + a.r < 0) {
				asteroids.splice(i, 1);
				score += 10;
			}
		}

		// Stars
		for (const s of stars) {
			s.x -= s.speed * (gameSpeed / BASE_SPEED);
			if (s.x < 0) {
				s.x = CW;
				s.y = Math.random() * CH;
			}
		}

		// Collision
		for (const a of asteroids) {
			const dx = SHIP_X - a.x;
			const dy = shipY - a.y;
			if (Math.sqrt(dx * dx + dy * dy) < a.r * 0.8 + SHIP_R) {
				endGame();
				return;
			}
		}

		score += Math.max(1, Math.floor(gameSpeed));
	}

	// --- Render ---
	function render() {
		if (!ctx) return;

		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, CW, CH);

		// Stars
		for (const s of stars) {
			ctx.globalAlpha = s.size / 2.5;
			ctx.fillStyle = '#fff';
			ctx.fillRect(s.x, s.y, s.size, s.size);
		}
		ctx.globalAlpha = 1;

		// Asteroids
		for (const a of asteroids) drawAsteroid(a);

		// Ship
		drawShip(SHIP_X, shipY);

		// HUD
		ctx.fillStyle = '#fff';
		ctx.font = '14px "Courier Prime", monospace';
		ctx.textAlign = 'left';
		ctx.fillText(`SCORE ${score}`, 16, 28);
		ctx.textAlign = 'right';
		ctx.fillText(`${Math.round(wpm)} WPM`, CW - 16, 28);
		const speedLabel = (gameSpeed / BASE_SPEED).toFixed(1);
		ctx.fillText(`SPEED ${speedLabel}x`, CW - 16, 48);

		// Overlays
		if (gameState === 'idle') {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
			ctx.fillRect(0, 0, CW, CH);
			ctx.textAlign = 'center';
			ctx.fillStyle = '#fff';
			ctx.font = 'bold 24px "Courier Prime", monospace';
			ctx.fillText('TYPE TO FLY', CW / 2, CH / 2 - 10);
			ctx.font = '14px "Courier Prime", monospace';
			ctx.fillStyle = '#666';
			ctx.fillText('start typing to launch', CW / 2, CH / 2 + 18);
		}

		if (gameState === 'over') {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
			ctx.fillRect(0, 0, CW, CH);
			ctx.textAlign = 'center';
			ctx.fillStyle = '#fff';
			ctx.font = 'bold 36px "Courier Prime", monospace';
			ctx.fillText('GAME OVER', CW / 2, CH / 2 - 24);
			ctx.font = '20px "Courier Prime", monospace';
			ctx.fillText(`${score}`, CW / 2, CH / 2 + 14);
			ctx.font = '14px "Courier Prime", monospace';
			ctx.fillStyle = '#666';
			ctx.fillText('press enter to restart', CW / 2, CH / 2 + 50);
		}
	}

	/** Draw the ship — replace body with ctx.drawImage(sprite, ...) for custom art */
	function drawShip(x: number, y: number) {
		ctx.save();
		ctx.translate(x, y);

		// Body
		ctx.beginPath();
		ctx.moveTo(16, 0);
		ctx.lineTo(-12, -10);
		ctx.lineTo(-8, 0);
		ctx.lineTo(-12, 10);
		ctx.closePath();
		const g = ctx.createLinearGradient(0, -10, 0, 10);
		g.addColorStop(0, '#ddd');
		g.addColorStop(0.5, '#fff');
		g.addColorStop(1, '#999');
		ctx.fillStyle = g;
		ctx.fill();
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 1;
		ctx.stroke();

		// Engine flame
		if (gameState === 'playing' && wpm > 0) {
			const len = 4 + Math.random() * (Math.min(wpm, 120) / 10);
			ctx.beginPath();
			ctx.moveTo(-8, 0);
			ctx.lineTo(-8 - len, -3);
			ctx.lineTo(-8 - len - 2, 0);
			ctx.lineTo(-8 - len, 3);
			ctx.closePath();
			ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.4})`;
			ctx.fill();
		}

		ctx.restore();
	}

	/** Draw an asteroid — replace body with ctx.drawImage(sprite, ...) for custom art */
	function drawAsteroid(a: Asteroid) {
		ctx.save();
		ctx.translate(a.x, a.y);
		ctx.rotate(a.rot);

		ctx.beginPath();
		ctx.moveTo(a.verts[0].x, a.verts[0].y);
		for (let i = 1; i < a.verts.length; i++) {
			ctx.lineTo(a.verts[i].x, a.verts[i].y);
		}
		ctx.closePath();
		ctx.fillStyle = '#1a1a1a';
		ctx.fill();
		ctx.strokeStyle = '#555';
		ctx.lineWidth = 1.5;
		ctx.stroke();

		// Highlight
		ctx.beginPath();
		ctx.arc(-a.r * 0.15, -a.r * 0.2, a.r * 0.25, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(255,255,255,0.06)';
		ctx.fill();

		ctx.restore();
	}

	function gameLoop() {
		update();
		render();
		animFrame = requestAnimationFrame(gameLoop);
	}

	// --- Input ---
	function handleInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;

		if (gameState === 'idle') startGame();
		if (gameState !== 'playing') return;

		keyTimestamps.push(Date.now());

		if (value.endsWith(' ')) {
			const typed = value.trimEnd();
			const expected = words[currentWordIndex];
			if (typed === expected) score += expected.length * 5;
			currentWordIndex++;
			currentInput = '';
			if (currentWordIndex + 30 >= words.length) {
				words = [...words, ...randomWords(100)];
			}
			return;
		}

		currentInput = value;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Tab') e.preventDefault();
		if (e.key === 'Enter' && gameState === 'over') {
			e.preventDefault();
			resetGame();
		}
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (e.key === 'Tab') e.preventDefault();
		if (e.key === 'Enter' && gameState === 'over') {
			e.preventDefault();
			resetGame();
		}
		if (gameState !== 'over' && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
			inputEl?.focus();
		}
	}

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		resetGame();
		document.addEventListener('keydown', handleGlobalKeydown);
		gameLoop();
		requestAnimationFrame(() => inputEl?.focus());
		return () => {
			document.removeEventListener('keydown', handleGlobalKeydown);
			cancelAnimationFrame(animFrame);
		};
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="game-page">
	<div class="game-container" onclick={() => inputEl?.focus()}>
		<canvas bind:this={canvas} width={CW} height={CH} class="game-canvas"></canvas>
		<div class="words-bar">
			{#each words.slice(currentWordIndex, currentWordIndex + 10) as word, i}
				<span class="word" class:current={i === 0}>
					{#if i === 0}
						{#each word.split('') as char, ci}
							<span
								class="ch"
								class:correct={ci < currentInput.length && currentInput[ci] === char}
								class:incorrect={ci < currentInput.length && currentInput[ci] !== char}
							>{char}</span>
						{/each}
					{:else}
						{word}
					{/if}
				</span>
			{/each}
		</div>
	</div>

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
</div>

<style>
	.game-page {
		max-width: 800px;
		margin: 0 auto;
		padding-top: 32px;
	}

	.game-container {
		background: #000;
		border-radius: var(--radius-lg);
		overflow: hidden;
		cursor: text;
	}

	.game-canvas {
		display: block;
		width: 100%;
		height: auto;
	}

	.words-bar {
		padding: 12px 16px;
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-size: 1.125rem;
		line-height: 1.6;
		white-space: nowrap;
		overflow: hidden;
		border-top: 1px solid #222;
	}

	.word {
		color: #555;
		margin-right: 0.5em;
	}

	.word.current {
		color: #aaa;
	}

	.ch.correct {
		color: #fff;
	}

	.ch.incorrect {
		color: #e03a3e;
	}

	.hidden-input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
		width: 0;
		height: 0;
	}
</style>
