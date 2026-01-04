import React, { useEffect, useRef, useState } from 'react';
import { Upload, Mic, Square, Send, FileText, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AudioStreamer from "../lib/audio-streamer";
import type { FormValues } from '@/types/form';
import { useForm, type SubmitHandler } from 'react-hook-form';
import SimilarityAnalysisDashboard from './SimilarityAnalysisDashboard';

const WEBSOCKET_URL = "ws://localhost:8000/ws";

const AudioRecorder: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [content, setContent] = useState<any>(null);
    const [fileName, setFileName] = useState<string>('');

    const streamer = useRef(new AudioStreamer(WEBSOCKET_URL));

    useEffect(() => {
        streamer.current.onMessage((m) => {
            setContent(JSON.parse(m.data));
        });

        streamer.current.onStateChange(() => {
            setIsRecording(streamer.current.isRecording);
        });
    }, []);

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        streamer.current.startStream({ doc: data.fileUpload[0] });
    };

    const stop = () => streamer.current.stopStreaming();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm<FormValues>();

    const fileWatch = watch('fileUpload');

    useEffect(() => {
        if (fileWatch && fileWatch[0]) {
            setFileName(fileWatch[0].name);
        }
    }, [fileWatch]);

    const transcriptText = content?.lines
        ?.filter((v: { speaker: any }) => v.speaker)
        .reduce((pv: string, c: { text: string }) => pv + c.text, "") || '';

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2 py-8">
                    <h1 className="text-5xl font-bold text-chart-1">
                        COGNIVOX
                    </h1>
                    <p className="text-muted-foreground text-lg">Advanced speech recognition and transcription platform for enhance public speaking skills</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Document Upload Section */}
                    <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-chart-1/50 transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-chart-1">
                                <FileText className="w-5 h-5" />
                                Transcripts Upload
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Upload transcripts for AI analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="relative">
                                    <label
                                        htmlFor="file"
                                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 border-muted-foreground/20 hover:border-chart-1 hover:bg-muted/50 transition-all duration-300 group"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-10 h-10 mb-3 text-muted-foreground group-hover:text-chart-1 transition-colors" />
                                            {fileName ? (
                                                <p className="text-sm text-chart-1 font-medium">{fileName}</p>
                                            ) : (
                                                <>
                                                    <p className="mb-2 text-sm text-muted-foreground">
                                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">PNG, JPEG or PDF (MAX. 10MB)</p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            id="file"
                                            type="file"
                                            className="hidden"
                                            {...register('fileUpload', {
                                                required: 'Please select a file',
                                                validate: {
                                                    lessThan10MB: (files) => files[0]?.size < 10000000 || 'Max 10MB',
                                                    acceptedFormats: (files) =>
                                                        ['text/plain', 'application/pdf'].includes(
                                                            files[0]?.type
                                                        ) || 'Only PDF or text files',
                                                },
                                            })}
                                        />
                                    </label>

                                    {errors.fileUpload && (
                                        <Alert className="mt-3 bg-destructive/10 border-destructive/20">
                                            <AlertDescription className="text-destructive text-sm">
                                                {errors.fileUpload.message}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                {/* <Button
                                    onClick={handleSubmit(onSubmit)}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Process Document
                                </Button> */}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Audio Streaming Section */}
                    <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-chart-2/50 transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-chart-2">
                                <Activity className="w-5 h-5" />
                                Live Audio Stream
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Real-time audio capture and transcription
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Status Indicator */}
                            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted/50">
                                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-destructive animate-pulse' : 'bg-muted-foreground'}`} />
                                <span className="text-sm font-medium text-muted-foreground">
                                    {isRecording ? 'Recording in Progress' : 'Ready to Record'}
                                </span>
                            </div>

                            {/* Control Buttons */}
                            <div className="space-y-3">
                                {isRecording ? <Button
                                    onClick={stop}
                                    className={'w-full font-semibold transition-all duration-300 bg-destructive hover:bg-destructive/90 text-destructive-foreground'}
                                >
                                    <Square className="w-4 h-4 mr-2" />
                                    Stop Recording

                                </Button> :

                                    <Button
                                        onClick={handleSubmit(onSubmit)}
                                        className={'w-full font-semibold transition-all duration-300 bg-chart-2 hover:bg-chart-2/90 text-primary-foreground'}
                                    >
                                        <>
                                            <Mic className="w-4 h-4 mr-2" />
                                            Start Recording
                                        </>
                                    </Button>}

                                <Button
                                    onClick={() => !isRecording && streamer.current.startTestStream()}
                                    disabled={isRecording}
                                    variant="outline"
                                    className="w-full border-border hover:border-chart-1 hover:bg-muted text-muted-foreground hover:text-chart-1 disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Test Stream
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground text-center pt-2">
                                Audio chunks are processed in real-time by the backend
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Transcription Results */}
                {content && (
                    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-chart-1">Transcription Results</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Real-time speech-to-text output
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Transcript Text */}
                            {transcriptText && (
                                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Full Transcript</h3>
                                    <p className="text-foreground leading-relaxed">{transcriptText}</p>
                                </div>
                            )}

                            {/* Individual Lines */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-muted-foreground">Detailed Lines</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {content.lines?.map((line: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="p-3 rounded bg-muted/30 border border-border/50 hover:border-chart-1/50 transition-colors"
                                        >
                                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                                                {JSON.stringify(line, null, 2)}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Raw Data */}
                            <details className="group">
                                <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-chart-1 transition-colors">
                                    View Raw Data
                                </summary>
                                <div className="mt-2 p-4 rounded-lg bg-card/50 border border-border">
                                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono overflow-x-auto">
                                        {JSON.stringify(content, null, 2)}
                                    </pre>
                                </div>
                            </details>
                        </CardContent>
                    </Card>
                )}
            </div>
            <SimilarityAnalysisDashboard data={
                {
                    "overall_similarity": 0.8160355687141418,
                    "structural_transcript": {
                        "sentence_count": 4,
                        "avg_sentence_length": 20.75,
                        "lexical_density": 0.9157
                    },
                    "structural_speech": {
                        "sentence_count": 4,
                        "avg_sentence_length": 24.5,
                        "lexical_density": 0.9592
                    },
                    "missing_points": [
                        "However, the retail sector, a secondary market for the company, saw a modest decline of 5% in year-over-year sales. (Sim=0.5986)",
                        "The 2024 annual report highlights strong growth in the technology division, specifically in ERP services. (Sim=0.6168)"
                    ],
                    "key_points_transcript": [
                        "The board is prioritizing the expansion of data centers in Asia next quarter to support the cloud growth.Future plans also include a major investment in AI research and development to maintain a competitive edge.",
                        "However, the retail sector, a secondary market for the company, saw a modest decline of 5% in year-over-year sales.",
                        "The 2024 annual report highlights strong growth in the technology division, specifically in ERP services."
                    ],
                    "key_points_speech": [
                        "A minor decrease in the secondary retail sales area was also noted, but this is not a core concern for the company.The firm is also looking at new AI R&D initiatives.",
                        "The company's recent report indicates remarkable progress in its tech wing, with significant revenue from cloud services.",
                        "To support this continuous expansion, the executive team is focused on deploying new data centers across Asia in the upcoming quarter."
                    ],
                    "alignment": [
                        {
                            "transcript_sentence": "The 2024 annual report highlights strong growth in the technology division, specifically in ERP services.",
                            "closest_speech_sentence": "The company's recent report indicates remarkable progress in its tech wing, with significant revenue from cloud services.",
                            "similarity": 0.6168366074562073,
                            "paraphrase_type": "Missing"
                        },
                        {
                            "transcript_sentence": "Revenue from cloud computing increased by 45% due to strategic partnerships and efficient infrastructure scaling.",
                            "closest_speech_sentence": "The company's recent report indicates remarkable progress in its tech wing, with significant revenue from cloud services.This surge is attributed to strategic partnerships and robust scaling of IT infrastructure.",
                            "similarity": 0.7189282178878784,
                            "paraphrase_type": "Strong Paraphrase"
                        },
                        {
                            "transcript_sentence": "However, the retail sector, a secondary market for the company, saw a modest decline of 5% in year-over-year sales.",
                            "closest_speech_sentence": "A minor decrease in the secondary retail sales area was also noted, but this is not a core concern for the company.The firm is also looking at new AI R&D initiatives.",
                            "similarity": 0.5986101627349854,
                            "paraphrase_type": "Missing"
                        },
                        {
                            "transcript_sentence": "The board is prioritizing the expansion of data centers in Asia next quarter to support the cloud growth.Future plans also include a major investment in AI research and development to maintain a competitive edge.",
                            "closest_speech_sentence": "To support this continuous expansion, the executive team is focused on deploying new data centers across Asia in the upcoming quarter.",
                            "similarity": 0.6555360555648804,
                            "paraphrase_type": "Strong Paraphrase"
                        }
                    ],
                    "order_analysis": {
                        "in_order_percentage": 50,
                        "out_of_order_percentage": 50
                    },
                    "redundant_speech_segments": [],
                    "sentence_count_transcript": 4,
                    "sentence_count_speech": 4
                }
            } />
        </div>
    );
};

export default AudioRecorder;