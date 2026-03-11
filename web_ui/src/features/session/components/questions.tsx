'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Mic, HelpCircle, Heart, Brain, CheckCircle, Target } from 'lucide-react';
import type { QuestionState } from '@/lib/session';

const QuestionPage = ({ state }: { state: QuestionState }) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.current_asr?.full_text]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const formatDateTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Prepare chart data
  const stressChartData = state.stress.map((s) => ({
    time: formatDateTimestamp(s.timestamp),
    stress: Math.round(s.data.stress_score * 100),
  }));

  const heartRateChartData = state.heart_rate.map((hr) => ({
    time: formatDateTimestamp(hr.timestamp),
    bvp_mean: parseFloat(hr.data.bvp_mean.toFixed(2)),
  }));

  const currentQuestionIndex = state.questions.findIndex(
    (q) => q.question === state.current_question
  );
  const totalQuestions = state.questions.length;
  const questionsAnswered = currentQuestionIndex + 1;
  const progressPercent = totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0;

  const currentStress = state.stress.length > 0 ? state.stress[state.stress.length - 1] : null;
  const currentHeartRate = state.heart_rate.length > 0 ? state.heart_rate[state.heart_rate.length - 1] : null;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* Header with Progress */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <HelpCircle className="w-6 h-6 text-blue-600" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Question & Answer Session</h1>
                <p className="text-slate-600 mt-1">Real-time analysis of responses</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Progress: {questionsAnswered}/{totalQuestions}
                </span>
                <span className="text-sm font-bold text-blue-600">{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-sm">
                <motion.div
                  className="h-full bg-linear-to-r from-blue-500 to-indigo-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column: Current Question & Answer */}
          <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
            {/* Current Question Card */}
            {state.current_question ? (
              <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Current Question</p>
                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                  <p className="text-lg font-semibold text-slate-900 leading-relaxed">
                    {state.current_question}
                  </p>
                </div>

                {/* Live Transcription */}
                <div className="mt-6">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-red-600" />
                    Live Transcription
                  </p>
                  <div className="bg-white rounded-lg p-4 border-2 border-slate-200 min-h-24 max-h-64 overflow-y-auto space-y-2">
                    {state.current_asr?.full_text ? (
                      <>
                        <p className="text-sm text-slate-900 leading-relaxed">
                          {state.current_asr.full_text}
                        </p>
                        {state.current_asr.type === 'partial' && (
                          <motion.p
                            className="text-xs text-slate-500"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            Listening...
                          </motion.p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Waiting for speech...</p>
                    )}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-linear-to-br from-slate-50 to-slate-100 rounded-xl p-8 border-2 border-slate-300 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-bold text-slate-900">All Questions Complete</p>
                <p className="text-slate-600 mt-2">Session finished successfully</p>
              </div>
            )}
            
          </motion.div>

          {/* Right Column: Metrics */}
          <motion.div className="space-y-6" variants={itemVariants}>
            {/* Stress Level */}
            {currentStress && (
              <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Stress Level</p>
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    className="relative w-20 h-20"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - currentStress.data.stress_score)}`}
                        stroke={currentStress.data.stress_score < 0.5 ? '#10b981' : currentStress.data.stress_score < 0.8 ? '#f59e0b' : '#ef4444'}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                        animate={{ strokeDashoffset: `${2 * Math.PI * 45 * (1 - currentStress.data.stress_score)}` }}
                        transition={{ duration: 0.8 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xl font-bold text-slate-900">
                        {Math.round(currentStress.data.stress_score * 100)}%
                      </p>
                    </div>
                  </motion.div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">Level</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {currentStress.data.stress_score < 0.3
                        ? 'Low'
                        : currentStress.data.stress_score < 0.6
                          ? 'Moderate'
                          : 'High'}
                    </p>
                    <p className="text-xs text-slate-600 mt-2">Feedback:</p>
                    <p className="text-xs text-slate-700 font-medium line-clamp-2">
                      {currentStress.data.feedback}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Heart Rate */}
            {currentHeartRate && (
              <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Heart Rate
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 font-medium">BVP Mean</span>
                    <span className="text-2xl font-bold text-slate-900">{currentHeartRate.data.bvp_mean.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 font-medium">Std Dev</span>
                    <span className="text-lg font-bold text-slate-900">{currentHeartRate.data.bvp_std.toFixed(1)}</span>
                  </div>
                  {currentHeartRate.data.temp_mean && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 font-medium">Temperature</span>
                      <span className="text-lg font-bold text-slate-900">{currentHeartRate.data.temp_mean.toFixed(1)}°</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Indicators */}
            <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <motion.span
                    className="w-2.5 h-2.5 rounded-full bg-red-500"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-xs text-slate-700 font-medium">Recording</span>
                </div>
                <div className="flex items-center gap-2">
                  {state.current_asr ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      <span className="text-xs text-slate-700 font-medium">Listening</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="text-xs text-slate-700 font-medium">Waiting</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Questions List */}
        <motion.div
          variants={itemVariants}
          className="mt-8 bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm"
        >
          <p className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            All Questions ({totalQuestions})
          </p>
          <div className="space-y-3">
            {state.questions.map((q, idx) => (
              <motion.div
                key={idx}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${idx === currentQuestionIndex
                    ? 'bg-blue-50 border-blue-300 shadow-md'
                    : idx < currentQuestionIndex
                      ? 'bg-green-50 border-green-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${idx < currentQuestionIndex
                          ? 'bg-green-200 text-green-800'
                          : idx === currentQuestionIndex
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}>
                        Q{idx + 1}
                      </span>
                      {idx < currentQuestionIndex && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {idx === currentQuestionIndex && <Mic className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{q.question}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedQuestion === idx ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-slate-600"
                  >
                    ▼
                  </motion.div>
                </div>

                {/* Expanded Answer */}
                <AnimatePresence>
                  {expandedQuestion === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-300"
                    >
                      <p className="text-xs font-bold text-slate-700 mb-2">Response:</p>
                      <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded border border-slate-300">
                        {q.asr.full_text || 'No response recorded'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Metrics Charts */}
        {(stressChartData.length > 0 || heartRateChartData.length > 0) && (
          <motion.div
            variants={itemVariants}
            className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Stress Timeline */}
            {stressChartData.length > 0 && (
              <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Stress Level Timeline
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stressChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="#64748b" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" />
                    <Tooltip formatter={(value: any) => `${value}%`} />
                    <Line type="monotone" dataKey="stress" stroke="#a855f7" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Heart Rate Timeline */}
            {heartRateChartData.length > 0 && (
              <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  Heart Rate Timeline
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={heartRateChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
                    <Tooltip formatter={(value: any) => value.toFixed(1)} />
                    <Line type="monotone" dataKey="bvp_mean" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuestionPage;