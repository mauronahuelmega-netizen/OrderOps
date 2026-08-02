type GooglePlace = {
  formattedAddress?: string;
  fetchFields: (request: { fields: string[] }) => Promise<void>;
};

export type GooglePlacePrediction = {
  text: { toString: () => string };
  toPlace: () => GooglePlace;
};

export type GoogleAutocompleteSuggestion = {
  placePrediction?: GooglePlacePrediction;
};

export type GooglePlacesLibrary = {
  AutocompleteSessionToken: new () => unknown;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      language: string;
      region: string;
      includedRegionCodes: string[];
      sessionToken: unknown;
    }) => Promise<{ suggestions: GoogleAutocompleteSuggestion[] }>;
  };
};

type GoogleMapsGlobal = {
  maps?: {
    importLibrary?: (library: "places") => Promise<GooglePlacesLibrary>;
  };
};

declare global {
  interface Window {
    google?: GoogleMapsGlobal;
  }
}

let placesLibraryPromise: Promise<GooglePlacesLibrary> | null = null;

export function loadGooglePlacesLibrary(apiKey: string) {
  if (typeof window === "undefined" || !apiKey) {
    return Promise.reject(new Error("Google Maps unavailable"));
  }

  if (placesLibraryPromise) return placesLibraryPromise;

  placesLibraryPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.maps?.importLibrary) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-orderops-google-maps="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps unavailable")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      language: "es",
      region: "AR",
      loading: "async"
    });

    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.dataset.orderopsGoogleMaps = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps unavailable"));
    document.head.append(script);
  }).then(async () => {
    const importLibrary = window.google?.maps?.importLibrary;
    if (!importLibrary) throw new Error("Google Maps unavailable");
    return importLibrary("places");
  });

  return placesLibraryPromise;
}
