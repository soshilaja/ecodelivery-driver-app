// useGoogleMapsApi.js
import { useState, useEffect } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Ensure your API key is set in your environment variables

export const useGoogleMapsApi = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"],
    });

    loader
      .load()
      .then(() => setIsLoaded(true))
      .catch((err) => setLoadError(err));
  }, []);

  return { isLoaded, loadError };
};
