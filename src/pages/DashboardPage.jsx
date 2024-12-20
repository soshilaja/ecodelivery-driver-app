import { useState, useEffect } from "react";
import {
  ChartBarIcon,
  TruckIcon,
  CurrencyDollarIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../services/firebase";

const DashboardPage = () => {
  const { user, driverProfile } = useAuth();
  const [stats, setStats] = useState({
    completedDeliveries: 0,
    totalEarnings: 0,
    averageRating: 0,
    greenScore: 0,
  });

  const [earningsData, setEarningsData] = useState([
    { month: "Jan", earnings: 0 },
    { month: "Feb", earnings: 0 },
    { month: "Mar", earnings: 0 },
    { month: "Apr", earnings: 0 },
    { month: "May", earnings: 0 },
    { month: "Jun", earnings: 0 },
  ]);

  useEffect(() => {
    const fetchDriverStats = async () => {
      try {
        // Fetch completed deliveries
        const deliveriesQuery = query(
          collection(firestore, "orders"),
          where("driverId", "==", user.uid),
          where("status", "==", "completed")
        );
        const deliveriesSnapshot = await getDocs(deliveriesQuery);
        const completedDeliveries = deliveriesSnapshot.size;

        // Calculate total earnings
        const totalEarnings = deliveriesSnapshot.docs.reduce(
          (total, doc) => total + (doc.data().earnings || 0),
          0
        );

        // Fetch driver ratings
        const ratingsQuery = query(
          collection(firestore, "ratings"),
          where("driverId", "==", user.uid)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const averageRating =
          ratingsSnapshot.size > 0
            ? ratingsSnapshot.docs.reduce(
                (total, doc) => total + doc.data().rating,
                0
              ) / ratingsSnapshot.size
            : 0;

        setStats({
          completedDeliveries,
          totalEarnings: Math.round(totalEarnings),
          averageRating: Math.round(averageRating * 10) / 10,
          greenScore: driverProfile?.greenScore || 0,
        });

        // Mock earnings data (in a real app, fetch actual monthly earnings)
        const mockEarningsData = [
          { month: "Jan", earnings: Math.random() * 500 },
          { month: "Feb", earnings: Math.random() * 500 },
          { month: "Mar", earnings: Math.random() * 500 },
          { month: "Apr", earnings: Math.random() * 500 },
          { month: "May", earnings: Math.random() * 500 },
          { month: "Jun", earnings: Math.random() * 500 },
        ];
        setEarningsData(mockEarningsData);
      } catch (error) {
        console.error("Error fetching driver stats:", error);
      }
    };

    if (user) {
      fetchDriverStats();
    }
  }, [user, driverProfile]);

  const statCards = [
    {
      icon: <TruckIcon className="h-6 w-6 text-green-500" />,
      title: "Completed Deliveries",
      value: stats.completedDeliveries,
      color: "text-green-600",
    },
    {
      icon: <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />,
      title: "Total Earnings",
      value: `$${stats.totalEarnings}`,
      color: "text-blue-600",
    },
    {
      icon: <StarIcon className="h-6 w-6 text-yellow-500" />,
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      color: "text-yellow-600",
    },
    {
      icon: <ChartBarIcon className="h-6 w-6 text-purple-500" />,
      title: "Green Score",
      value: stats.greenScore,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Driver Dashboard</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {driverProfile?.vehicleType || "No Vehicle"}
            </span>
            <div
              className={`w-3 h-3 rounded-full ${
                driverProfile?.status === "online"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
          </div>
        </div>

        {/* Performance Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-lg p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow"
            >
              <div className="bg-gray-100 p-3 rounded-full">{card.icon}</div>
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Earnings Chart */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Monthly Earnings
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#10B981"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Challenges & Incentives */}
        <div className="mt-8 bg-green-50 border-l-4 border-green-500 p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Upcoming Challenges
          </h3>
          <ul className="list-disc list-inside text-green-700">
            <li>Complete 50 deliveries this month for a $100 bonus</li>
            <li>Maintain 4.8+ rating for priority order access</li>
            <li>Increase your green score by using eco-friendly vehicle</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
