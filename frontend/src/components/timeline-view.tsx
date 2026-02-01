import { motion } from "framer-motion";
import { Calendar, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

interface TimelineItem {
    university_name: string;
    program_name: string;
    deadline_date: string;
    deadline_display: string;
    days_left: number;
    status: "SAFE" | "WARNING" | "URGENT";
    logo: string;
}

export function TimelineView() {
    const [items, setItems] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTimeline();
    }, []);

    const fetchTimeline = async () => {
        try {
            const token = localStorage.getItem("token");
            console.log("Fetching timeline...", token ? "Token present" : "No token");
            const res = await axios.get("/api/dashboard/timeline", {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Timeline data:", res.data);
            setItems(res.data);
        } catch (error) {
            console.error("Failed to fetch timeline", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />;

    if (items.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 mb-4">
                <p className="text-sm text-gray-500 dark:text-slate-400 text-center">No upcoming deadlines found for your locked universities.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Application Timeline</h2>
                <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Fall 2025
                </span>
            </div>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative"
                    >
                        {/* Connector Line */}
                        {index !== items.length - 1 && (
                            <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-gray-100 dark:bg-slate-800 group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-colors" />
                        )}

                        <div className="flex items-start gap-4">
                            {/* Status Icon */}
                            <div className={`
                relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm
                transition-colors duration-300
                ${item.status === "URGENT" ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                                    item.status === "WARNING" ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400" :
                                        "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"}
              `}>
                                <Clock className="w-5 h-5" />
                            </div>

                            {/* Content Card */}
                            <div className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.university_name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">{item.program_name}</p>
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-slate-500">
                                            <span>Deadline: {item.deadline_display}</span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className={`block text-2xl font-bold font-mono tracking-tight
                        ${item.status === "URGENT" ? "text-red-600 dark:text-red-400" :
                                                item.status === "WARNING" ? "text-yellow-600 dark:text-yellow-400" :
                                                    "text-green-600 dark:text-green-400"}
                    `}>
                                            {item.days_left}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Days Left</span>
                                    </div>
                                </div>

                                {/* Progress Bar Visual */}
                                <div className="mt-3 h-1.5 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(5, Math.min(100, 100 - (item.days_left / 180) * 100))}%` }}
                                        className={`h-full rounded-full ${item.status === "URGENT" ? "bg-red-500" :
                                            item.status === "WARNING" ? "bg-yellow-500" :
                                                "bg-green-500"
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
