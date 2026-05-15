
export enum PrologueLines {
    LINE_0 = "25 years ago, the Steamheart was shattered.",
    LINE_1 = "One half , lost to ice, felt something familiar near.",
    LINE_2 = "...",
    LINE_3 = "Where am I?",
    LINE_4 = "I have to get out of here.",
}


export enum BlazikenLines {
    LINE_0 = "I remember now, the other half...",
    LINE_1 = "Blaziken...",
    LINE_2 = "Together again.",
}


export const IceBreakConfig = {
    PRESSES_PER_LAYER: 2,
    TOTAL_LAYERS:      4,   // 4 layers × 2 presses = 8 total
};


export const TextboxConfig = {
    WIDTH:        312,
    HEIGHT:       34,
    BOTTOM_PAD:   16,    // gap from screen bottom
    LEFT_PAD:     100,    // gap from screen left
    FONT_SIZE:    24,    // pixels, adjust to taste
    FONT:         "PixelSimple",  // make sure to load this in your scene's preload()
    TEXT_COLOR:   "#FFFFFF",
    BG_COLOR:     [0, 0, 0] as [number, number, number],
    BG_ALPHA:     0.85,
    CHARS_PER_TICK: 2,  // typewriter speed (chars per frame)
    TICKS_PER_CHAR: 2,  // frames between each character
};