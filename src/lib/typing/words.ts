/** Common English words for typing tests */
export const WORDS: string[] = [
	'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
	'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
	'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
	'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
	'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
	'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
	'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
	'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
	'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
	'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
	'any', 'these', 'give', 'day', 'most', 'us', 'great', 'between', 'need',
	'large', 'under', 'never', 'each', 'right', 'hand', 'high', 'place',
	'small', 'found', 'still', 'own', 'light', 'here', 'keep', 'help',
	'home', 'kind', 'thought', 'world', 'head', 'long', 'before', 'turn',
	'move', 'around', 'point', 'city', 'old', 'show', 'play', 'live',
	'man', 'change', 'off', 'house', 'might', 'run', 'end', 'does', 'part',
	'should', 'name', 'while', 'call', 'must', 'being', 'where', 'much',
	'down', 'life', 'may', 'water', 'been', 'many', 'side', 'find', 'long',
	'very', 'more', 'write', 'made', 'number', 'sound', 'such', 'line',
	'open', 'same', 'tell', 'follow', 'start', 'both', 'few', 'those',
	'left', 'every', 'next', 'read', 'land', 'near', 'build', 'face',
	'thing', 'set', 'three', 'state', 'story', 'eye', 'group', 'early',
	'begin', 'young', 'real', 'above', 'school', 'ever', 'last', 'let',
	'night', 'paper', 'hard', 'close', 'east', 'later', 'idea', 'enough',
];

/** Quotes for quote mode */
export const QUOTES: string[] = [
	// Keyboard trivia
	"Christopher Latham Sholes created the QWERTY keyboard layout in the early 1870s.",
	"The Remington Number Two typewriter introduced the shift key in 1878.",
	"The shift key physically moved the typebar basket to strike a different character.",
	"Remington began producing its first commercial typewriter on March 1, 1873.",
	"The QWERTY layout was designed to reduce jamming of typebars on early typewriters.",
	"August Dvorak patented his simplified keyboard layout in 1936.",
	"About 70 percent of Dvorak keystrokes occur on the home row where fingers naturally rest.",
	"Colemak was released in 2006 by Shai Coleman as an alternative keyboard layout.",
	"Only 32 percent of English typing on a QWERTY keyboard happens on the home row.",
	"Cherry MX mechanical switches were first developed and patented in the early 1980s.",
	"IBM received a patent for the buckling spring key switch mechanism in 1978.",
	"The IBM Model M keyboard entered production in 1985 with buckling spring switches.",
	"Many IBM Model M keyboards still function perfectly after more than four decades of use.",
	"The space bar is the widest key on the keyboard and was present on the earliest typewriters.",
	"Function keys first appeared on the Flexowriter Programmatic terminal keyboard in 1965.",
	"Dvorak became interested in keyboard layouts while advising a thesis on typing errors.",
	"The Model M was designed to be less expensive to produce than the earlier Model F.",
	// Sheldon Solomon
	"Our longing to transcend death inflames violence toward each other.",
	"Self-esteem is the belief that you are a person of value in a world of meaning.",
	"The knowledge of death rather than death itself is the worm at the core.",
	"Culture gives us a sense that life has meaning by offering assurances of immortality.",
	"We are breathing pieces of defecating meat no more significant than a potato.",
	"Cultural worldviews are fragile human constructions that people spend great energy defending.",
	"When reminded of death we cling more tightly to our beliefs and disparage outsiders.",
	"Self-esteem is the foundation of psychological fortitude for us all.",
	"Come to terms with death and thereafter anything is possible.",
	"Death anxiety operates beneath conscious awareness shaping our thoughts feelings and behaviors.",
	"Empathy is critical for reducing our hostile reactions to reminders of mortality.",
	"We manage existential terror by embracing belief systems that tell us life has meaning.",
	"No symbolic belief system is ever powerful enough to completely eradicate the anxiety of death.",
	"Contemplating death with honesty allows us to more deeply appreciate being alive.",
	"We still worship but now we worship money and political leaders instead of gods.",
	// Mountains, flora/fauna, geology
	"Mount Everest rises to 8849 meters above sea level.",
	"The Andes form the longest continental mountain range in the world at 8900 kilometers.",
	"Fold mountains form when tectonic plates collide and the crust buckles under compression.",
	"Volcanic mountains form along plate boundaries where subducting oceanic crust melts into magma.",
	"Glaciers erode rock through three main processes: abrasion, plucking, and ice thrusting.",
	"Moraines are landforms composed of unsorted debris deposited by glacial ice.",
	"Alpine tundra exists above the treeline where trees cannot survive the harsh conditions.",
	"The alpine growing season typically lasts between 45 and 90 days each year.",
	"Snow leopards inhabit alpine zones at elevations between 3000 and 5000 meters.",
	"Pikas survive winter by eating dried plants they stored in tunnels under rocks.",
	"Marmots are large ground squirrels that hibernate underground throughout the entire winter season.",
	"Mountain goats are the largest mammals found above 4000 meters in elevation.",
	"Cushion plants grow in low dense clumps to escape strong alpine winds overhead.",
	"Alpine plants begin photosynthesis at lower temperatures than species adapted to warmer elevations.",
	"Metamorphic rocks form when existing rock is transformed by extreme heat and pressure.",
	"Erosion of mountain ranges gradually exposes deep metamorphic rock at the surface.",
	"The Himalayas contain more than 100 peaks exceeding 7200 meters.",
	"Lateral moraines form along the sides of a glacier as it advances through valleys.",
	"Alpine meadows develop where weathered rock produces soils deep enough to support grasses.",
	"Lichens can photosynthesize at any temperature above zero degrees Celsius in alpine environments.",
];

/** Pick n random words from the list */
export function randomWords(count: number): string[] {
	const result: string[] = [];
	for (let i = 0; i < count; i++) {
		result.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
	}
	return result;
}

/** Pick a random quote */
export function randomQuote(): string {
	return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
