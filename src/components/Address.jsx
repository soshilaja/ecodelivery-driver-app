import GoogleMapsAutocomplete from "./GoogleMapsAutocomplete";
import { useAuth } from "../contexts/AuthContext";




const Address = ({
  address,
  setAddress,
  address2,
  setAddress2,
}) => {
  const handlePlaceSelected = (data, error) => {
    if (error) {
      setAddress((prev) => ({ ...prev, error }));
    } else {
      setAddress((prev) => ({
        ...prev,
        address1: data.address1,
        city: data.city,
        state: data.state,
        postal: data.postcode,
        country: data.country,
        error: "",
      }));
    }
  };

  const { driverProfile } = useAuth();


  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Driver Address*
        </label>
        <GoogleMapsAutocomplete
          onPlaceSelected={handlePlaceSelected}
          placeholder={
            driverProfile?.driverAddress?.address1 +
            ", " +
            driverProfile?.driverAddress?.city +
            ", " +
            driverProfile?.driverAddress?.province +
            ", " +
            driverProfile?.driverAddress?.country
          }
          id="driver-address"
          name="driver-address"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Apartment, unit, suite, or floor #
        </label>
        <input
          value={address2}
          onChange={(e) => setAddress2(e.target.value)}
          name="driver-address2"
          id="driver-address2"
          placeholder="Apartment, unit, suite, or floor #"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        />
      </div>
    </>
  );
};

export default Address;
