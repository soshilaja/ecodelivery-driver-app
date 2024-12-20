import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  CreditCardIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { firestore } from "../services/firebase";
import toast from "react-hot-toast";

const EarningsPage = () => {
  const { user } = useAuth();
  const [earningsSummary, setEarningsSummary] = useState({
    totalEarnings: 0,
    weeklyEarnings: 0,
    availableBalance: 0,
    tips: 0,
  });

  const [earningsBreakdown, setEarningsBreakdown] = useState([
    { name: "Base Fees", value: 0, color: "#10B981" },
    { name: "Distance Fees", value: 0, color: "#3B82F6" },
    { name: "Peak Hour Surcharges", value: 0, color: "#F43F5E" },
    { name: "Tips", value: 0, color: "#8B5CF6" },
  ]);

  const [recentEarnings, setRecentEarnings] = useState([
    { month: "Jan", earnings: 0 },
    { month: "Feb", earnings: 0 },
    { month: "Mar", earnings: 0 },
    { month: "Apr", earnings: 0 },
    { month: "May", earnings: 0 },
    { month: "Jun", earnings: 0 },
  ]);

  const [payoutHistory, setPayoutHistory] = useState([]);

  useEffect(() => {
    const fetchEarningsData = async () => {
      if (!user) return;

      try {
        // Fetch earnings from Firestore
        const earningsQuery = query(
          collection(firestore, "earnings"),
          where("driverId", "==", user.uid),
          orderBy("date", "desc")
        );
        const earningsSnapshot = await getDocs(earningsQuery);

        const earnings = earningsSnapshot.docs.map((doc) => doc.data());

        // Calculate total and weekly earnings
        const totalEarnings = earnings.reduce(
          (sum, earning) => sum + earning.amount,
          0
        );
        const weeklyEarnings = earnings
          .filter(
            (earning) =>
              new Date(earning.date.toDate()) >
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
          .reduce((sum, earning) => sum + earning.amount, 0);

        // Breakdown calculation
        const breakdown = [
          {
            name: "Base Fees",
            value: earnings
              .filter((e) => e.type === "base")
              .reduce((sum, e) => sum + e.amount, 0),
            color: "#10B981",
          },
          {
            name: "Distance Fees",
            value: earnings
              .filter((e) => e.type === "distance")
              .reduce((sum, e) => sum + e.amount, 0),
            color: "#3B82F6",
          },
          {
            name: "Peak Hour Surcharges",
            value: earnings
              .filter((e) => e.type === "peak")
              .reduce((sum, e) => sum + e.amount, 0),
            color: "#F43F5E",
          },
          {
            name: "Tips",
            value: earnings
              .filter((e) => e.type === "tip")
              .reduce((sum, e) => sum + e.amount, 0),
            color: "#8B5CF6",
          },
        ];

        // Fetch payout history
        const payoutsQuery = query(
          collection(firestore, "payouts"),
          where("driverId", "==", user.uid),
          orderBy("date", "desc"),
          limit(10)
        );
        const payoutsSnapshot = await getDocs(payoutsQuery);
        const payouts = payoutsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Mock recent earnings data (replace with actual data)
        const mockRecentEarnings = [
          { month: "Jan", earnings: Math.random() * 500 },
          { month: "Feb", earnings: Math.random() * 500 },
          { month: "Mar", earnings: Math.random() * 500 },
          { month: "Apr", earnings: Math.random() * 500 },
          { month: "May", earnings: Math.random() * 500 },
          { month: "Jun", earnings: Math.random() * 500 },
        ];

        setEarningsSummary({
          totalEarnings: Math.round(totalEarnings),
          weeklyEarnings: Math.round(weeklyEarnings),
          availableBalance: Math.round(totalEarnings * 0.8), // 80% available
          tips: breakdown.find((b) => b.name === "Tips").value,
        });

        setEarningsBreakdown(breakdown);
        setRecentEarnings(mockRecentEarnings);
        setPayoutHistory(payouts);
      } catch (error) {
        console.error("Error fetching earnings data:", error);
        toast.error("Failed to load earnings data");
      }
    };

    fetchEarningsData();
  }, [user]);

  const handleRequestPayout = async () => {
    try {
      // Implement payout request logic
      toast.success("Payout request submitted!");
    } catch (error) {
      toast.error("Payout request failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Earnings Dashboard
        </h1>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: <CurrencyDollarIcon className="h-6 w-6 text-green-500" />,
              title: "Total Earnings",
              value: `$${earningsSummary.totalEarnings}`,
              color: "text-green-600",
            },
            {
              icon: <ClockIcon className="h-6 w-6 text-blue-500" />,
              title: "Weekly Earnings",
              value: `$${earningsSummary.weeklyEarnings}`,
              color: "text-blue-600",
            },
            {
              icon: <CreditCardIcon className="h-6 w-6 text-purple-500" />,
              title: "Available Balance",
              value: `$${earningsSummary.availableBalance}`,
              color: "text-purple-600",
            },
            {
              icon: <TrophyIcon className="h-6 w-6 text-yellow-500" />,
              title: "Total Tips",
              value: `$${earningsSummary.tips}`,
              color: "text-yellow-600",
            },
          ].map((card, index) => (
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

        {/* Earnings Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Earnings Bar Chart */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Monthly Earnings
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recentEarnings}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="earnings" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Earnings Breakdown Pie Chart */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Earnings Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={earningsBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {earningsBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-around mt-4">
              {earningsBreakdown.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 mr-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payout Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Payout History
            </h2>
            <button
              onClick={handleRequestPayout}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Request Payout
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map((payout) => (
                <tr key={payout.id} className="border-b">
                  <td className="py-2">
                    {new Date(payout.date.toDate()).toLocaleDateString()}
                  </td>
                  <td className="py-2">${payout.amount.toFixed(2)}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded ${
                        payout.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : payout.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {payout.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;
