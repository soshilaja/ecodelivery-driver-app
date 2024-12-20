import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
// import {
//   MapIcon,
//   LocationMarkerIcon,
//   CheckCircleIcon,
// } from "@heroicons/react/24/solid";
import { firestore } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const NavigationTracking = () => {
  const { user } = useAuth();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  // useEffect(() => {
  //   // Initialize map
  //   map.current = new mapboxgl.Map({
  //     container: mapContainer.current,
  //     style: "mapbox://styles/mapbox/streets-v11",
  //     center: [-74.5, 40],
  //     zoom: 9,
  //   });

  //   // Get current location
  //   navigator.geolocation.watchPosition(
  //     (position) => {
  //       const { latitude, longitude } = position.coords;
  //       setCurrentLocation({ latitude, longitude });

  //       // Update driver's location in Firestore
  //       if (user) {
  //         const driverRef = doc(firestore, "drivers", user.uid);
  //         updateDoc(driverRef, {
  //           lastKnownLocation: {
  //             latitude,
  //             longitude,
  //           },
  //         });
  //       }
  //     },
  //     (error) => {
  //       console.error("Error getting location", error);
  //     }
  //   );

  //   // Listen for active order
  //   if (user) {
  //     const orderQuery = doc(firestore, "orders", user.uid);
  //     const unsubscribe = onSnapshot(orderQuery, (doc) => {
  //       const orderData = doc.data();
  //       if (orderData && orderData.status !== "completed") {
  //         setActiveOrder(orderData);
  //       }
  //     });

  //     return () => unsubscribe();
  //   }
  // }, [user]);

  const startNavigation = async () => {
    if (!activeOrder) {
      toast.error("No active order for navigation");
      return;
    }

    try {
      // Fetch route between current location and destination
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${currentLocation.longitude},${currentLocation.latitude};${activeOrder.dropoffLongitude},${activeOrder.dropoffLatitude}?access_token=${mapboxgl.accessToken}`
      );

      const data = await response.json();
      const route = data.routes[0];

      // Update order status
      const orderRef = doc(firestore, "orders", activeOrder.id);
      await updateDoc(orderRef, { status: "in-transit" });

      toast.success("Navigation started");
    } catch (error) {
      toast.error("Navigation setup failed", error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div ref={mapContainer} className="flex-grow" />

      {activeOrder && (
        <div className="p-4 bg-white shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Active Delivery</h3>
              <p>
                {activeOrder.pickupAddress} → {activeOrder.dropoffAddress}
              </p>
            </div>
            <button
              onClick={startNavigation}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Start Navigation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationTracking;
