// Respect the OS "reduce motion" setting everywhere. Returns true when motion
// should be minimised; screens use it to skip entrances and looping effects.
import { useReducedMotion } from "react-native-reanimated";

export function useReduceMotion(): boolean {
  return useReducedMotion();
}
