import Svg, { Circle, Path } from "react-native-svg";

import { useTheme } from "@/src/theme";

type Shape = { paths?: string[]; circles?: [number, number, number][] };

const ICONS: Record<string, Shape> = {
  home: { paths: ["M3 9.2l9-6.6 9 6.6V20a1.6 1.6 0 0 1-1.6 1.6H15V14H9v7.6H4.6A1.6 1.6 0 0 1 3 20z"] },
  gift: {
    paths: [
      "M20 12v9.2H4V12",
      "M2.5 7.4h19V12h-19z",
      "M12 21.2V7.4",
      "M12 7.4H7.6a2.4 2.4 0 0 1 0-4.8C11 2.6 12 7.4 12 7.4z",
      "M12 7.4h4.4a2.4 2.4 0 0 0 0-4.8C13 2.6 12 7.4 12 7.4z",
    ],
  },
  activity: { paths: ["M22 12h-4l-3 8.5L9 3.5 6 12H2"] },
  user: { paths: ["M20 21v-1.8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V21"], circles: [[12, 7, 4]] },
  chevronRight: { paths: ["M9 5l7 7-7 7"] },
  chevronDown: { paths: ["M5 9l7 7 7-7"] },
  back: { paths: ["M19 12H5", "M11 18l-6-6 6-6"] },
  phone: {
    paths: [
      "M22 16.9v2.8a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4a2 2 0 0 1 2-2.2h2.8a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9z",
    ],
  },
  pin: { paths: ["M21 10c0 6.5-9 12.5-9 12.5S3 16.5 3 10a9 9 0 0 1 18 0z"], circles: [[12, 10, 3]] },
  directions: { paths: ["M3 11l18.5-8.5L13 21l-2-8-8-2z"] },
  check: { paths: ["M20 6.5L9.2 17.5l-5-5"] },
  lock: { paths: ["M18.4 11H5.6A1.6 1.6 0 0 0 4 12.6V20a1.6 1.6 0 0 0 1.6 1.6h12.8A1.6 1.6 0 0 0 20 20v-7.4A1.6 1.6 0 0 0 18.4 11z", "M7.5 11V7.2a4.5 4.5 0 0 1 9 0V11"] },
  bell: { paths: ["M18 8.4a6 6 0 0 0-12 0c0 7-3 8.8-3 8.8h18s-3-1.8-3-8.8z", "M13.6 20.6a2 2 0 0 1-3.2 0"] },
  shield: { paths: ["M12 22s7.5-3.8 7.5-9.5V5.4L12 2.6 4.5 5.4v7.1C4.5 18.2 12 22 12 22z"] },
  close: { paths: ["M18 6L6 18", "M6 6l12 12"] },
  edit: { paths: ["M11 4.4H4.4A1.8 1.8 0 0 0 2.6 6.2V19.6A1.8 1.8 0 0 0 4.4 21.4h13.4a1.8 1.8 0 0 0 1.8-1.8V13", "M18 2.7a2 2 0 0 1 2.9 2.9L11.4 15l-3.8.9.9-3.8z"] },
  mail: { paths: ["M4 4.6h16a1.8 1.8 0 0 1 1.8 1.8v11.2A1.8 1.8 0 0 1 20 19.4H4a1.8 1.8 0 0 1-1.8-1.8V6.4A1.8 1.8 0 0 1 4 4.6z", "M21.4 6.6l-9.4 6.6-9.4-6.6"] },
  clock: { paths: ["M12 7v5l3.3 2"], circles: [[12, 12, 9.2]] },
  info: { paths: ["M12 16.5V11.5", "M12 8h.02"], circles: [[12, 12, 9.2]] },
  sliders: {
    paths: ["M4 7h5", "M13 7h7", "M4 12h11", "M19 12h1", "M4 17h3", "M11 17h9"],
    circles: [[10, 7, 2.1], [16, 12, 2.1], [8, 17, 2.1]],
  },
  faceid: {
    paths: [
      "M4 8V6.2A2.2 2.2 0 0 1 6.2 4H8",
      "M16 4h1.8A2.2 2.2 0 0 1 20 6.2V8",
      "M20 16v1.8a2.2 2.2 0 0 1-2.2 2.2H16",
      "M8 20H6.2A2.2 2.2 0 0 1 4 17.8V16",
      "M9 10v1.3",
      "M15 10v1.3",
      "M12 10v3l-1.1 1",
      "M9.2 15.2c1.4 1.1 4.2 1.1 5.6 0",
    ],
  },
  sparkle: { paths: ["M12 3l1.9 5.4L19.5 10l-5.6 1.6L12 17l-1.9-5.4L4.5 10l5.6-1.6z"] },
  wallet: { paths: ["M3 7.5A1.5 1.5 0 0 1 4.5 6H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M16.5 12.5h.01"] },
  logout: { paths: ["M15 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9", "M15 12H10.5", "M18.5 8.5L22 12l-3.5 3.5"] },
  card: { paths: ["M3 6.5h18A1.5 1.5 0 0 1 22.5 8v8a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 16V8A1.5 1.5 0 0 1 3 6.5z", "M1.5 10.5h21"] },
  delete: { paths: ["M20 5H8.5L2.5 12l6 7H20a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 20 5z", "M15 9l-4 6", "M11 9l4 6"] },
  share: { paths: ["M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7", "M16 6l-4-4-4 4", "M12 2v13"] },
  copy: { paths: ["M9 9h11a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 20 22H9a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 9 9z", "M4.5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v.5"] },
  users: { paths: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M23 21v-2a4 4 0 0 0-3-3.9", "M16 3.1a4 4 0 0 1 0 7.8"], circles: [[9, 7, 4]] },
  eye: { paths: ["M1.5 12s3.8-7 10.5-7 10.5 7 10.5 7-3.8 7-10.5 7S1.5 12 1.5 12z"], circles: [[12, 12, 3.2]] },
  lens: { circles: [[12, 12, 8.5], [12, 12, 3.6]], paths: ["M6.5 8.2c1.2-1.6 3-2.6 5-2.8"] },
  calendar: {
    paths: [
      "M4 6.5h16A1.5 1.5 0 0 1 21.5 8v11a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 19V8A1.5 1.5 0 0 1 4 6.5z",
      "M2.5 11h19",
      "M8 3.5v4",
      "M16 3.5v4",
    ],
  },
  scan: { paths: ["M4 8V6a2 2 0 0 1 2-2h2", "M16 4h2a2 2 0 0 1 2 2v2", "M20 16v2a2 2 0 0 1-2 2h-2", "M8 20H6a2 2 0 0 1-2-2v-2", "M4 12h16"] },
};

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 22,
  color,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const { colors } = useTheme();
  const stroke = color ?? colors.ink;
  const shape = ICONS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {shape.paths?.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {shape.circles?.map(([cx, cy, r], i) => (
        <Circle key={`c${i}`} cx={cx} cy={cy} r={r} stroke={stroke} strokeWidth={strokeWidth} />
      ))}
    </Svg>
  );
}
