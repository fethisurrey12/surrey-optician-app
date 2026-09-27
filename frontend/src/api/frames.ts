// The frames shown on Home.
//
// ⚠ PLACEHOLDER STOCK. These two are not the practice's — the names, styles and
// prices came from the design sketch this section was built from. Nothing here
// should reach a patient: someone will walk into Coulsdon and ask for an "Aven
// Elite" at £145.
//
// Replacing them is this file and nothing else. Either paste the real ones in,
// or, when the practice wants the list to change without an app release, swap
// `FRAMES` for a fetch — the showcase takes an array and does not care where it
// came from.

import { type FrameShape } from "@/src/ui/art/Spectacles";

export type Frame = {
  id: string;
  name: string;
  /** The material and shape, as a colleague would say it. */
  type: string;
  /** Pounds. Whole numbers price better than 144.99 in a list this small. */
  price: number;
  /** A word in the corner: "New", "Trending". Omit for most of them. */
  tag?: string;
  /** Which silhouette the card draws. Match it to `type`. */
  shape?: FrameShape;
};

export const FRAMES: Frame[] = [
  {
    id: "f-aven",
    name: "Aven Elite",
    type: "Acetate cat-eye",
    price: 145,
    tag: "Trending",
    shape: "cateye",
  },
  {
    id: "f-verge",
    name: "Verge Wire",
    type: "Titanium round",
    price: 185,
    tag: "New",
    shape: "round",
  },
];
