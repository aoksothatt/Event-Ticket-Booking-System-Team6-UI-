/**
 * MOCK DATA — TEMPORARY
 * =====================
 * Used ONLY when the backend API is unavailable, to preview the UI.
 * This file is intentionally self-contained so it can be deleted by:
 *   1. removing `USE_MOCK_FALLBACK = true` in src/api/http.js, and
 *   2. deleting this file.
 * No real implementation code depends on these images/strings beyond
 * the clearly-marked fallback in each API module.
 */

const IMG = {
  festival:
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80",
  concert:
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80",
  tech: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1200&q=80",
  sports:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  workshop:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  conf: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
  comedy:
    "https://images.unsplash.com/photo-1527224538127-2104bb71c51b?auto=format&fit=crop&w=1200&q=80",
};

export const categories = [
  { id: 1, name: "Music", description: "Live music & concerts" },
  { id: 2, name: "Technology", description: "Tech events & conferences" },
  { id: 3, name: "Sports", description: "Sporting events" },
  { id: 4, name: "Workshops", description: "Hands-on learning" },
  { id: 5, name: "Festival", description: "Large festivals" },
  { id: 6, name: "Comedy", description: "Stand-up & shows" },
];

const mk = (
  id,
  category,
  title,
  slug,
  start_date,
  start_time,
  venue,
  price,
  img,
  extra = {}
) => ({
  id,
  category_id: category.id,
  venue_id: 1,
  title,
  slug,
  description:
    "Experience an unforgettable event with incredible performers, great energy, and lasting memories.",
  start_date,
  end_date: start_date,
  start_time,
  end_time: "23:00:00",
  status: "published",
  banner: img,
  category,
  venue: { id: 1, name: venue },
  images: [{ id, image_path: img }],
  ticket_types: [
    { id: id * 10 + 1, name: "Standard", price },
    { id: id * 10 + 2, name: "VIP", price: Math.round(price * 1.6) },
  ],
  ...extra,
});

const music = categories[0];
const tech = categories[1];
const sports = categories[2];
const workshop = categories[3];
const festival = categories[4];
const comedy = categories[5];

export const events = [
  mk(1, music, "Phnom Penh Music Festival 2026", "phnom-penh-music-festival", "2026-12-20", "19:00:00", "Koh Pich Convention Center", 15, IMG.festival, { trending: true, featured: true }),
  mk(2, music, "Sunset Live Concert", "sunset-live-concert", "2026-10-02", "18:30:00", "Olympic Stadium", 25, IMG.concert, { trending: true }),
  mk(3, tech, "Tech Innovation Summit", "tech-innovation-summit", "2026-09-15", "09:00:00", "Sofitel Phnom Penh", 45, IMG.tech, { trending: true }),
  mk(4, sports, "Cambodia Marathon 2026", "cambodia-marathon", "2026-11-08", "06:00:00", "Riverfront Park", 20, IMG.sports, { trending: true, featured: true }),
  mk(5, workshop, "UI/UX Design Workshop", "ui-ux-design-workshop", "2026-09-22", "13:00:00", "CoWorking Space BKK1", 30, IMG.workshop),
  mk(6, festival, "Angkor Night Festival", "angkor-night-festival", "2027-01-14", "17:00:00", "Siem Reap City", 12, IMG.festival, { featured: true }),
  mk(7, comedy, "Comedy Night Cambodia", "comedy-night-cambodia", "2026-10-18", "20:00:00", "Major Cineplex", 18, IMG.comedy),
  mk(8, tech, "AI & Data Conference", "ai-data-conference", "2026-11-25", "09:30:00", "NagaWorld Convention", 60, IMG.tech, { trending: true }),
  mk(9, music, "Jazz by the Riverside", "jazz-by-the-riverside", "2026-12-05", "19:30:00", "Sisowath Quay", 22, IMG.concert),
  mk(10, sports, "Basketball All-Star Game", "basketball-all-star-game", "2026-10-30", "18:00:00", "Indoor Sports Arena", 15, IMG.sports, { featured: true }),
  mk(11, workshop, "Startup Founder Bootcamp", "startup-founder-bootcamp", "2026-10-25", "08:30:00", "Impact Hub Phnom Penh", 40, IMG.workshop),
  mk(12, festival, "Water Festival Celebration", "water-festival-celebration", "2026-11-28", "16:00:00", "Chroy Changvar Riverside", 10, IMG.festival),
  mk(13, comedy, "Stand-up Open Mic", "standup-open-mic", "2026-09-28", "21:00:00", "The Box Office", 12, IMG.comedy),
  mk(14, music, "K-Pop Fan Concert", "kpop-fan-concert", "2026-12-12", "18:00:00", "Koh Pich Convention Center", 35, IMG.concert, { trending: true }),
];

export const featuredEvents = events.filter((e) => e.featured);
export const trendingEvents = events.filter((e) => e.trending);
export const upcomingEvents = [...events].sort((a, b) => a.start_date.localeCompare(b.start_date));

export function searchEvents(query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];
  return events.filter((e) => {
    const inTitle = (e.title || "").toLowerCase().includes(q);
    const inCategory = (e.category?.name || "").toLowerCase().includes(q);
    const inVenue = (e.venue?.name || "").toLowerCase().includes(q);
    return inTitle || inCategory || inVenue;
  });
}
