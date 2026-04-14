/**
 * Seed demo data for Soccer Coaching MVP (merged with localStorage at runtime).
 */
(function (global) {
  const DEMO_USERS = {
    coach: {
      id: "user-coach-1",
      email: "coach@demo.com",
      password: "demo",
      name: "Alex Morgan",
      role: "coach",
    },
    player: {
      id: "user-player-1",
      email: "parent@demo.com",
      password: "demo",
      name: "Jordan Lee",
      role: "player",
      teamId: "team-1",
    },
  };

  const DEMO_TEAMS = [
    {
      id: "team-1",
      name: "U12 Lightning",
      coachId: "user-coach-1",
      createdAt: "2026-04-01T10:00:00.000Z",
    },
  ];

  const DEMO_WEEKLY = [
    {
      id: "session-1",
      teamId: "team-1",
      weekOf: "2026-04-14",
      title: "Week of Apr 14 — Possession & Finishing",
      drills: [
        {
          id: "d1",
          title: "4v4 + 2 neutrals",
          duration: "20 min",
          notes: "Keep the ball; neutrals play with the team in possession. Emphasize body shape before receiving.",
        },
        {
          id: "d2",
          title: "Finishing circuit",
          duration: "25 min",
          notes: "Three stations: driven shot, first-time finish, cut inside. Rotate every 6 minutes.",
        },
      ],
      coachingPoints: [
        "Scan before the ball arrives — picture your next pass.",
        "Finish with your laces across the keeper when possible.",
        "Defensive shape: compact, force play wide.",
      ],
      videos: [
        {
          id: "v1",
          title: "Rondo basics (reference)",
          url: "https://www.youtube.com/results?search_query=youth+soccer+rondo+drill",
        },
      ],
      links: [
        { id: "l1", label: "US Youth Soccer — practice ideas", url: "https://www.usyouthsoccer.org/" },
      ],
      updatedAt: "2026-04-13T18:00:00.000Z",
    },
  ];

  const DEMO_NOTIFICATIONS = [
    {
      id: "n1",
      userId: "user-coach-1",
      role: "coach",
      message: "Welcome! Your team hub is ready.",
      read: true,
      createdAt: "2026-04-10T09:00:00.000Z",
    },
    {
      id: "n2",
      userId: "user-player-1",
      role: "player",
      message: "New training plan posted for the week of Apr 14.",
      read: false,
      createdAt: "2026-04-13T18:05:00.000Z",
    },
  ];

  global.DEMO_SEED = {
    users: DEMO_USERS,
    teams: DEMO_TEAMS,
    weeklySessions: DEMO_WEEKLY,
    notifications: DEMO_NOTIFICATIONS,
    checklistTemplates: [
      { id: "c1", label: "10 min ball mastery (both feet)" },
      { id: "c2", label: "20 passes against a wall or rebounder" },
      { id: "c3", label: "15 min juggling (record your best streak)" },
      { id: "c4", label: "Watch the team video link once" },
    ],
  };
})(typeof window !== "undefined" ? window : globalThis);
