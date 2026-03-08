"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { AlertCircle, Heart, Zap, Mic } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  HeartRate,
  Segment,
  StressResponse,
  Timestamped,
} from "@/lib/types";
import type { RunningState } from "@/lib/session";


const RunningPage = ({ state }: { state: RunningState }) => {
  const [wordCount, setWordCount] = useState(0);
  const [currentStress, setCurrentStress] =
    useState<Timestamped<StressResponse> | null>(null);
  const [currentHeartRate, setCurrentHeartRate] =
    useState<Timestamped<HeartRate> | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [stuckSuggestion, setStuckSuggestion] = useState<string | null>(null);
  const [biometricChartData, setBiometricChartData] = useState<any[]>([]);
  const [stuckChartData, setStuckChartData] = useState<any[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Update stress data
  useEffect(() => {
    if (state.stress.length > 0) {
      setCurrentStress(state.stress[state.stress.length - 1]);
    }
  }, [state.stress]);

  // Update heart rate data
  useEffect(() => {
    if (state.heart_rate.length > 0) {
      setCurrentHeartRate(state.heart_rate[state.heart_rate.length - 1]);
    }
  }, [state.heart_rate]);

  // Update stuck status - track continuously
  useEffect(() => {
    if (state.stuck.length > 0) {
      // Always update with the latest stuck event
      const lastStuck = state.stuck[state.stuck.length - 1];

      if (lastStuck.data.type === "stuck") {
        setIsStuck(true);
        setStuckSuggestion(null);
      } else if (lastStuck.data.type === "unstuck") {
        setIsStuck(false);
        setStuckSuggestion(null);
      } else if (lastStuck.data.type === "stuck_suggestion") {
        setIsStuck(true);
        setStuckSuggestion(lastStuck.data.text);
      }
    }
  }, [state.stuck]);

  // Prepare biometric chart data
  useEffect(() => {
    const chartData = state.heart_rate.map((hr) => ({
      time: formatDateTimestamp(hr.timestamp),
      timeRange: `${hr.timestamp.getTime()}`,
      bvp_mean: parseFloat(hr.data.bvp_mean.toFixed(2)),
      bvp_std: parseFloat(hr.data.bvp_std.toFixed(2)),
      temp: hr.data.temp_mean ? parseFloat(hr.data.temp_mean.toFixed(1)) : null,
      eda: hr.data.eda_mean ? parseFloat(hr.data.eda_mean.toFixed(2)) : null,
    }));
    setBiometricChartData(chartData);
  }, [state.heart_rate]);

  // Prepare stuck behavior chart data
  useEffect(() => {
    const chartData = state.stuck
      .filter((s) => s.data.type != "stuck_suggestion")
      .map((s) => ({
        time: formatDateTimestamp(s.timestamp),
        timeValue: s.timestamp.getTime(),
        type: s.data.type,
        status: s.data.type === "stuck" ? 1 : 0,
      }));
    setStuckChartData(chartData);
  }, [state.stuck]);

  // Update word count
  useEffect(() => {
    const completedLines = state.asr.segments
      .filter((seg) => seg.type === "text")
      .reduce((count, seg) => {
        if (seg.type === "text") {
          return (
            count +
            seg.text.split(/\s+/).filter((word) => word.length > 0).length
          );
        }
        return count;
      }, 0);
    setWordCount(completedLines);
  }, [state.asr.segments]);

  const lines = state.asr.segments;

  // const formatTimestamp = (ts: Timestamp): string => {
  //   // Timestamp is { start: number; end: number }
  //   // Display raw values as user specified
  //   return ts.start + " - " + ts.end;
  // };

  // const getTimestampRange = (ts: Timestamp): string => {
  //   // Display raw values as user specified
  //   return ts.start + " - " + ts.end;
  // };

  const formatDateTimestamp = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStressColor = (
    score: number,
  ): { gradient: string; label: string } => {
    if (score < 0.3) {
      return { gradient: "url(#grad-green)", label: "Low" };
    }
    if (score < 0.6) {
      return { gradient: "url(#grad-yellow)", label: "Medium" };
    }
    return { gradient: "url(#grad-red)", label: "High" };
  };

  const getStressLabel = (score: number): string => {
    if (score < 0.3) return "Low";
    if (score < 0.6) return "Medium";
    return "High";
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const textItemVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const pulseVariants: Variants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* Header with Timer */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative"
            >
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg" />
              <Mic className="w-6 h-6 text-red-500 relative" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Speech Analysis
              </h1>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="flex items-center gap-8">
            {/* Word Count */}
            <motion.div
              className="flex items-center gap-2"
              variants={itemVariants}
            >
              <span className="text-sm font-semibold text-slate-600">
                {wordCount} <span className="text-slate-500">words</span>
              </span>
            </motion.div>

            {/* Recording Status */}
            <motion.div
              className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full"
              animate={{
                backgroundColor: [
                  "rgba(254, 242, 242, 1)",
                  "rgba(254, 226, 226, 1)",
                  "rgba(254, 242, 242, 1)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-red-600">
                RECORDING
              </span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
        {/* Left: Live Transcript */}
        <motion.div
          className="lg:col-span-2 flex flex-col min-h-full"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-1 rounded-full bg-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Live Transcript
            </h2>
            <span className="text-xs font-medium text-slate-500 ml-auto">
              {state.asr.type === "partial" ? "● Listening" : "● Complete"}
            </span>
          </div>

          {/* Stuck Alert - Continuously Display When Stuck */}
          {isStuck && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-4 p-4 bg-linear-to-r from-amber-50 to-red-50 border-2 border-amber-400 rounded-lg flex gap-3 shadow-md"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              </motion.div>
              <div className="flex-1">
                <motion.p
                  className="text-sm font-bold text-amber-900"
                  animate={{ opacity: [1, 0.8, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ⚠️ Speaker is Stuck - Provide Guidance
                </motion.p>
                {stuckSuggestion && (
                  <motion.p
                    className="text-sm text-amber-800 mt-2 font-semibold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    💡 Suggestion: {stuckSuggestion}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}

          {/* Transcript Content */}
          <div className="flex-1 overflow-y-auto pr-4 bg-white/40 rounded-xl p-6 border border-slate-200/50">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-xl md:text-2xl leading-relaxed md:leading-loose font-normal text-slate-800"
            >
              {lines.map((segment, idx) => (
                <motion.span
                  key={`${idx}-${segment.start}`}
                  variants={textItemVariants}
                >
                  {segment.type === "silence" ? (
                    <span
                      className="inline-flex items-center justify-center px-3 py-1 mx-2 align-middle bg-slate-200/60 rounded-full text-slate-500 text-sm font-medium border border-slate-300 shadow-sm"
                      title={`Silence • ${segment.start} - ${segment.end}`}
                    >
                      ... {Math.max(0, segment.end - segment.start).toFixed(1)}s
                    </span>
                  ) : (
                    <span className="transition-colors duration-300 text-slate-900">
                      {segment.text}
                      {segment.text && segment.unconfirmed_text && " "}
                      {segment.unconfirmed_text && (
                        <span className="text-slate-400">
                          {segment.unconfirmed_text}
                        </span>
                      )}
                      <span className="text-sm font-medium text-slate-400 opacity-60 mx-1 whitespace-nowrap">
                        [{segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s]
                      </span>
                      {" "}
                    </span>
                  )}
                </motion.span>
              ))}

              {/* Current Silence Indicator */}
              {state.asr.current_silence && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-flex items-center justify-center px-3 py-2 mx-2 align-middle bg-slate-200/40 rounded-full border border-slate-200 shadow-sm"
                >
                  <span className="flex gap-1.5 items-center">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 rounded-full bg-slate-400"
                        animate={{
                          opacity: [0.3, 1, 0.3],
                          scale: [0.8, 1, 0.8],
                        }}
                        transition={{
                          delay: i * 0.2,
                          duration: 1.5,
                          repeat: Infinity,
                        }}
                      />
                    ))}
                  </span>
                </motion.span>
              )}

              <div ref={transcriptEndRef} className="h-8" />
            </motion.div>
          </div>
        </motion.div>

        {/* Right: Real-time Metrics */}
        <motion.div
          className="lg:col-span-1 flex flex-col gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Stress Meter */}
          {currentStress && (
            <motion.div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                Stress Level
              </p>
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  className="relative w-24 h-24"
                  variants={pulseVariants}
                  animate="animate"
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - currentStress.data.stress_score)}`}
                      stroke={
                        getStressColor(currentStress.data.stress_score).gradient
                      }
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                      animate={{
                        strokeDashoffset: `${2 * Math.PI * 45 * (1 - currentStress.data.stress_score)}`,
                      }}
                      transition={{ duration: 0.8 }}
                    />
                    <defs>
                      <linearGradient
                        id="grad-green"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      <linearGradient
                        id="grad-yellow"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#facc15" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                      <linearGradient
                        id="grad-red"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">
                        {Math.round(currentStress.data.stress_score * 100)}
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {getStressLabel(currentStress.data.stress_score)}
                      </p>
                    </div>
                  </div>
                </motion.div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {currentStress.data.suggestion}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Heart Rate & Biometrics Charts */}
          {currentHeartRate && biometricChartData.length > 0 && (
            <motion.div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Biometrics Over Time
              </p>

              {/* BVP Chart */}
              <div className="mb-6">
                <p className="text-xs text-slate-600 font-medium mb-2">
                  BVP (Blood Volume Pulse)
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={biometricChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      stroke="#64748b"
                    />
                    <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) => value?.toFixed(2)}
                      labelFormatter={(label: any) => `Time: ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="bvp_mean"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      name="Mean"
                    />
                    <Line
                      type="monotone"
                      dataKey="bvp_std"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      name="Std Dev"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Additional Metrics Chart */}
              {biometricChartData.some(
                (d) => d.temp !== null || d.eda !== null,
              ) && (
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-2">
                      Temperature & EDA
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={biometricChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 10 }}
                          stroke="#64748b"
                        />
                        <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                          formatter={(value: any) => value?.toFixed(2)}
                          labelFormatter={(label: any) => `Time: ${label}`}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {biometricChartData.some((d) => d.temp !== null) && (
                          <Line
                            type="monotone"
                            dataKey="temp"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={true}
                            name="Temperature"
                          />
                        )}
                        {biometricChartData.some((d) => d.eda !== null) && (
                          <Line
                            type="monotone"
                            dataKey="eda"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={true}
                            name="EDA"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
            </motion.div>
          )}

          {/* Stuck Behavior Chart - Continuous Tracking */}
          {state.stuck.length > 0 && stuckChartData.length > 0 && (
            <motion.div
              className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Stuck Behavior Timeline ({state.stuck.length} events)
              </p>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stuckChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 9 }}
                    stroke="#64748b"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="#64748b"
                    domain={[0, 1]}
                    ticks={[0, 1]}
                    label={{
                      value: "Status",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 10 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-white border-2 border-slate-200 rounded">
                            <p className="text-xs font-semibold text-slate-900">
                              {data.time}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-1">
                              {data.timeValue}
                            </p>
                            <p className="text-xs text-slate-600 mt-2 font-semibold">
                              {data.type === "stuck"
                                ? "🔴 Stuck Detected"
                                : data.type === "stuck_suggestion"
                                  ? "⚠️ Suggestion"
                                  : "🟢 Recovered"}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="status"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Event Legend */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-400" />
                  <span className="text-slate-600 font-medium">Stuck</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-400" />
                  <span className="text-slate-600 font-medium">Suggestion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-400" />
                  <span className="text-slate-600 font-medium">Recovered</span>
                </div>
              </div>

              {/* All Events Timeline - Scrollable */}
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                <p className="text-xs font-semibold text-slate-600 mb-2 sticky top-0 bg-white">
                  All Events ({state.stuck.length} total)
                </p>
                <AnimatePresence mode="popLayout">
                  {state.stuck.map((stuck, idx) => (
                    <motion.div
                      key={`${idx}-${stuck.timestamp.getTime()}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className={`text-xs p-3 rounded-lg border-l-4 transition-all ${stuck.data.type === "stuck"
                        ? "bg-red-50 border-l-red-400 text-red-800"
                        : stuck.data.type === "stuck_suggestion"
                          ? "bg-amber-50 border-l-amber-400 text-amber-800"
                          : "bg-green-50 border-l-green-400 text-green-800"
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">
                            {stuck.data.type === "stuck"
                              ? "🔴 Stuck Detected"
                              : stuck.data.type === "unstuck"
                                ? "🟢 Recovered"
                                : "⚠️ Suggestion"}
                          </p>
                          <p className="text-xs opacity-75 mt-1 font-mono">
                            {formatDateTimestamp(stuck.timestamp)}
                          </p>
                        </div>
                      </div>
                      {stuck.data.type === "stuck_suggestion" && (
                        <motion.p
                          className="text-xs opacity-90 mt-2 p-2 bg-white/50 rounded font-semibold"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          {stuck.data.text}
                        </motion.p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RunningPage;
