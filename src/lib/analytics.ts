export const GA_ID = "G-MSRJWNJXZ7";

type GtagCommand = "config" | "event" | "js";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: [GtagCommand, ...unknown[]]) => void;
  }
}

function gtag(...args: [GtagCommand, ...unknown[]]) {
  try {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag(...args);
    }
  } catch {
    // analytics should never break the app
  }
}

function trackEvent(name: string) {
  gtag("event", name);
}

// --- JSON input ---
export const trackPasteJson = () => trackEvent("paste_json");
export const trackUploadJson = () => trackEvent("upload_json");
export const trackLoadSampleJson = () => trackEvent("load_sample_json");

// --- Serializer ---
export const trackChangeSerializer = (id: string) =>
  trackEvent(`change_serializer_${id}`);

// --- Serializer options (boolean toggles only, never track text input) ---
export const trackToggleOption = (serializerId: string, optionId: string, enabled: boolean) =>
  trackEvent(`option_${serializerId}_${optionId}_${enabled ? "on" : "off"}`);

// --- Explorer ---
export const trackExploreRoot = () => trackEvent("explore_root");
export const trackExploreResult = () => trackEvent("explore_result");

// --- Autocomplete ---
export const trackAutocompleteAccept = () => trackEvent("autocomplete_accept");

// --- Navigation ---
export const trackClickGithub = () => trackEvent("click_github");
