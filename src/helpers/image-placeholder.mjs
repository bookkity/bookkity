// A shared SVG data URL needs no extra request or per-image placeholder file.
export const IMAGE_SHIMMER = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
<style>.shine{animation:shimmer 1.6s linear infinite}@keyframes shimmer{from{transform:translateX(-100px)}to{transform:translateX(100px)}}@media(prefers-reduced-motion:reduce){.shine{animation:none;opacity:0}}</style>
<defs><linearGradient id="g"><stop stop-color="#e5e7eb" stop-opacity="0"/><stop offset=".5" stop-color="#f9fafb"/><stop offset="1" stop-color="#e5e7eb" stop-opacity="0"/></linearGradient></defs>
<path fill="#e5e7eb" d="M0 0h100v100H0z"/><path class="shine" fill="url(#g)" d="M0 0h100v100H0z"/>
</svg>`)}`
