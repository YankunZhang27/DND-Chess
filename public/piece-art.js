// Hand-drawn medieval/D&D-class silhouettes for each piece type, as raw SVG
// shape markup rendered inside a 0 0 100 100 viewBox. Kept as simple
// silhouettes (no gradients or fine detail) so they stay crisp at any size
// and legible on both light and dark squares — see styles.css for the
// stroke-outline treatment that gives each piece its contrast.
export const PIECE_PATHS = {
	// Pawn — Militia: a common foot soldier, plain helmet and spear-ready stance.
	p: `
		<rect x="28" y="85" width="44" height="8" rx="3"/>
		<path d="M38,85 L34,55 Q50,42 66,55 L62,85 Z"/>
		<rect x="45" y="15" width="10" height="8"/>
		<circle cx="50" cy="30" r="13"/>
	`,

	// Knight — Ranger: a horse's head and neck, ready to scout ahead.
	n: `
		<rect x="22" y="86" width="60" height="8" rx="2"/>
		<polygon points="34,86 40,42 62,42 66,86"/>
		<ellipse cx="44" cy="34" rx="18" ry="12" transform="rotate(-25 44 34)"/>
		<polygon points="48,22 55,8 60,25"/>
		<polygon points="24,36 32,32 30,42"/>
	`,

	// Bishop — Wizard: a tall pointed hat with a brim and a starlit tip.
	b: `
		<rect x="32" y="84" width="36" height="8" rx="3"/>
		<path d="M50,18 L62,50 Q66,70 60,84 L40,84 Q34,70 38,50 Z"/>
		<ellipse cx="50" cy="50" rx="17" ry="5"/>
		<circle cx="50" cy="16" r="4"/>
	`,

	// Rook — Paladin: a fortified tower bearing a holy cross emblem.
	r: `
		<rect x="22" y="84" width="56" height="9" rx="2"/>
		<rect x="28" y="42" width="44" height="42"/>
		<rect x="28" y="24" width="11" height="18"/>
		<rect x="44.5" y="24" width="11" height="18"/>
		<rect x="61" y="24" width="11" height="18"/>
		<rect x="47" y="52" width="6" height="22"/>
		<rect x="38" y="60" width="24" height="6"/>
	`,

	// Queen — Sorceress: a jeweled, many-pointed crown of arcane power.
	q: `
		<rect x="28" y="84" width="44" height="9" rx="3"/>
		<path d="M50,30 L60,55 Q64,72 58,84 L42,84 Q36,72 40,55 Z"/>
		<polygon points="34,42 38,20 44,36 50,16 56,36 62,20 66,42"/>
		<circle cx="38" cy="20" r="3.5"/>
		<circle cx="50" cy="16" r="3.5"/>
		<circle cx="62" cy="20" r="3.5"/>
	`,

	// King — the crown and cross of the realm itself.
	k: `
		<rect x="28" y="84" width="44" height="9" rx="3"/>
		<path d="M50,32 L60,55 Q65,72 59,84 L41,84 Q35,72 40,55 Z"/>
		<rect x="38" y="26" width="24" height="8" rx="1"/>
		<rect x="47" y="9" width="6" height="17"/>
		<rect x="41" y="13" width="18" height="6"/>
	`,
};

// Placeholder D&D-class skin for each piece type — swap for real names/art
// once Figma screens are available (see ProductSpec.md §1).
export const PIECE_CLASS_NAMES = {
	k: "King",
	q: "Sorceress",
	r: "Paladin",
	b: "Wizard",
	n: "Ranger",
	p: "Militia",
};
