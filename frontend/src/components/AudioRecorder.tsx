import React, { useEffect, useRef, useState } from 'react';
import { Upload, Mic, Square, FileText, Activity, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AudioStreamer from "../lib/audio-streamer";
import type { FormValues } from '@/types/form';
import { useForm, type SubmitHandler } from 'react-hook-form';
import SimilarityAnalysisDashboard from './SimilarityAnalysisDashboard';
import SpeechAnalysisDashboard from './SpeechAnalysisDashboard';
import { toast } from "sonner"

const WEBSOCKET_URL = "ws://localhost:8000/ws";

const AudioRecorder: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [content, setContent] = useState<any>(null);
    const [fileName, setFileName] = useState<string>('');
    const [results, setResults] = useState<any>({});
    const [stuck, setStuck] = useState<any>(null)

    const streamer = useRef(new AudioStreamer(WEBSOCKET_URL));

    useEffect(() => {
        streamer.current.onMessage((m) => {
            setContent(m);
            console.log("msg", m)
        });

        streamer.current.onTranscript((d) => {
            console.log("transcript", d)
            setResults({ ...results, transcript: d.data })
        });

        streamer.current.onSpeechScore((d) => {
            console.log("score", d)
            setResults({ ...results, score: d.data })
        });

        streamer.current.onStuck((d) => {
            console.log("stuck", d)
            const is_stuck = d.type === "stuck_detection";
            if (is_stuck) {
                if (stuck) {
                    toast.dismiss(stuck)
                }
                let id = toast.info("Speech stuck Detected", { duration: 1000000, dismissible: false });
                setStuck(id);
            } else if (stuck) {
                toast.dismiss(stuck)
            }
        });


        streamer.current.onStateChange(() => {
            setIsRecording(streamer.current.isRecording);
            if (stuck) {
                toast.dismiss(stuck)
            }
            setStuck(null)

        });
    }, [streamer.current, stuck, setStuck, results, setResults, setIsRecording]);

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        streamer.current.startStream({ doc: data.fileUpload[0] });
        setResults({})
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

    const transcriptText = content?.full_text ?? '';

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
                                    {content.lines?.filter((v: any) => !!v.text).map((line: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="p-3 rounded bg-muted/30 border border-border/50 hover:border-chart-1/50 transition-colors"
                                        >
                                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                                                {line.text}
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

            {!!results.transcript && <SimilarityAnalysisDashboard data={results.transcript} />}
            {!!results.score && <SpeechAnalysisDashboard data={results.score} />}
        </div>
    );
};

export default AudioRecorder;