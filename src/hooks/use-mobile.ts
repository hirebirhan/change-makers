import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  return React.useSyncExternalStore(subscribeToMobileChanges, getMobileSnapshot, getServerSnapshot)
}

function getMobileSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

function subscribeToMobileChanges(callback: () => void) {
  const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mediaQuery.addEventListener("change", callback)
  return () => mediaQuery.removeEventListener("change", callback)
}
