import { useEffect, useState } from "react";
import { AppState } from "react-native";

// The greeting at the top of Home, by the clock on the patient's own phone.
//
// Morning runs from 5am, afternoon from midday, evening from 6pm — and evening
// carries on through the small hours, because someone opening the app at two in
// the morning is not having a morning.
const MORNING_FROM = 5;
const AFTERNOON_FROM = 12;
const EVENING_FROM = 18;

export function greetingFor(when: Date = new Date()): string {
  const h = when.getHours();
  if (h >= EVENING_FROM || h < MORNING_FROM) return "Good evening";
  if (h >= AFTERNOON_FROM) return "Good afternoon";
  return "Good morning";
}

/** How long until the greeting would next change, in milliseconds. */
export function msUntilNextGreeting(now: Date = new Date()): number {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  const h = now.getHours();
  if (h < MORNING_FROM) next.setHours(MORNING_FROM);
  else if (h < AFTERNOON_FROM) next.setHours(AFTERNOON_FROM);
  else if (h < EVENING_FROM) next.setHours(EVENING_FROM);
  else {
    next.setDate(next.getDate() + 1);
    next.setHours(MORNING_FROM);
  }
  return Math.max(1000, next.getTime() - now.getTime());
}

/**
 * The greeting, kept honest: it changes on the hour it should, and again
 * whenever the app comes back to the front — a phone asleep in a pocket does
 * not run timers, so the clock is re-read on waking rather than trusted.
 */
export function useGreeting(): string {
  const [greeting, setGreeting] = useState(() => greetingFor());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      setGreeting(greetingFor());
      timer = setTimeout(schedule, msUntilNextGreeting());
    };
    schedule();

    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      clearTimeout(timer);
      schedule();
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return greeting;
}
