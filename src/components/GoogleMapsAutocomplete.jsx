import { useEffect, useRef } from "react";
import { useGoogleMapsApi } from "../hooks/useGoogleMaps"; // Import the custom hook


const GoogleMapsAutocomplete = ({
  onPlaceSelected,
  placeholder,
  required = false,
  ...props
}) => {
  const inputRef = useRef(null);
  const { isLoaded, loadError } = useGoogleMapsApi(); // Use the custom hook

  useEffect(() => {
    if (!isLoaded) return; // Exit early if not loaded
    if (loadError) {
      console.error("Google Maps API Load Error:", loadError);
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: ["ca"] },
        fields: ["address_components", "geometry"],
        types: ["address"],
      }
    );

    const handlePlaceChanged = () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) {
        onPlaceSelected(null, "No details available for the selected address.");
        return;
      }

      const addressData = {
        address1: "",
        postcode: "",
        country: "",
        city: "",
        state: "",
      };

      place.address_components.forEach((component) => {
        const componentType = component.types[0];
        switch (componentType) {
          case "street_number":
            addressData.address1 = `${component.long_name} ${addressData.address1}`;
            break;
          case "route":
            addressData.address1 += component.short_name;
            break;
          case "postal_code":
            addressData.postcode = `${component.long_name}${addressData.postcode}`;
            break;
          case "postal_code_suffix":
            addressData.postcode = `${addressData.postcode}-${component.long_name}`;
            break;
          case "locality":
            addressData.city = component.long_name;
            break;
          case "administrative_area_level_1":
            addressData.state = component.short_name;
            break;
          case "country":
            addressData.country = component.long_name;
            break;
          default:
            break;
        }
      });

      onPlaceSelected(addressData, null);
    };

    autocomplete.addListener("place_changed", handlePlaceChanged);
  }, [isLoaded, loadError, onPlaceSelected]);

  return (
    <input
      ref={inputRef}
      placeholder={placeholder}
      required={required}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
      {...props}
    />
  );
};

export default GoogleMapsAutocomplete;
