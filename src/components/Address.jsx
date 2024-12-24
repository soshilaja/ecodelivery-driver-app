import GoogleMapsAutocomplete from "./GoogleMapsAutocomplete";
import PropTypes from "prop-types";




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
        postcode: data.postcode,
        country: data.country,
        error: "",
      }));
    }
  };


  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Driver Address*
        </label>
        <GoogleMapsAutocomplete
          onPlaceSelected={handlePlaceSelected}
          placeholder={
            address
              ? `${address?.address1}, ${address?.city}, ${address?.state}, ${address?.country}`
              : "Driver Address"
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

Address.propTypes = {
  address: PropTypes.shape({
    address1: PropTypes.string.isRequired,
    city: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    postcode: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
  }).isRequired,
  setAddress: PropTypes.func.isRequired,
  address2: PropTypes.string,
  setAddress2: PropTypes.func.isRequired,

}
