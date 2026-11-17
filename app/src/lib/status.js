// Shared progress status metadata for lessons and assignments.

export const STATUS = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

export const STATUS_META = {
  [STATUS.NOT_STARTED]: {
    label: "Not Started",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
  },
  [STATUS.IN_PROGRESS]: {
    label: "In Progress",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  [STATUS.COMPLETED]: {
    label: "Completed",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

// Items the user is working on come first, finished ones last.
const STATUS_ORDER = [STATUS.IN_PROGRESS, STATUS.NOT_STARTED, STATUS.COMPLETED];

export function normalizeStatus(status) {
  return STATUS_META[status] ? status : STATUS.NOT_STARTED;
}

export function sortByStatus(items) {
  return [...items].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );
}
