import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import Navbar from "./components/Navbar";

export default function Dashboard() {
  const [distortionData, setDistortionData] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [error, setError] = useState("");

  const getUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    return error || !data.user ? null : data.user.id;
  };

  useEffect(() => {
    const fetchData = async () => {
      const userId = await getUserId();
      if (!userId) {
        setError("User not logged in.");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("journal_logs")
          .select("created_at, detected_distortions, mood")
          .eq("user_id", userId);

        if (error) throw error;

        // ✅ Step 1: Get all unique distortion types
        const allDistortions = new Set();
        data.forEach((log) => {
          log.detected_distortions.forEach((dist) => allDistortions.add(dist));
        });

        // ✅ Step 2: Get all unique dates with any journal entry
        const allDates = new Set();
        data.forEach((log) => {
          allDates.add(new Date(log.created_at).toLocaleDateString());
        });

        // ✅ Step 3: Initialize date-wise distortion counts
        const dateDistortionCounts = {};
        allDates.forEach((date) => {
          dateDistortionCounts[date] = {};
          allDistortions.forEach((dist) => {
            dateDistortionCounts[date][dist] = 0;
          });
        });

        // ✅ Step 4: Fill counts based on actual distortions per day
        data.forEach((log) => {
          const date = new Date(log.created_at).toLocaleDateString();
          log.detected_distortions.forEach((dist) => {
            dateDistortionCounts[date][dist] += 1;
          });
        });

        // ✅ Step 5: Format for Recharts
        const formattedDistortions = Object.entries(dateDistortionCounts).map(
          ([date, counts]) => ({
            date,
            ...counts,
          })
        );
        setDistortionData(formattedDistortions);

        // ✅ Mood Data for Line Chart
        const moodPoints = data
          .filter((log) => log.mood !== null && log.mood !== undefined)
          .map((log) => ({
            date: new Date(log.created_at).toLocaleDateString(),
            mood: log.mood,
          }));
        setMoodData(moodPoints);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-6 px-6">

      <h2 className="text-3xl font-bold mb-6 text-gray-900">📊 Dashboard Insights</h2>

      {error && <p className="text-red-600">{error}</p>}

      {/* Distortion Frequency Bar Chart */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Distortion Trends Over Time</h3>
        {distortionData.length === 0 ? (
          <p className="text-gray-500">No distortion data yet. Start journaling!</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={distortionData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(distortionData[0])
                .filter((key) => key !== "date")
                .map((key, idx) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={`hsl(${(idx * 60) % 360}, 70%, 50%)`}
                    barSize={30}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Mood Tracker Line Chart */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Mood Over Time</h3>
        {moodData.length === 0 ? (
          <p className="text-gray-500">No mood data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={moodData}>
              <XAxis dataKey="date" />
              <YAxis domain={[1, 5]} tickCount={5} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#facc15"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
