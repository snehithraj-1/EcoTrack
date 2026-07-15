export const DEFAULT_BUDGET = 8;

export const TRANSPORT_OPTIONS = [
  { value: "car_petrol", label: "Car petrol", factor: 0.192 },
  { value: "car_diesel", label: "Car diesel", factor: 0.171 },
  { value: "car_electric", label: "Car electric", factor: 0.053 },
  { value: "bus", label: "Bus", factor: 0.089 },
  { value: "train", label: "Train", factor: 0.041 },
  { value: "motorcycle", label: "Motorcycle", factor: 0.114 },
  { value: "bicycle", label: "Bicycle", factor: 0 },
  { value: "walking", label: "Walking", factor: 0 },
  { value: "flight_short_haul", label: "Flight short-haul", factor: 0.255 },
  { value: "flight_long_haul", label: "Flight long-haul", factor: 0.195 },
];

export const FOOD_OPTIONS = [
  { value: "meat_heavy", label: "Meat-heavy", daily: 7.19 },
  { value: "omnivore", label: "Omnivore", daily: 5.63 },
  { value: "vegetarian", label: "Vegetarian", daily: 3.81 },
  { value: "vegan", label: "Vegan", daily: 2.89 },
];

export const CATEGORY_STYLES = {
  travel: {
    label: "Travel",
    ring: "ring-emerald-200",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    chart: "#16a34a",
  },
  food: {
    label: "Food",
    ring: "ring-amber-200",
    text: "text-amber-700",
    bg: "bg-amber-50",
    chart: "#f59e0b",
  },
  energy: {
    label: "Energy",
    ring: "ring-sky-200",
    text: "text-sky-700",
    bg: "bg-sky-50",
    chart: "#0284c7",
  },
};

export const ENERGY_FACTOR = 0.233;
