/* Icônes en trait, dessinées à la main pour éviter une dépendance. */

export const Ico = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

export const I = {
  back: <path d="M15 19l-7-7 7-7" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  more: <><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></>,
  close: <><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>,
  folder: <path d="M4 7a2 2 0 012-2h3.5l2 2H18a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />,
  install: <><path d="M12 3v11" /><path d="M8 11l4 4 4-4" /><path d="M5 20h14" /></>,
};
