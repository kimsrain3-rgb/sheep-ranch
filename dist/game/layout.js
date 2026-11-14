// Compact UI follows available space, including phones rotated horizontally.
// Keep the corresponding media query in style.css synchronized with this value.
export const COMPACT_UI_QUERY='(max-width:700px), (max-height:540px)';
export function isCompactViewport(width,height){return width<=700||height<=540;}
