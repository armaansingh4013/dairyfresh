export const mockStats = [
  { label: "Fat tested", value: "4.5%", tone: "success" },
  { label: "Morning slot", value: "6:00 AM", tone: "default" },
  { label: "This month", value: "29 drops", tone: "warning" }
];

export const mockProducts = [
  {
    id: "milk",
    name: "A2 Cow Milk",
    description: "Daily morning staple with chilled farm-to-door delivery.",
    price: 64,
    unit: "liter",
    tag: "Best seller"
  },
  {
    id: "buffalo",
    name: "Buffalo Milk",
    description: "Higher cream content for chai, sweets, and thick curd.",
    price: 72,
    unit: "liter",
    tag: "Rich texture"
  },
  {
    id: "curd",
    name: "Set Curd",
    description: "Small-batch cultured curd prepared each evening.",
    price: 48,
    unit: "500 g",
    tag: "Fresh batch"
  },
  {
    id: "paneer",
    name: "Soft Paneer",
    description: "High-protein paneer cut fresh for weekly add-ons.",
    price: 95,
    unit: "200 g",
    tag: "Weekend add-on"
  }
];

export const mockDeliveries = [
  {
    id: "del-1",
    title: "Tomorrow",
    time: "6:00 AM - 7:00 AM",
    address: "Palm Residency, Indiranagar",
    items: "1 L A2 Cow Milk",
    status: "On route"
  },
  {
    id: "del-2",
    title: "Saturday",
    time: "6:00 AM - 7:00 AM",
    address: "Palm Residency, Indiranagar",
    items: "1 L A2 Cow Milk, 500 g Curd",
    status: "Scheduled"
  },
  {
    id: "del-3",
    title: "Sunday",
    time: "Paused",
    address: "Palm Residency, Indiranagar",
    items: "No delivery",
    status: "Skipped"
  }
];

export const mockBilling = {
  currentDue: 1860,
  nextDebit: "05 Apr",
  paymentMethod: "UPI Autopay",
  invoices: [
    { id: "inv-1", month: "March 2026", total: 1860, status: "Due" },
    { id: "inv-2", month: "February 2026", total: 1748, status: "Paid" },
    { id: "inv-3", month: "January 2026", total: 1692, status: "Paid" }
  ]
};

export const mockProfile = {
  name: "Armaan Singh",
  phone: "+91 98765 43210",
  plan: "Daily essentials",
  address: "Palm Residency, 12th Main, Indiranagar, Bengaluru",
  preferences: [
    "Ring bell only if extra items are added.",
    "Leave bottle in the insulated crate.",
    "Prefer WhatsApp for plan changes."
  ]
};

export function createInitialWeeklyPlan() {
  return [
    { key: "mon", label: "Mon", quantity: 1, active: true },
    { key: "tue", label: "Tue", quantity: 1, active: true },
    { key: "wed", label: "Wed", quantity: 1.5, active: true },
    { key: "thu", label: "Thu", quantity: 1, active: true },
    { key: "fri", label: "Fri", quantity: 1.5, active: true },
    { key: "sat", label: "Sat", quantity: 2, active: true },
    { key: "sun", label: "Sun", quantity: 0, active: false }
  ];
}
