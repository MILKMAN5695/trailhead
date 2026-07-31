import React, { useState, useEffect, useRef } from "react";
import {
  Plus, X, Trash2, Pencil, Camera, Check, ChevronDown, ArrowLeft,
  MapPin, CalendarDays, Route, Droplet, Backpack, Search,
  AlertTriangle, Star, TrendingUp, Globe, FileText, Save, CloudOff,
  Tent, Moon, Flame, Shirt, Zap, Package, Thermometer, Cloud
} from "lucide-react";
import { googleSearch } from "./googleSearch";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fjalla+One&family=Source+Sans+3:wght@400;500;600;700&display=swap');`;

const COLORS = {
  paper: "#12151A",
  card: "#1B1F26",
  cardRaised: "#232833",
  ink: "#EDE8DB",
  moss: "#7A9A5C",
  mossDark: "#1D2A17",
  ember: "#E2953D",
  sky: "#5B9BD5",
  warn: "#E2953D",
  star: "#D9B23C",
  line: "#333A45",
  muted: "#8B92A0",
};

const CATEGORIES = [
  { id: "shelter", label: "Shelter", icon: Tent },
  { id: "sleep", label: "Sleep System", icon: Moon },
  { id: "pack", label: "Pack", icon: Backpack },
  { id: "kitchen", label: "Cook System", icon: Flame },
  { id: "clothing", label: "Clothing", icon: Shirt },
  { id: "electronics", label: "Electronics & Nav", icon: Zap },
  { id: "consumables", label: "Consumables", icon: Droplet },
  { id: "misc", label: "Misc", icon: Package },
];

const ROUTE_TYPES = ["Out and Back", "Loop", "Point to Point"];

// Per-category subtypes, each with its own relevant stat fields.
const SUBTYPE_CONFIG = {
  sleep: {
    subtypes: ["Sleeping Bag", "Sleeping Pad", "Pillow", "Liner"],
    specs: {
      "Sleeping Bag": [
        { key: "minTempF", label: "Lower Limit (°F)", type: "number", placeholder: "20" },
        { key: "maxTempF", label: "Comfort Rating (°F)", type: "number", placeholder: "35" },
        { key: "fill", label: "Fill Type", type: "text", placeholder: "Down, Synthetic" },
      ],
      "Sleeping Pad": [
        { key: "rValue", label: "R-Value", type: "number", placeholder: "4.2" },
        { key: "minTempF", label: "Rated To (°F)", type: "number", placeholder: "15" },
      ],
      "Pillow": [],
      "Liner": [{ key: "maxTempF", label: "Adds (°F)", type: "number", placeholder: "10" }],
    },
  },
  shelter: {
    subtypes: ["Tent", "Tarp", "Bivy", "Hammock"],
    specs: {
      "Tent": [
        { key: "capacity", label: "Capacity (people)", type: "number", placeholder: "2" },
        { key: "season", label: "Season Rating", type: "text", placeholder: "3-Season" },
      ],
      "Tarp": [{ key: "floorAreaSqFt", label: "Floor Area (sq ft)", type: "number" }],
      "Bivy": [{ key: "minTempF", label: "Rated To (°F)", type: "number" }],
      "Hammock": [{ key: "capacity", label: "Capacity (people)", type: "number" }],
    },
  },
  pack: {
    subtypes: ["Backpack", "Daypack", "Stuff Sack"],
    specs: {
      "Backpack": [
        { key: "volumeL", label: "Volume (L)", type: "number", placeholder: "65" },
        { key: "frameType", label: "Frame Type", type: "text", placeholder: "Internal" },
      ],
      "Daypack": [{ key: "volumeL", label: "Volume (L)", type: "number", placeholder: "20" }],
      "Stuff Sack": [{ key: "volumeL", label: "Volume (L)", type: "number" }],
    },
  },
  kitchen: {
    subtypes: ["Stove", "Cookware", "Water Filter", "Utensil"],
    specs: {
      "Stove": [
        { key: "fuelType", label: "Fuel Type", type: "text", placeholder: "Isobutane" },
        { key: "boilTime", label: "Boil Time (min)", type: "number" },
      ],
      "Cookware": [{ key: "capacityL", label: "Capacity (L)", type: "number" }],
      "Water Filter": [{ key: "flowRate", label: "Flow Rate (L/min)", type: "number" }],
      "Utensil": [],
    },
  },
  clothing: {
    subtypes: ["Jacket", "Base Layer", "Pants", "Footwear", "Accessory"],
    specs: {
      "Jacket": [
        { key: "insulation", label: "Insulation", type: "text", placeholder: "Down, Fleece" },
        { key: "waterproof", label: "Waterproof Rating", type: "text", placeholder: "10,000mm" },
        { key: "minTempF", label: "Rated To (°F)", type: "number" },
      ],
      "Base Layer": [{ key: "weightClass", label: "Weight Class", type: "text", placeholder: "Midweight" }],
      "Pants": [{ key: "waterproof", label: "Waterproof Rating", type: "text" }],
      "Footwear": [{ key: "size", label: "Size", type: "text" }],
      "Accessory": [],
    },
  },
  electronics: {
    subtypes: ["Headlamp", "Battery Bank", "GPS/Communicator", "Camera"],
    specs: {
      "Headlamp": [
        { key: "lumens", label: "Lumens", type: "number" },
        { key: "batteryLifeHrs", label: "Battery Life (hrs)", type: "number" },
      ],
      "Battery Bank": [{ key: "batteryMah", label: "Capacity (mAh)", type: "number" }],
      "GPS/Communicator": [{ key: "batteryLifeHrs", label: "Battery Life (hrs)", type: "number" }],
      "Camera": [],
    },
  },
  consumables: {
    subtypes: ["Food", "Fuel", "Water Treatment", "First Aid"],
    specs: {
      "Food": [{ key: "calories", label: "Calories", type: "number" }],
      "Fuel": [{ key: "volumeOz", label: "Volume (fl oz)", type: "number" }],
      "Water Treatment": [],
      "First Aid": [],
    },
  },
  misc: {
    subtypes: ["Tool", "Navigation", "Repair Kit", "Other"],
    specs: { "Tool": [], "Navigation": [], "Repair Kit": [], "Other": [] },
  },
};
const subtypesFor = (category) => SUBTYPE_CONFIG[category]?.subtypes || [];
const specFieldsFor = (category, subtype) => SUBTYPE_CONFIG[category]?.specs?.[subtype] || [];

const SAFETY_ESSENTIALS = [
  { id: "nav", label: "Navigation", hint: "GPS/SOS/map/compass are important for safety", re: /map|compass|gps|inreach|garmin|sos/i },
  { id: "firstaid", label: "First Aid", hint: "A basic kit for cuts, blisters, and sprains", re: /first.?aid|med(ical)?\s?kit/i },
  { id: "light", label: "Headlamp / Light", hint: "Don't get caught without light after dark", re: /headlamp|lantern|flashlight/i },
  { id: "rain", label: "Rain Protection", hint: "Weather can turn fast in the backcountry", re: /rain|shell\b|poncho/i },
  { id: "fire", label: "Fire / Fuel", hint: "A way to start a fire or run your stove", re: /lighter|matches|fuel|stove/i },
  { id: "insulation", label: "Emergency Insulation", hint: "An extra layer if things go wrong", re: /puffy|insulat|emergency blanket|bivy/i },
  { id: "tool", label: "Knife / Tool", hint: "A multitool or knife covers a lot of problems", re: /knife|multitool|multi-tool/i },
  { id: "sun", label: "Sun Protection", hint: "Sunburn and glare are real hazards at altitude", re: /sunscreen|sunglasses|sun hat|sun hoodie/i },
];

const UNITS = ["oz", "lb", "g", "kg"];

const toGrams = (val, unit) => {
  const n = parseFloat(val) || 0;
  if (unit === "oz") return n * 28.3495;
  if (unit === "lb") return n * 453.592;
  if (unit === "kg") return n * 1000;
  return n;
};
const fromGrams = (g, unit) => {
  if (unit === "oz") return g / 28.3495;
  if (unit === "lb") return g / 453.592;
  if (unit === "kg") return g / 1000;
  return g;
};
const formatWeight = (g, unit) => {
  const v = fromGrams(g, unit);
  const decimals = unit === "g" ? 0 : unit === "kg" ? 2 : 1;
  return `${v.toFixed(decimals)} ${unit}`;
};
// lb + oz combined display, matching "7 lbs 0.5oz" style
const formatLbOz = (g) => {
  const totalOz = g / 28.3495;
  const lbs = Math.floor(totalOz / 16);
  const oz = (totalOz - lbs * 16).toFixed(1);
  if (lbs === 0) return `${oz} oz`;
  return `${lbs} lbs ${oz}oz`;
};
const flOzToGrams = (floz) => (parseFloat(floz) || 0) * 29.5735;

const uid = () => Math.random().toString(36).slice(2, 10);
const itemLabel = (item) => {
  const b = (item.brand || "").trim();
  const m = (item.model || "").trim();
  if (b && m) return `${b} ${m}`;
  return b || m || "Untitled item";
};

const resizeImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 360;
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => reject(new Error("image load failed"));
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

const LAST_PROFILE_KEY = "gear-list:last-profile";
const itemsKey = (p) => `gear-list:${p}:items`;
const tripsKey = (p) => `gear-list:${p}:trips`;
const essentialsKey = (p) => `gear-list:${p}:essentials`;

// Built-in reference database — bundled with the app, not live data.
// No network calls, no AI, no external services: just an array we filter in JS.
// Weights/prices are approximate reference figures and may not reflect current models or pricing.
const GEAR_DATABASE = [
  { brand: "Nemo", model: "Dagger Osmo 2P", category: "shelter", subtype: "Tent", weightOz: 53.3, price: 480, color: "Birch Bud", tag: "3-Season", specs: { capacity: "2", season: "3-Season" } },
  { brand: "Big Agnes", model: "Copper Spur HV UL2", category: "shelter", subtype: "Tent", weightOz: 46.4, price: 550, color: "Gray/Gold", tag: "3-Season", specs: { capacity: "2", season: "3-Season" } },
  { brand: "MSR", model: "Hubba Hubba 2", category: "shelter", subtype: "Tent", weightOz: 51, price: 480, color: "Green", tag: "3-Season", specs: { capacity: "2", season: "3-Season" } },
  { brand: "Zpacks", model: "Duplex", category: "shelter", subtype: "Tent", weightOz: 19.4, price: 699, color: "White", tag: "3-Season, non-freestanding", specs: { capacity: "2", season: "3-Season" } },
  { brand: "Western Mountaineering", model: "UltraLite 20°F", category: "sleep", subtype: "Sleeping Bag", weightOz: 29, price: 585, color: "Gold", tag: "20°F", specs: { minTempF: "20", maxTempF: "35", fill: "Down 850+" } },
  { brand: "Feathered Friends", model: "Hummingbird UL 30", category: "sleep", subtype: "Sleeping Bag", weightOz: 19, price: 469, color: "Yellow", tag: "30°F", specs: { minTempF: "30", maxTempF: "45", fill: "Down 950" } },
  { brand: "Enlightened Equipment", model: "Revelation 20°F", category: "sleep", subtype: "Sleeping Bag", weightOz: 20, price: 320, color: "Custom", tag: "20°F quilt", specs: { minTempF: "20", maxTempF: "35", fill: "Down 900" } },
  { brand: "Nemo", model: "Disco 15", category: "sleep", subtype: "Sleeping Bag", weightOz: 39, price: 380, color: "Marsh", tag: "15°F", specs: { minTempF: "15", maxTempF: "30", fill: "Down 650" } },
  { brand: "Therm-a-Rest", model: "NeoAir XLite NXT", category: "sleep", subtype: "Sleeping Pad", weightOz: 13, price: 220, color: "Stargazer", tag: "R 4.5", specs: { rValue: "4.5", minTempF: "10" } },
  { brand: "Nemo", model: "Tensor Extreme", category: "sleep", subtype: "Sleeping Pad", weightOz: 23.5, price: 280, color: "Black", tag: "R 8.5", specs: { rValue: "8.5", minTempF: "-20" } },
  { brand: "Sea to Summit", model: "Ether Light XT", category: "sleep", subtype: "Sleeping Pad", weightOz: 15, price: 200, color: "Green", tag: "R 3.2", specs: { rValue: "3.2", minTempF: "25" } },
  { brand: "Osprey", model: "Exos 58", category: "pack", subtype: "Backpack", weightOz: 42.5, price: 260, color: "Black", tag: "58L", specs: { volumeL: "58", frameType: "Internal" } },
  { brand: "Gregory", model: "Baltoro 65", category: "pack", subtype: "Backpack", weightOz: 88, price: 340, color: "Slate Blue", tag: "65L", specs: { volumeL: "65", frameType: "Internal" } },
  { brand: "Hyperlite Mountain Gear", model: "Southwest 55", category: "pack", subtype: "Backpack", weightOz: 31, price: 349, color: "White", tag: "55L", specs: { volumeL: "55", frameType: "Frameless" } },
  { brand: "Arc'teryx", model: "Altra 65", category: "pack", subtype: "Backpack", weightOz: 79, price: 550, color: "Basalt", tag: "65L", specs: { volumeL: "65", frameType: "Internal" } },
  { brand: "MSR", model: "PocketRocket 2", category: "kitchen", subtype: "Stove", weightOz: 2.6, price: 50, color: "Red", tag: "Isobutane", specs: { fuelType: "Isobutane", boilTime: "3.5" } },
  { brand: "Jetboil", model: "Flash", category: "kitchen", subtype: "Stove", weightOz: 13.1, price: 115, color: "Carbon", tag: "Isobutane", specs: { fuelType: "Isobutane", boilTime: "2" } },
  { brand: "Sawyer", model: "Squeeze", category: "kitchen", subtype: "Water Filter", weightOz: 3, price: 40, color: "Clear", tag: "0.1 micron", specs: { flowRate: "1.7" } },
  { brand: "Patagonia", model: "Down Sweater", category: "clothing", subtype: "Jacket", weightOz: 13, price: 279, color: "Black", tag: "800-fill", specs: { insulation: "Down", minTempF: "35" } },
  { brand: "Arc'teryx", model: "Beta Jacket", category: "clothing", subtype: "Jacket", weightOz: 12, price: 400, color: "Black", tag: "Waterproof", specs: { insulation: "None", waterproof: "GORE-TEX" } },
  { brand: "Black Diamond", model: "Spot 400", category: "electronics", subtype: "Headlamp", weightOz: 3.2, price: 40, color: "Black", tag: "400 lumens", specs: { lumens: "400", batteryLifeHrs: "50" } },
  { brand: "Petzl", model: "Actik Core", category: "electronics", subtype: "Headlamp", weightOz: 2.9, price: 70, color: "Black", tag: "600 lumens", specs: { lumens: "600", batteryLifeHrs: "60" } },
  { brand: "Garmin", model: "inReach Mini 2", category: "electronics", subtype: "GPS/Communicator", weightOz: 3.5, price: 400, color: "Orange", tag: "Satellite SOS", specs: { batteryLifeHrs: "14 days" } },
];

function searchLocalDatabase(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return GEAR_DATABASE
    .filter((g) => {
      const haystack = `${g.brand} ${g.model} ${g.subtype} ${g.category}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    })
    .slice(0, 6);
}

function ContourBackdrop() {
  return (
    <svg className="contour-bg" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
      {[20, 45, 70, 95, 120, 145, 170].map((y, i) => (
        <path key={i} d={`M0 ${y} Q 100 ${y - 18} 200 ${y} T 400 ${y}`} fill="none" stroke={COLORS.ember} strokeWidth="1" opacity={0.14 - i * 0.015} />
      ))}
    </svg>
  );
}

function SummitMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="21.5" stroke={COLORS.ember} strokeWidth="1.4" opacity="0.55" />
      <path d="M7 33 L18 15 L23 23 L27 17 L41 33 Z" fill="none" stroke={COLORS.ink} strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M24 6.5 L24 15" stroke={COLORS.ember} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M24 33 L24 41.5" stroke={COLORS.ember} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <circle cx="24" cy="24" r="3.1" fill={COLORS.ember} />
    </svg>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.line}`,
  fontSize: 15, boxSizing: "border-box", background: COLORS.cardRaised, color: COLORS.ink,
};
const labelStyle = { display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4, marginTop: 14 };

function computeTripTotals(trip, items) {
  const loadoutItems = items.filter((i) => trip.loadout.includes(i.id));
  const packedSet = new Set(trip.packedIds || []);
  const carried = loadoutItems.filter((i) => !i.worn);
  const worn = loadoutItems.filter((i) => i.worn);
  const baseG = carried.reduce((s, i) => s + i.grams, 0);
  const wornG = worn.reduce((s, i) => s + i.grams, 0);
  const waterG = flOzToGrams(trip.waterFlOz);
  const extrasG = trip.extras.reduce((s, e) => s + e.grams, 0);
  const packTotalG = baseG + waterG + extrasG;
  const totalG = packTotalG + wornG;
  return {
    baseG, wornG, waterG, extrasG, packTotalG, totalG,
    packedCount: loadoutItems.filter((i) => packedSet.has(i.id)).length,
    loadoutCount: loadoutItems.length,
  };
}

function tripCategoryLabel(days) {
  const d = parseInt(days, 10);
  if (!d || d <= 1) return "Day Hike";
  return `${d}-Day Trip`;
}

function computeGearFitWarnings(trip, items) {
  const low = parseFloat(trip.weatherLowF);
  if (isNaN(low)) return [];
  const loadoutItems = items.filter((i) => trip.loadout.includes(i.id));
  const warnings = [];

  const bags = loadoutItems.filter((i) => i.category === "sleep" && i.subtype === "Sleeping Bag");
  bags.forEach((b) => {
    const limit = parseFloat(b.specs?.minTempF);
    if (!isNaN(limit) && limit > low) {
      const alt = items
        .filter((i) => i.category === "sleep" && i.subtype === "Sleeping Bag" && !trip.loadout.includes(i.id) && parseFloat(i.specs?.minTempF) <= low)
        .sort((a, c) => parseFloat(a.specs?.minTempF) - parseFloat(c.specs?.minTempF))[0];
      warnings.push({
        id: `bag-${b.id}`,
        label: `${itemLabel(b)} is rated to ${limit}°F — below the forecast low of ${low}°F`,
        hint: alt ? `You have ${itemLabel(alt)} in your closet, rated to ${alt.specs.minTempF}°F — better suited for this trip.` : "Consider a warmer bag or adding a liner.",
      });
    }
  });

  const pads = loadoutItems.filter((i) => i.category === "sleep" && i.subtype === "Sleeping Pad");
  pads.forEach((p) => {
    const r = parseFloat(p.specs?.rValue);
    if (low < 32 && !isNaN(r) && r < 4) {
      const alt = items
        .filter((i) => i.category === "sleep" && i.subtype === "Sleeping Pad" && !trip.loadout.includes(i.id) && parseFloat(i.specs?.rValue) >= 4)
        .sort((a, c) => parseFloat(c.specs?.rValue) - parseFloat(a.specs?.rValue))[0];
      warnings.push({
        id: `pad-${p.id}`,
        label: `${itemLabel(p)} has an R-value of ${r} — may feel cold below freezing`,
        hint: alt ? `You have ${itemLabel(alt)} (R-${alt.specs.rValue}) in your closet — warmer option.` : "An R-value of 4+ is recommended for freezing temps.",
      });
    }
  });

  const jackets = loadoutItems.filter((i) => i.category === "clothing" && i.subtype === "Jacket");
  if (low < 40 && jackets.length === 0 && items.some((i) => i.category === "clothing" && i.subtype === "Jacket")) {
    const alt = items.find((i) => i.category === "clothing" && i.subtype === "Jacket" && !trip.loadout.includes(i.id));
    if (alt) warnings.push({ id: "jacket-missing", label: `Forecast low of ${low}°F but no insulated jacket in your loadout`, hint: `You have ${itemLabel(alt)} in your closet — consider adding it.` });
  }

  return warnings;
}

const emptyDraft = () => ({
  brand: "", model: "", category: "shelter", subtype: subtypesFor("shelter")[0] || "", weightVal: "", weightUnit: "oz",
  color: "", tag: "", year: "", price: "", photo: null, worn: false, essential: false, source: "manual", specs: {},
});

export default function GearList() {
  const [items, setItems] = useState([]);
  const [trips, setTrips] = useState([]);
  const [essentials, setEssentials] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [unit, setUnit] = useState("oz");
  const [view, setView] = useState("closet");
  const [activeTripId, setActiveTripId] = useState(null);
  const [openCats, setOpenCats] = useState(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, true])));

  const [profile, setProfile] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [profileInput, setProfileInput] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addToTripId, setAddToTripId] = useState(null);
  const fileRef = useRef(null);
  const [draft, setDraft] = useState(emptyDraft());

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTripId, setEditingTripId] = useState(null);
  const [tripDraft, setTripDraft] = useState({
    name: "", location: "", distanceMi: "", elevationGainFt: "", days: "", date: "", routeType: "Out and Back", waterFlOz: "", weatherLowF: "", weatherHighF: "",
  });

  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraDraft, setExtraDraft] = useState({ name: "", weightVal: "", weightUnit: "oz" });

  const [newEssential, setNewEssential] = useState("");

  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const saveTimerRef = useRef(null);
  const itemsRef = useRef(items);
  const tripsRef = useRef(trips);
  const essentialsRef = useRef(essentials);
  const profileRef = useRef(profile);
  itemsRef.current = items; tripsRef.current = trips; essentialsRef.current = essentials; profileRef.current = profile;

  // Check for a remembered profile name — stored privately per Claude account,
  // just so this device doesn't have to retype it every time.
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(LAST_PROFILE_KEY, false);
        if (r?.value) setProfile(r.value);
      } catch (e) {}
      setProfileChecked(true);
    })();
  }, []);

  // Once a profile is set, load that profile's shared closet/trips/essentials.
  useEffect(() => {
    if (!profile) return;
    (async () => {
      try { const r = await window.storage.get(itemsKey(profile), true); if (r?.value) setItems(JSON.parse(r.value)); } catch (e) {}
      try { const r = await window.storage.get(tripsKey(profile), true); if (r?.value) setTrips(JSON.parse(r.value)); } catch (e) {}
      try { const r = await window.storage.get(essentialsKey(profile), true); if (r?.value) setEssentials(JSON.parse(r.value)); } catch (e) {}
      setLoaded(true);
    })();
  }, [profile]);

  const confirmProfile = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setProfile(trimmed);
    try { await window.storage.set(LAST_PROFILE_KEY, trimmed, false); } catch (e) {}
  };

  const switchProfile = () => {
    setProfile(null); setLoaded(false);
    setItems([]); setTrips([]); setEssentials([]);
    setProfileInput(""); setView("closet"); setActiveTripId(null);
  };

  const persistAll = async () => {
    if (!profileRef.current) return;
    setSaveStatus("saving");
    try {
      const results = await Promise.all([
        window.storage.set(itemsKey(profileRef.current), JSON.stringify(itemsRef.current), true),
        window.storage.set(tripsKey(profileRef.current), JSON.stringify(tripsRef.current), true),
        window.storage.set(essentialsKey(profileRef.current), JSON.stringify(essentialsRef.current), true),
      ]);
      if (results.some((r) => !r)) throw new Error("one or more writes returned no result");
      setSaveStatus("saved");
      setLastSavedAt(Date.now());
    } catch (e) {
      setSaveStatus("error");
    }
  };

  // Debounced autosave: waits for a short pause in edits, then writes everything in one batch.
  useEffect(() => {
    if (!loaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { persistAll(); }, 700);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [items, trips, essentials, loaded]);

  // Also catch the case where the person closes/backgrounds the tab before the debounce fires.
  useEffect(() => {
    const handler = () => { if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); persistAll(); } };
    window.addEventListener("visibilitychange", handler);
    window.addEventListener("pagehide", handler);
    return () => {
      window.removeEventListener("visibilitychange", handler);
      window.removeEventListener("pagehide", handler);
    };
  }, []);

  const forceSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    persistAll();
  };

  const totalG = items.reduce((s, i) => s + i.grams, 0);
  const cycleUnit = () => setUnit(UNITS[(UNITS.indexOf(unit) + 1) % UNITS.length]);
  const toggleCat = (id) => setOpenCats((p) => ({ ...p, [id]: !p[id] }));

  // ---- Item form ----
  const openAdd = (tripId = null) => {
    setDraft(emptyDraft());
    setDraft((d) => ({ ...d, weightUnit: unit }));
    setSearchQuery(""); setSearchResults(null);
    setEditingId(null); setAddToTripId(tripId);
    setShowForm(true);
  };
  const openEdit = (item) => {
    setDraft({
      brand: item.brand || "", model: item.model || "", category: item.category, subtype: item.subtype || "",
      weightVal: String(fromGrams(item.grams, item.weightUnit || unit).toFixed(2)).replace(/\.00$/, ""),
      weightUnit: item.weightUnit || unit, color: item.color || "", tag: item.tag || "", year: item.year || "",
      price: item.price ?? "", photo: item.photo, worn: !!item.worn, essential: !!item.essential, source: item.source || "manual",
      specs: item.specs || {},
    });
    setSearchQuery(""); setSearchResults(null);
    setEditingId(item.id); setAddToTripId(null);
    setShowForm(true);
  };

const runSearch = async () => {

  if (!searchQuery.trim()) return;

  const localResults = searchLocalDatabase(searchQuery);

  try {
    const items = await googleSearch(searchQuery + " backpacking gear");

    const googleResults = items.map((item) => ({
      id: item.cacheId || item.link,
      brand: item.displayLink,
      model: item.title,
      description: item.snippet,
      source: item.link,
      category: "",
      subtype: "",
      weightOz: "",
      color: "",
      tag: "",
      year: "",
      price: "",
      specs: {},
      isGoogle: true,
    }));

    setSearchResults([
      ...localResults,
      ...googleResults,
    ]);
  } catch (err) {
    console.error(err);
    setSearchResults(localResults);
  }
};
const pickSearchResult = (r) => {
  setDraft((d) => {
    const category =
      r.category && CATEGORIES.some(c => c.id === r.category)
        ? r.category
        : d.category;

    const opts = subtypesFor(category);

    return {
      ...d,
      brand: r.brand || "",
      model: r.model || "",
      category,
      subtype: r.subtype || opts[0] || "",
      color: r.color || "",
      tag: r.tag || "",
      year: r.year || "",
      price: r.price || "",
      weightVal: r.weightOz || "",
      weightUnit: "oz",
      specs: r.specs || {},
      source: r.isGoogle ? "google" : "database",
    };
  });

  setSearchResults(null);
  setSearchQuery("");
};

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      setDraft((d) => ({ ...d, photo: dataUrl }));
    } catch (err) {}
  };

  const saveDraft = () => {
    if (!draft.brand.trim() && !draft.model.trim()) return;
    const grams = toGrams(draft.weightVal, draft.weightUnit);
    if (editingId) {
      setItems((prev) => prev.map((i) => (i.id === editingId ? {
        ...i, brand: draft.brand.trim(), model: draft.model.trim(), category: draft.category, subtype: draft.subtype.trim(),
        grams, weightUnit: draft.weightUnit, color: draft.color.trim(), tag: draft.tag.trim(), year: draft.year, price: draft.price,
        photo: draft.photo, worn: draft.worn, essential: draft.essential, source: draft.source, specs: draft.specs,
      } : i)));
    } else {
      const newId = uid();
      setItems((prev) => [...prev, {
        id: newId, brand: draft.brand.trim(), model: draft.model.trim(), category: draft.category, subtype: draft.subtype.trim(),
        grams, weightUnit: draft.weightUnit, color: draft.color.trim(), tag: draft.tag.trim(), year: draft.year, price: draft.price,
        photo: draft.photo, worn: draft.worn, essential: draft.essential, source: draft.source, specs: draft.specs,
      }]);
      if (addToTripId) {
        setTrips((prev) => prev.map((t) => t.id === addToTripId ? { ...t, loadout: [...t.loadout, newId] } : t));
      }
    }
    setShowForm(false); setEditingId(null); setAddToTripId(null);
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTrips((prev) => prev.map((t) => ({ ...t, loadout: t.loadout.filter((lid) => lid !== id), packedIds: (t.packedIds || []).filter((lid) => lid !== id) })));
  };

  // ---- Trip helpers ----
  const resetTripDraft = () => setTripDraft({ name: "", location: "", distanceMi: "", elevationGainFt: "", days: "", date: "", routeType: "Out and Back", waterFlOz: "", weatherLowF: "", weatherHighF: "" });
  const openNewTrip = () => { resetTripDraft(); setEditingTripId(null); setShowTripForm(true); };
  const openEditTrip = (trip) => {
    setTripDraft({ name: trip.name, location: trip.location, distanceMi: trip.distanceMi, elevationGainFt: trip.elevationGainFt, days: trip.days, date: trip.date, routeType: trip.routeType, waterFlOz: trip.waterFlOz, weatherLowF: trip.weatherLowF, weatherHighF: trip.weatherHighF });
    setEditingTripId(trip.id); setShowTripForm(true);
  };
  const saveTripDraft = () => {
    if (!tripDraft.name.trim()) return;
    if (editingTripId) {
      setTrips((prev) => prev.map((t) => (t.id === editingTripId ? { ...t, ...tripDraft, name: tripDraft.name.trim() } : t)));
    } else {
      setTrips((prev) => [...prev, { id: uid(), ...tripDraft, name: tripDraft.name.trim(), extras: [], loadout: [], packedIds: [], backpackId: null, dismissedWarnings: [] }]);
    }
    setShowTripForm(false); setEditingTripId(null);
  };
  const deleteTrip = (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (activeTripId === id) { setView("trips"); setActiveTripId(null); }
  };
  const openTrip = (id) => { setActiveTripId(id); setView("trip"); };
  const backToTrips = () => { setView("trips"); setActiveTripId(null); };

  const toggleLoadoutItem = (tripId, itemId) => {
    setTrips((prev) => prev.map((t) => {
      if (t.id !== tripId) return t;
      const inLoadout = t.loadout.includes(itemId);
      return {
        ...t,
        loadout: inLoadout ? t.loadout.filter((id) => id !== itemId) : [...t.loadout, itemId],
        backpackId: inLoadout && t.backpackId === itemId ? null : t.backpackId,
      };
    }));
  };
  const toggleWorn = (itemId) => setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, worn: !i.worn } : i)));
  const setBackpack = (tripId, itemId) => setTrips((prev) => prev.map((t) => t.id === tripId ? { ...t, backpackId: itemId } : t));
  const updateTripWater = (tripId, floz) => setTrips((prev) => prev.map((t) => t.id === tripId ? { ...t, waterFlOz: floz } : t));
  const dismissWarning = (tripId, warnId) => setTrips((prev) => prev.map((t) => t.id === tripId ? { ...t, dismissedWarnings: [...(t.dismissedWarnings || []), warnId] } : t));

  const openAddExtra = () => { setExtraDraft({ name: "", weightVal: "", weightUnit: unit }); setShowExtraForm(true); };
  const saveExtra = () => {
    if (!extraDraft.name.trim() || !activeTripId) return;
    const grams = toGrams(extraDraft.weightVal, extraDraft.weightUnit);
    setTrips((prev) => prev.map((t) => t.id === activeTripId ? { ...t, extras: [...t.extras, { id: uid(), name: extraDraft.name.trim(), grams }] } : t));
    setShowExtraForm(false);
  };
  const deleteExtra = (tripId, extraId) => setTrips((prev) => prev.map((t) => t.id === tripId ? { ...t, extras: t.extras.filter((e) => e.id !== extraId) } : t));

  const addEssential = () => {
    if (!newEssential.trim()) return;
    setEssentials((prev) => [...prev, { id: uid(), label: newEssential.trim() }]);
    setNewEssential("");
  };
  const deleteEssential = (id) => setEssentials((prev) => prev.filter((e) => e.id !== id));

  const activeTrip = trips.find((t) => t.id === activeTripId) || null;

  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 6, color });

  const sharedStyleTag = (
    <style>{`
      ${FONT_IMPORT}
      .contour-bg { position:absolute; top:0; left:0; width:100%; height:100%; }
      .display { font-family: 'Fjalla One', sans-serif; letter-spacing: 0.03em; }
      input[type="text"], input[type="number"], input[type="date"], select { font-family: 'Source Sans 3', sans-serif; }
      input:focus, select:focus, button:focus-visible { outline: 2px solid ${COLORS.moss}; outline-offset: 2px; }
    `}</style>
  );

  if (!profileChecked) {
    return <div style={{ background: COLORS.paper, minHeight: "100vh" }} />;
  }

  if (!profile) {
    return (
      <div style={{ fontFamily: "'Source Sans 3', sans-serif", background: COLORS.paper, minHeight: "100vh", color: COLORS.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        {sharedStyleTag}
        <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><SummitMark size={44} /></div>
          <h1 className="display" style={{ fontSize: 26, margin: "0 0 6px", letterSpacing: "0.06em" }}>TRAILHEAD</h1>
          <p style={{ fontSize: 13.5, color: COLORS.muted, marginBottom: 22 }}>Enter a name or shared passphrase to load your gear closet — use the same one every time to get back to the same list.</p>
          <input
            type="text"
            value={profileInput}
            onChange={(e) => setProfileInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmProfile(profileInput)}
            placeholder="e.g. jordan-backpacking"
            style={{ ...inputStyle, textAlign: "center", fontSize: 16, marginBottom: 12 }}
            autoFocus
          />
          <button
            onClick={() => confirmProfile(profileInput)}
            disabled={!profileInput.trim()}
            style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: profileInput.trim() ? COLORS.moss : COLORS.line, color: "#fff", fontSize: 15.5, fontWeight: 700, cursor: profileInput.trim() ? "pointer" : "not-allowed", fontFamily: "'Fjalla One', sans-serif", letterSpacing: "0.03em" }}
          >
            CONTINUE
          </button>
          <p style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 18, lineHeight: 1.5 }}>
            This isn't a secure login — anyone who knows this name can view and edit this closet. Don't use anything sensitive, and pick something specific enough that strangers won't guess it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", background: COLORS.paper, minHeight: "100vh", color: COLORS.ink }}>
      <style>{`
        ${FONT_IMPORT}
        .contour-bg { position:absolute; top:0; left:0; width:100%; height:100%; }
        .display { font-family: 'Fjalla One', sans-serif; letter-spacing: 0.03em; }
        .cat-row:hover { background: rgba(226,149,61,0.08); }
        .trip-card:hover, .result-card:hover { border-color: ${COLORS.ember}; }
        input[type="text"], input[type="number"], input[type="date"], select { font-family: 'Source Sans 3', sans-serif; }
        input:focus, select:focus, button:focus-visible { outline: 2px solid ${COLORS.moss}; outline-offset: 2px; }
        ::-webkit-scrollbar { width: 8px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* Header */}
      <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #191D24 0%, #12151A 100%)", borderBottom: `1px solid ${COLORS.line}`, padding: "26px 20px 0" }}>
        <ContourBackdrop />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SummitMark size={30} />
            <h1 className="display" style={{ fontSize: 26, margin: 0, letterSpacing: "0.06em", flex: 1 }}>TRAILHEAD</h1>
            <button
              onClick={forceSave}
              title="Save now"
              style={{
                display: "flex", alignItems: "center", gap: 5, background: "none", cursor: "pointer",
                border: `1px solid ${saveStatus === "error" ? COLORS.ember : COLORS.line}`, borderRadius: 20,
                padding: "5px 10px", fontSize: 11, color: saveStatus === "error" ? COLORS.ember : COLORS.muted,
              }}
            >
              {saveStatus === "saving" ? <Cloud size={13} /> : saveStatus === "error" ? <CloudOff size={13} /> : <Save size={13} />}
              {saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Retry save" : saveStatus === "saved" ? "Saved" : "Save now"}
            </button>
          </div>
          <button onClick={switchProfile} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted, fontSize: 11, padding: 0, marginTop: 4, textDecoration: "underline" }}>
            {profile} · switch profile
          </button>

          {view === "closet" && (
            <div style={{ marginTop: 18 }}>
              <div className="display" style={{ fontSize: 40, lineHeight: 1, color: COLORS.ember }} onClick={cycleUnit}>{formatWeight(totalG, unit)}</div>
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>total closet weight · {items.length} items · tap total to change unit</div>
            </div>
          )}

          {view === "trips" && (
            <div style={{ marginTop: 18 }}>
              <div className="display" style={{ fontSize: 32, lineHeight: 1, color: COLORS.ember }}>{trips.length}</div>
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>{trips.length === 1 ? "trip planned" : "trips planned"}</div>
            </div>
          )}

          {view === "trip" && activeTrip && (() => {
            const t = computeTripTotals(activeTrip, items);
            const pct = t.loadoutCount ? Math.round((t.packedCount / t.loadoutCount) * 100) : 0;
            return (
              <div style={{ marginTop: 14, paddingBottom: 16 }}>
                <button onClick={backToTrips} style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0, marginBottom: 10, fontSize: 13 }}>
                  <ArrowLeft size={15} /> All trips
                </button>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div className="display" style={{ fontSize: 22 }}>{activeTrip.name}</div>
                    {activeTrip.location && <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, opacity: 0.75, marginTop: 3 }}><MapPin size={12} />{activeTrip.location}</div>}
                    {activeTrip.date && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{activeTrip.date}</div>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, fontSize: 12.5, opacity: 0.75 }}>
                      {activeTrip.distanceMi && <span>{activeTrip.distanceMi} mi</span>}
                      {activeTrip.elevationGainFt && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><TrendingUp size={12} />{activeTrip.elevationGainFt} ft gain</span>}
                      {activeTrip.routeType && <span>{activeTrip.routeType}</span>}
                      {(activeTrip.weatherLowF || activeTrip.weatherHighF) && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Thermometer size={12} />
                          {activeTrip.weatherLowF || "?"}°–{activeTrip.weatherHighF || "?"}°F
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span className="display" style={{ fontSize: 11, color: COLORS.ember, border: `1px solid ${COLORS.ember}`, borderRadius: 6, padding: "3px 8px" }}>{tripCategoryLabel(activeTrip.days)}</span>
                    <div><button onClick={() => openEditTrip(activeTrip)} style={{ background: "none", border: `1px solid ${COLORS.line}`, borderRadius: 8, color: COLORS.muted, cursor: "pointer", padding: 6, marginTop: 8 }}><Pencil size={14} /></button></div>
                  </div>
                </div>

                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "14px 16px", marginTop: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 6, fontSize: 13.5 }}>
                    <span style={{ color: COLORS.muted }}>Base</span><span style={{ textAlign: "right" }}>{formatLbOz(t.baseG)}</span>
                    <span style={{ color: COLORS.sky }}>Water</span><span style={{ textAlign: "right", color: COLORS.sky }}>{(parseFloat(activeTrip.waterFlOz) || 0).toFixed(1)} fl oz</span>
                    <span style={{ color: COLORS.muted }}>Food</span><span style={{ textAlign: "right" }}>{formatLbOz(t.extrasG)}</span>
                    <span style={{ color: COLORS.ember, fontWeight: 700 }}>Pack Total</span><span style={{ textAlign: "right", color: COLORS.ember, fontWeight: 700 }}>{formatLbOz(t.packTotalG)}</span>
                    <span style={{ color: COLORS.star }}>Worn</span><span style={{ textAlign: "right", color: COLORS.star }}>{formatLbOz(t.wornG)}</span>
                    <span style={{ fontWeight: 700 }}>Total</span><span style={{ textAlign: "right", fontWeight: 700 }}>{formatLbOz(t.totalG)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: COLORS.moss }}>
                    <span>{t.packedCount}/{t.loadoutCount} packed</span>
                    <span style={{ color: COLORS.muted }}>{pct}%</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 6, height: 7, overflow: "hidden", marginTop: 4 }}>
                    <div style={{ width: `${pct}%`, background: COLORS.moss, height: "100%", transition: "width 0.3s ease" }} />
                  </div>
                </div>
              </div>
            );
          })()}

          {view !== "trip" && (
            <div style={{ display: "flex", gap: 22, marginTop: 20 }}>
              {[["closet", "GEAR CLOSET"], ["trips", "TRIPS"]].map(([id, label]) => (
                <button key={id} onClick={() => setView(id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: "'Fjalla One', sans-serif", fontSize: 14, letterSpacing: "0.04em", color: view === id ? COLORS.ember : COLORS.muted, borderBottom: `2px solid ${view === id ? COLORS.ember : "transparent"}` }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 16px 100px" }}>

        {/* ---------- CLOSET VIEW ---------- */}
        {view === "closet" && (
          <>
            {items.length === 0 && loaded && (
              <div style={{ textAlign: "center", padding: "48px 16px", color: COLORS.muted }}>
                <Backpack size={36} strokeWidth={1.5} style={{ marginBottom: 10, color: COLORS.ember }} />
                <div className="display" style={{ fontSize: 18, color: COLORS.ink, marginBottom: 6 }}>Nothing packed yet</div>
                <div style={{ fontSize: 14 }}>Search for your gear or add it manually to start your closet.</div>
              </div>
            )}

            {CATEGORIES.map((cat) => {
              const catItems = items.filter((i) => i.category === cat.id);
              if (catItems.length === 0) return null;
              const catG = catItems.reduce((s, i) => s + i.grams, 0);
              const Icon = cat.icon;
              const open = openCats[cat.id];
              return (
                <div key={cat.id} style={{ marginBottom: 14, background: COLORS.card, borderRadius: 10, border: `1px solid ${COLORS.line}`, overflow: "hidden" }}>
                  <button className="cat-row" onClick={() => toggleCat(cat.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <Icon size={18} color={COLORS.ember} />
                    <span className="display" style={{ fontSize: 15, flex: 1, letterSpacing: "0.03em" }}>{cat.label.toUpperCase()}</span>
                    <span style={{ fontSize: 13, color: COLORS.muted }}>{formatWeight(catG, unit)}</span>
                    <ChevronDown size={16} color={COLORS.muted} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                  </button>
                  {open && catItems.map((item) => (
                    <GearCard key={item.id} item={item} unit={unit} onEdit={() => openEdit(item)} onDelete={() => deleteItem(item.id)} />
                  ))}
                </div>
              );
            })}
            {saveStatus === "error" && <div style={{ fontSize: 12, color: COLORS.ember, textAlign: "center", marginTop: 6 }}>Couldn't save changes — tap "Save now" up top to retry.</div>}

            {/* Personal essentials manager */}
            <div style={{ marginTop: 22, background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Star size={16} color={COLORS.star} />
                <span className="display" style={{ fontSize: 14, letterSpacing: "0.03em" }}>PERSONAL ESSENTIALS</span>
              </div>
              <div style={{ fontSize: 12.5, color: COLORS.muted, marginBottom: 10 }}>Reminders you always want flagged before a trip — permits, contacts, meds.</div>
              {essentials.map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: `1px solid ${COLORS.line}` }}>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{e.label}</span>
                  <button onClick={() => deleteEssential(e.id)} style={iconBtn("#C6633A")}><Trash2 size={13} /></button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input type="text" value={newEssential} onChange={(e) => setNewEssential(e.target.value)} placeholder="e.g. Backup contacts card" style={{ ...inputStyle, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && addEssential()} />
                <button onClick={addEssential} style={{ padding: "0 14px", borderRadius: 8, border: "none", background: COLORS.moss, color: "#fff", cursor: "pointer" }}><Plus size={16} /></button>
              </div>
            </div>
          </>
        )}

        {/* ---------- TRIPS LIST ---------- */}
        {view === "trips" && (
          <>
            {trips.length === 0 && loaded && (
              <div style={{ textAlign: "center", padding: "48px 16px", color: COLORS.muted }}>
                <Route size={36} strokeWidth={1.5} style={{ marginBottom: 10, color: COLORS.ember }} />
                <div className="display" style={{ fontSize: 18, color: COLORS.ink, marginBottom: 6 }}>No trips yet</div>
                <div style={{ fontSize: 14 }}>Plan a hike — pick a trail, set your water, build a loadout.</div>
              </div>
            )}
            {trips.map((trip) => {
              const t = computeTripTotals(trip, items);
              return (
                <div key={trip.id} className="trip-card" onClick={() => openTrip(trip.id)} style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "14px 16px", marginBottom: 12, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="display" style={{ fontSize: 16.5, marginBottom: 3 }}>{trip.name}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12.5, color: COLORS.muted }}>
                        {trip.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{trip.location}</span>}
                        {trip.distanceMi && <span>{trip.distanceMi} mi</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="display" style={{ fontSize: 18, color: COLORS.ember }}>{formatLbOz(t.totalG)}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{t.loadoutCount} items · {(parseFloat(trip.waterFlOz) || 0).toFixed(0)} fl oz</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ---------- TRIP DETAIL ---------- */}
        {view === "trip" && activeTrip && (() => {
          const loadoutItems = items.filter((i) => activeTrip.loadout.includes(i.id));
          const dismissed = new Set(activeTrip.dismissedWarnings || []);
          const backpackItem = items.find((i) => i.id === activeTrip.backpackId);
          const packOptions = items.filter((i) => i.category === "pack" && activeTrip.loadout.includes(i.id));
          const safetyMissing = SAFETY_ESSENTIALS.filter((s) => !dismissed.has(s.id) && !loadoutItems.some((i) => s.re.test(`${i.brand} ${i.model} ${i.subtype} ${i.category}`)));
          const personalMissing = essentials.filter((e) => !dismissed.has(e.id));
          const fitWarnings = computeGearFitWarnings(activeTrip, items).filter((w) => !dismissed.has(w.id));
          return (
            <>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <Backpack size={16} color={COLORS.ember} />
                <span style={{ fontSize: 13, color: COLORS.muted }}>Backpack:</span>
                <select value={activeTrip.backpackId || ""} onChange={(e) => setBackpack(activeTrip.id, e.target.value || null)} style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 13.5 }}>
                  <option value="">Choose from loadout…</option>
                  {packOptions.map((p) => <option key={p.id} value={p.id}>{itemLabel(p)}</option>)}
                </select>
              </div>

              {/* Water */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Droplet size={17} color={COLORS.sky} />
                  <span className="display" style={{ fontSize: 14, letterSpacing: "0.03em" }}>WATER</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input type="number" inputMode="decimal" value={activeTrip.waterFlOz} onChange={(e) => updateTripWater(activeTrip.id, e.target.value)} placeholder="0" style={{ ...inputStyle, width: 90 }} />
                  <span style={{ fontSize: 14, color: COLORS.muted }}>fl oz</span>
                  <span style={{ marginLeft: "auto", fontSize: 14, color: COLORS.ink, fontWeight: 600 }}>= {formatWeight(flOzToGrams(activeTrip.waterFlOz), unit)}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {[16, 32, 64].map((amt) => (
                    <button key={amt} onClick={() => updateTripWater(activeTrip.id, String((parseFloat(activeTrip.waterFlOz) || 0) + amt))} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${COLORS.line}`, background: "none", color: COLORS.muted, fontSize: 12.5, cursor: "pointer" }}>+{amt}oz</button>
                  ))}
                  <button onClick={() => updateTripWater(activeTrip.id, "0")} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "none", color: COLORS.muted, fontSize: 12.5, cursor: "pointer" }}>reset</button>
                </div>
              </div>

              {/* Food */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: activeTrip.extras.length ? 8 : 2 }}>
                  <Package size={16} color={COLORS.ember} />
                  <span className="display" style={{ fontSize: 14, flex: 1, letterSpacing: "0.03em" }}>FOOD & CONSUMABLES</span>
                  <button onClick={openAddExtra} style={{ background: "none", border: "none", color: COLORS.moss, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><Plus size={14} /> Add</button>
                </div>
                {activeTrip.extras.map((ex) => (
                  <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${COLORS.line}` }}>
                    <div style={{ flex: 1, fontSize: 14 }}>{ex.name}</div>
                    <div style={{ fontSize: 13, color: COLORS.muted }}>{formatWeight(ex.grams, unit)}</div>
                    <button onClick={() => deleteExtra(activeTrip.id, ex.id)} style={iconBtn("#C6633A")}><Trash2 size={14} /></button>
                  </div>
                ))}
                {activeTrip.extras.length === 0 && <div style={{ fontSize: 13, color: COLORS.muted }}>Food, fuel, first aid — anything you buy or use up per trip.</div>}
              </div>

              {/* Gear loadout — full closet, grouped by category, select/unselect what you're packing */}
              <div style={{ display: "flex", alignItems: "center", margin: "6px 2px 10px" }}>
                <span className="display" style={{ fontSize: 14, letterSpacing: "0.03em", color: COLORS.muted, flex: 1 }}>GEAR FOR THIS TRIP</span>
                <span style={{ fontSize: 12, color: COLORS.muted }}>{loadoutItems.length}/{items.length} selected</span>
              </div>

              {items.length === 0 && (
                <div style={{ fontSize: 13.5, color: COLORS.muted, padding: "8px 2px 16px" }}>Your closet is empty. Add something new below to get started.</div>
              )}

              {CATEGORIES.map((cat) => {
                const catItems = items.filter((i) => i.category === cat.id);
                if (catItems.length === 0) return null;
                const Icon = cat.icon;
                return (
                  <div key={cat.id} style={{ marginBottom: 12, background: COLORS.card, borderRadius: 10, border: `1px solid ${COLORS.line}`, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: `1px solid ${COLORS.line}` }}>
                      <Icon size={15} color={COLORS.ember} />
                      <span className="display" style={{ fontSize: 12.5 }}>{cat.label.toUpperCase()}</span>
                    </div>
                    {catItems.map((item) => {
                      const selected = activeTrip.loadout.includes(item.id);
                      return (
                        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: `1px solid ${COLORS.line}`, opacity: selected ? 1 : 0.5 }}>
                          <button
                            onClick={() => toggleLoadoutItem(activeTrip.id, item.id)}
                            aria-label={selected ? "Unpack" : "Pack"}
                            style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: `2px solid ${selected ? COLORS.moss : COLORS.muted}`, background: selected ? COLORS.moss : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            {selected && <Check size={13} color="#fff" strokeWidth={3} />}
                          </button>
                          <div style={{ flex: 1, minWidth: 0, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{itemLabel(item)}</div>
                          <div style={{ fontSize: 12.5, color: COLORS.muted }}>{formatWeight(item.grams, unit)}</div>
                          {cat.id === "clothing" && (
                            <button
                              onClick={() => toggleWorn(item.id)}
                              style={{ fontSize: 10.5, color: item.worn ? COLORS.star : COLORS.muted, border: `1px solid ${item.worn ? COLORS.star : COLORS.line}`, borderRadius: 5, padding: "2px 6px", background: "none", cursor: "pointer", flexShrink: 0 }}
                              title="Toggle worn vs. packed"
                            >
                              {item.worn ? "WORN" : "PACKED"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              <button onClick={() => openAdd(activeTrip.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px dashed ${COLORS.line}`, borderRadius: 10, color: COLORS.muted, cursor: "pointer", fontSize: 13, padding: "10px 14px", width: "100%", justifyContent: "center", marginTop: 4, marginBottom: 20 }}>
                <Plus size={15} /> Add a brand-new item to this trip
              </button>

              {/* Essentials */}
              {(safetyMissing.length > 0 || personalMissing.length > 0 || fitWarnings.length > 0) && (
                <div style={{ marginBottom: 20 }}>
                  {fitWarnings.length > 0 && (
                    <>
                      <div className="display" style={{ fontSize: 13, color: COLORS.sky, marginBottom: 8 }}>GEAR FIT FOR FORECAST</div>
                      {fitWarnings.map((w) => (
                        <div key={w.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                          <Thermometer size={16} color={COLORS.sky} style={{ flexShrink: 0, marginTop: 1 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, color: COLORS.sky, fontWeight: 600 }}>{w.label}</div>
                            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{w.hint}</div>
                          </div>
                          <button onClick={() => dismissWarning(activeTrip.id, w.id)} style={iconBtn(COLORS.muted)}><X size={15} /></button>
                        </div>
                      ))}
                    </>
                  )}
                  {safetyMissing.length > 0 && (
                    <>
                      <div className="display" style={{ fontSize: 13, color: COLORS.warn, marginBottom: 8 }}>FINAL CHECK: ESSENTIAL GEAR</div>
                      {safetyMissing.map((s) => (
                        <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                          <AlertTriangle size={16} color={COLORS.warn} style={{ flexShrink: 0, marginTop: 1 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, color: COLORS.warn, fontWeight: 600 }}>Missing: {s.label}</div>
                            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{s.hint}</div>
                          </div>
                          <button onClick={() => dismissWarning(activeTrip.id, s.id)} style={iconBtn(COLORS.muted)}><X size={15} /></button>
                        </div>
                      ))}
                    </>
                  )}
                  {personalMissing.length > 0 && (
                    <>
                      <div className="display" style={{ fontSize: 13, color: COLORS.star, marginBottom: 8, marginTop: 12 }}>FINAL CHECK: PERSONAL ESSENTIAL ITEMS</div>
                      {personalMissing.map((s) => (
                        <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                          <Star size={16} color={COLORS.star} style={{ flexShrink: 0, marginTop: 1 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, color: COLORS.star, fontWeight: 600 }}>Missing: {s.label}</div>
                          </div>
                          <button onClick={() => dismissWarning(activeTrip.id, s.id)} style={iconBtn(COLORS.muted)}><X size={15} /></button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              <button onClick={() => deleteTrip(activeTrip.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#C6633A", cursor: "pointer", fontSize: 13, margin: "4px auto 0", padding: 8 }}>
                <Trash2 size={14} /> Delete this trip
              </button>
            </>
          );
        })()}
      </div>

      {/* Floating add button */}
      {view !== "trip" && (
        <button onClick={() => (view === "closet" ? openAdd() : openNewTrip())} aria-label={view === "closet" ? "Add gear item" : "Add trip"} style={{ position: "fixed", bottom: 22, right: 20, width: 56, height: 56, borderRadius: "50%", background: COLORS.ember, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Plus size={26} />
        </button>
      )}

      {/* Add / edit gear item form */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 20 }} onClick={() => setShowForm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.card, width: "100%", maxWidth: 480, borderRadius: "16px 16px 0 0", padding: "20px 20px 28px", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="display" style={{ margin: 0, fontSize: 20 }}>{editingId ? "EDIT ITEM" : "ADD ITEM"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted }}><X size={22} /></button>
            </div>

            {!editingId && (
              <div style={{ marginTop: 14 }}>
                <label style={{ ...labelStyle, marginTop: 0 }}>Search Outdoor Gear</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} placeholder="e.g. Nemo Dagger Osmo 2P" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={runSearch} disabled={!searchQuery.trim()} style={{ padding: "0 16px", borderRadius: 8, border: "none", background: COLORS.ember, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Search size={16} />
                  </button>
                </div>
               

                {searchResults && searchResults.length === 0 && (
                  <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 8 }}>No gear found matching your search. — fill in the details manually below.</div>
                )}
                {searchResults && searchResults.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {searchResults.map((r, idx) => (
  <div
    key={idx}
    style={{
      border: `1px solid ${COLORS.line}`,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      background: COLORS.cardRaised,
    }}
  >
    <div
      style={{
        fontWeight: 700,
        fontSize: 15,
        marginBottom: 6,
      }}
    >
      {r.isGoogle ? r.model : `${r.brand} ${r.model}`}
    </div>

    <div
      style={{
        fontSize: 12,
        color: COLORS.ember,
        marginBottom: 6,
      }}
    >
      {r.isGoogle ? r.brand : [r.subtype, r.weightOz ? `${r.weightOz} oz` : null, r.price ? `$${r.price}` : null].filter(Boolean).join(" · ")}
    </div>

    {r.isGoogle && r.description && (
      <div
        style={{
          fontSize: 13,
          color: COLORS.muted,
          marginBottom: 6,
        }}
      >
        {r.description}
      </div>
    )}

    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <button
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          background: COLORS.ember,
          color: "white",
          cursor: "pointer",
        }}
        onClick={() => pickSearchResult(r)}
      >
        Use This
      </button>

      {r.isGoogle && r.source && (
        <button
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${COLORS.line}`,
            background: "transparent",
            color: COLORS.muted,
            cursor: "pointer",
          }}
          onClick={() => window.open(r.source, "_blank")}
        >
          View Source
        </button>
      )}
    </div>
  </div>
))}
                  </div>
                )}
                <div style={{ borderTop: `1px solid ${COLORS.line}`, margin: "16px 0 2px" }} />
                <div style={{ fontSize: 12, color: COLORS.muted, textAlign: "center", margin: "8px 0 4px" }}>or fill in the details yourself</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Brand</label>
                <input type="text" value={draft.brand} onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))} placeholder="e.g. Nemo" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Model</label>
                <input type="text" value={draft.model} onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))} placeholder="e.g. Dagger Osmo 2P" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Category</label>
                <select
                  value={draft.category}
                  onChange={(e) => {
                    const category = e.target.value;
                    const opts = subtypesFor(category);
                    setDraft((d) => ({ ...d, category, subtype: opts[0] || "", specs: {} }));
                  }}
                  style={inputStyle}
                >
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Subtype</label>
                <select
                  value={draft.subtype}
                  onChange={(e) => setDraft((d) => ({ ...d, subtype: e.target.value, specs: {} }))}
                  style={inputStyle}
                >
                  {subtypesFor(draft.category).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {specFieldsFor(draft.category, draft.subtype).length > 0 && (
              <div style={{ background: COLORS.cardRaised, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "12px 14px", marginTop: 14 }}>
                <div style={{ fontSize: 11.5, color: COLORS.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>{draft.subtype} details</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {specFieldsFor(draft.category, draft.subtype).map((f) => (
                    <div key={f.key} style={{ flex: "1 1 45%", minWidth: 120 }}>
                      <label style={{ ...labelStyle, marginTop: 0 }}>{f.label}</label>
                      <input
                        type={f.type}
                        inputMode={f.type === "number" ? "decimal" : undefined}
                        value={draft.specs[f.key] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, specs: { ...d.specs, [f.key]: e.target.value } }))}
                        placeholder={f.placeholder || ""}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label style={labelStyle}>Weight</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" inputMode="decimal" value={draft.weightVal} onChange={(e) => setDraft((d) => ({ ...d, weightVal: e.target.value }))} placeholder="0" style={{ ...inputStyle, flex: 1 }} />
              <select value={draft.weightUnit} onChange={(e) => setDraft((d) => ({ ...d, weightUnit: e.target.value }))} style={{ ...inputStyle, width: 78 }}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Color</label>
                <input type="text" value={draft.color} onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))} placeholder="Birch Bud" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Tag</label>
                <input type="text" value={draft.tag} onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value }))} placeholder="3-Season, 2P…" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Year</label>
                <input type="number" inputMode="numeric" value={draft.year} onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value }))} placeholder="2025" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Price ($)</label>
                <input type="number" inputMode="decimal" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} placeholder="0" style={inputStyle} />
              </div>
            </div>

            <label style={labelStyle}>Photo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {draft.photo ? <img src={draft.photo} alt="preview" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover" }} /> : (
                <div style={{ width: 56, height: 56, borderRadius: 10, background: COLORS.paper, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${COLORS.line}` }}><Camera size={20} color={COLORS.muted} /></div>
              )}
              <button onClick={() => fileRef.current?.click()} style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${COLORS.moss}`, color: COLORS.moss, background: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>{draft.photo ? "Change photo" : "Add photo"}</button>
              {draft.photo && <button onClick={() => setDraft((d) => ({ ...d, photo: null }))} style={{ background: "none", border: "none", color: COLORS.ember, cursor: "pointer", fontSize: 13 }}>Remove</button>}
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
            </div>

            <div style={{ display: "flex", gap: 18, marginTop: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, cursor: "pointer" }}>
                <input type="checkbox" checked={draft.worn} onChange={(e) => setDraft((d) => ({ ...d, worn: e.target.checked }))} />
                Worn (not carried)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, cursor: "pointer" }}>
                <input type="checkbox" checked={draft.essential} onChange={(e) => setDraft((d) => ({ ...d, essential: e.target.checked }))} />
                Personal essential
              </label>
            </div>

            <button onClick={saveDraft} disabled={!draft.brand.trim() && !draft.model.trim()} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: (draft.brand.trim() || draft.model.trim()) ? COLORS.moss : COLORS.line, color: "#fff", fontSize: 15.5, fontWeight: 700, cursor: "pointer", fontFamily: "'Fjalla One', sans-serif", letterSpacing: "0.03em", marginTop: 20 }}>
              {editingId ? "SAVE CHANGES" : "ADD TO CLOSET"}
            </button>
          </div>
        </div>
      )}

      {/* Trip form */}
      {showTripForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 20 }} onClick={() => setShowTripForm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.card, width: "100%", maxWidth: 480, borderRadius: "16px 16px 0 0", padding: "20px 20px 28px", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="display" style={{ margin: 0, fontSize: 20 }}>{editingTripId ? "EDIT TRIP" : "NEW TRIP"}</h2>
              <button onClick={() => setShowTripForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted }}><X size={22} /></button>
            </div>
            <label style={labelStyle}>Trail / summit name</label>
            <input type="text" value={tripDraft.name} onChange={(e) => setTripDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Angels Landing" style={inputStyle} />
            <label style={labelStyle}>Location</label>
            <input type="text" value={tripDraft.location} onChange={(e) => setTripDraft((d) => ({ ...d, location: e.target.value }))} placeholder="e.g. Zion National Park, UT" style={inputStyle} />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Distance (mi)</label>
                <input type="number" inputMode="decimal" value={tripDraft.distanceMi} onChange={(e) => setTripDraft((d) => ({ ...d, distanceMi: e.target.value }))} placeholder="0" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Elevation gain (ft)</label>
                <input type="number" inputMode="numeric" value={tripDraft.elevationGainFt} onChange={(e) => setTripDraft((d) => ({ ...d, elevationGainFt: e.target.value }))} placeholder="0" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Days</label>
                <input type="number" inputMode="numeric" value={tripDraft.days} onChange={(e) => setTripDraft((d) => ({ ...d, days: e.target.value }))} placeholder="1" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Route type</label>
                <select value={tripDraft.routeType} onChange={(e) => setTripDraft((d) => ({ ...d, routeType: e.target.value }))} style={inputStyle}>
                  {ROUTE_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <label style={labelStyle}>Start date (optional)</label>
            <input type="date" value={tripDraft.date} onChange={(e) => setTripDraft((d) => ({ ...d, date: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Water (fl oz)</label>
            <input type="number" inputMode="decimal" value={tripDraft.waterFlOz} onChange={(e) => setTripDraft((d) => ({ ...d, waterFlOz: e.target.value }))} placeholder="0" style={inputStyle} />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Expected low (°F)</label>
                <input type="number" inputMode="decimal" value={tripDraft.weatherLowF} onChange={(e) => setTripDraft((d) => ({ ...d, weatherLowF: e.target.value }))} placeholder="e.g. 28" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Expected high (°F)</label>
                <input type="number" inputMode="decimal" value={tripDraft.weatherHighF} onChange={(e) => setTripDraft((d) => ({ ...d, weatherHighF: e.target.value }))} placeholder="e.g. 62" style={inputStyle} />
              </div>
            </div>
            <button onClick={saveTripDraft} disabled={!tripDraft.name.trim()} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: tripDraft.name.trim() ? COLORS.moss : COLORS.line, color: "#fff", fontSize: 15.5, fontWeight: 700, cursor: tripDraft.name.trim() ? "pointer" : "not-allowed", fontFamily: "'Fjalla One', sans-serif", letterSpacing: "0.03em", marginTop: 20 }}>
              {editingTripId ? "SAVE CHANGES" : "CREATE TRIP"}
            </button>
          </div>
        </div>
      )}

      {/* Extra form */}
      {showExtraForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 20 }} onClick={() => setShowExtraForm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.card, width: "100%", maxWidth: 480, borderRadius: "16px 16px 0 0", padding: "20px 20px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="display" style={{ margin: 0, fontSize: 20 }}>ADD CONSUMABLE</h2>
              <button onClick={() => setShowExtraForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted }}><X size={22} /></button>
            </div>
            <label style={labelStyle}>Name</label>
            <input type="text" value={extraDraft.name} onChange={(e) => setExtraDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Dinners (3x)" style={inputStyle} />
            <label style={labelStyle}>Weight</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" inputMode="decimal" value={extraDraft.weightVal} onChange={(e) => setExtraDraft((d) => ({ ...d, weightVal: e.target.value }))} placeholder="0" style={{ ...inputStyle, flex: 1 }} />
              <select value={extraDraft.weightUnit} onChange={(e) => setExtraDraft((d) => ({ ...d, weightUnit: e.target.value }))} style={{ ...inputStyle, width: 78 }}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <button onClick={saveExtra} disabled={!extraDraft.name.trim()} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: extraDraft.name.trim() ? COLORS.moss : COLORS.line, color: "#fff", fontSize: 15.5, fontWeight: 700, cursor: extraDraft.name.trim() ? "pointer" : "not-allowed", fontFamily: "'Fjalla One', sans-serif", letterSpacing: "0.03em", marginTop: 20 }}>ADD</button>
          </div>
        </div>
      )}

    </div>
  );
}

function specSummary(item) {
  const s = item.specs || {};
  const has = (k) => s[k] !== undefined && s[k] !== null && s[k] !== "";
  switch (item.subtype) {
    case "Sleeping Bag": {
      const parts = [];
      if (has("minTempF") || has("maxTempF")) parts.push(`${has("minTempF") ? s.minTempF : "?"}°–${has("maxTempF") ? s.maxTempF : "?"}°F`);
      if (has("fill")) parts.push(s.fill);
      return parts.join(" · ");
    }
    case "Sleeping Pad": {
      const parts = [];
      if (has("rValue")) parts.push(`R-${s.rValue}`);
      if (has("minTempF")) parts.push(`${s.minTempF}°F`);
      return parts.join(" · ");
    }
    case "Tent": {
      const parts = [];
      if (has("capacity")) parts.push(`${s.capacity}P`);
      if (has("season")) parts.push(s.season);
      return parts.join(" · ");
    }
    case "Backpack": case "Daypack": case "Stuff Sack": {
      const parts = [];
      if (has("volumeL")) parts.push(`${s.volumeL}L`);
      if (has("frameType")) parts.push(s.frameType);
      return parts.join(" · ");
    }
    case "Jacket": {
      const parts = [];
      if (has("insulation")) parts.push(s.insulation);
      if (has("minTempF")) parts.push(`${s.minTempF}°F`);
      if (has("waterproof")) parts.push(s.waterproof);
      return parts.join(" · ");
    }
    case "Headlamp": {
      const parts = [];
      if (has("lumens")) parts.push(`${s.lumens} lm`);
      if (has("batteryLifeHrs")) parts.push(`${s.batteryLifeHrs}hr`);
      return parts.join(" · ");
    }
    default: {
      const keys = Object.keys(s).filter(has);
      return keys.map((k) => s[k]).join(" · ");
    }
  }
}

function GearCard({ item, unit, onEdit, onDelete, packed, onTogglePacked, onRemove, tripMode }) {
  const cat = CATEGORIES.find((c) => c.id === item.category);
  const spec = specSummary(item);
  const tags = [item.color, item.tag, spec].filter(Boolean).join(" · ");
  return (
    <div style={{ padding: "12px 14px", borderTop: `1px solid ${COLORS.line}`, opacity: tripMode && !packed ? 0.55 : 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {tripMode && (
          <button onClick={onTogglePacked} aria-label={packed ? "Mark unpacked" : "Mark packed"} style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2, border: `2px solid ${packed ? COLORS.moss : COLORS.muted}`, background: packed ? COLORS.moss : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {packed && <Check size={13} color="#fff" strokeWidth={3} />}
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>
              {item.brand}{item.brand && item.model ? <span style={{ color: COLORS.muted, fontWeight: 400 }}> | </span> : ""}{item.model}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, fontSize: 11, color: COLORS.muted, lineHeight: 1.3 }}>
              {cat && <div>{cat.label}</div>}
              {item.subtype && <div>{item.subtype}</div>}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            {item.photo ? (
              <img src={item.photo} alt={itemLabel(item)} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 8, background: COLORS.paper, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${COLORS.line}` }}>
                <Camera size={16} color={COLORS.muted} />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5 }}>
              {formatWeight(item.grams, unit)}
              {item.source === "database" ? <Globe size={13} color={COLORS.moss} title="From the built-in reference database" /> : <FileText size={13} color={COLORS.star} title="Manually entered" />}
            </div>
            {item.essential && <Star size={13} color={COLORS.star} />}
            {item.worn && <span style={{ fontSize: 10.5, color: COLORS.star, border: `1px solid ${COLORS.star}`, borderRadius: 5, padding: "1px 5px" }}>WORN</span>}
            <span style={{ marginLeft: "auto", fontSize: 11, color: COLORS.muted }}>{item.year || ""}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <span style={{ fontSize: 12, color: COLORS.muted }}>{tags}</span>
            {item.price ? <span style={{ fontSize: 13, fontWeight: 600 }}>${item.price}</span> : <span />}
          </div>
        </div>

        {!tripMode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
            <button onClick={onEdit} aria-label="Edit item" style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: COLORS.muted }}><Pencil size={15} /></button>
            <button onClick={onDelete} aria-label="Delete item" style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: "#C6633A" }}><Trash2 size={15} /></button>
          </div>
        )}
        {tripMode && (
          <button onClick={onRemove} aria-label="Remove from trip" style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: COLORS.muted, flexShrink: 0 }}><X size={16} /></button>
        )}
      </div>
    </div>
  );
}
