import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

import { firestore } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { OrderCard } from "../components/OrderCard";
import mapboxgl from "mapbox-gl";



// Set Mapbox token (replace with your actual token)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const OrdersPage = () => {
  const { user, driverProfile } = useAuth();
  const [activeOrders, setActiveOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);

  useEffect(() => {
    
    // if (!user || driverProfile) return;
    
    // if (!driverProfile?.vehicleType) return;
    console.log("available driver", user);
    
    // Listen for driver's active orders
    const activeOrdersQuery = query(
      collection(firestore, "orders"),
      where("driverId", "==", user.uid),
      where("status", "in", ["accepted", "picked-up", "in-transit"])
    );
    
    const activeOrdersUnsubscribe = onSnapshot(
      activeOrdersQuery,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActiveOrders(orders);
      }
    );
    
    // Listen for available orders in the driver's area
    // const availableOrdersRef = collection(firestore, "orders");
    // const q = query(
    //   availableOrdersRef,
    //   where("status", "==", "pending"),
    //   where("vehicleType", "==", driverProfile?.vehicleType)
    // );
    // const querySnapshot = getDocs(q);
    // const doc = querySnapshot.docs;
    // const data = doc.data();
    // console.log("available order", data);
    // console.log("available order");
  


    const availableOrdersQuery = query(
      collection(firestore, "orders"),
      where("status", "==", "pending"),
      where("vehicleType", "==", driverProfile?.vehicleType)
    );

    
    const availableOrdersUnsubscribe = onSnapshot(
      availableOrdersQuery,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("available orders", orders);
        setAvailableOrders(orders);
      }
    );

    // Cleanup subscriptions
    return () => {
      activeOrdersUnsubscribe();
      availableOrdersUnsubscribe();
    };
  }, []);


  return (
    <div className="min-h-screen bg-gray-100 p-24">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Order Management
        </h1>

        {/* Available Orders Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Available Orders
          </h2>
          {availableOrders.length === 0 ? (
            <p className="text-gray-500">No available orders at the moment</p>
          ) : (
            availableOrders.map((order) => (
              <OrderCard key={order.id} order={order} type="available" />
            ))
          )}
        </div>

        {/* Active Orders Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Active Orders
          </h2>
          {activeOrders.length === 0 ? (
            <p className="text-gray-500">No active orders</p>
          ) : (
            activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} type="active" />
            ))
          )}
        </div>
      </div>
    </div>
  );
};



export default OrdersPage;
