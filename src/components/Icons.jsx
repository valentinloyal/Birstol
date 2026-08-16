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
  annuler: <><path d="M3 8h11a5 5 0 010 10h-4" /><path d="M7 4L3 8l4 4" /></>,
  crayon: <><path d="M4 20h4l10-10a2.8 2.8 0 10-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></>,
  cours: <><path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2V5z" /><path d="M8 7h7" /><path d="M8 11h7" /><path d="M8 15h4" /></>,
  loupe: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  cocher: <><path d="M4 6.5h9" /><path d="M4 12h9" /><path d="M4 17.5h9" /><path d="M16.5 5.5l2 2 3.5-3.5" /><path d="M16.5 16.5l2 2 3.5-3.5" /></>,
  astuce: <><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 00-3.6 10.8c.5.4.8 1 .9 1.6h5.4c.1-.6.4-1.2.9-1.6A6 6 0 0012 3z" /></>,
};
