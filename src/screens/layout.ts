/**
 * Two-panel screens (media frame + side panel). On wide screens the panels sit
 * side by side and fill the window. On phones and tablets the frame gets a fixed,
 * comfortable height and the panels scroll inside the screen area, so the page
 * itself never scrolls and nothing is squeezed out of reach.
 */
export const split = (cols: string) => `grid min-h-0 flex-1 content-start gap-3 max-lg:overflow-y-auto lg:content-stretch lg:gap-5 ${cols}`;
export const stagePane = 'flex flex-col max-lg:h-[min(44dvh,24rem)] max-lg:shrink-0 lg:min-h-0';
export const sidePane = 'flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto';
