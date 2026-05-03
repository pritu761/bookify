'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';
import { IBook, Messages } from '@/types';
import { ASSISTANT_ID } from '@/lib/constants';
import { startSession, endSession } from '@/lib/actions/session.actions';

type CallStatus = 'idle' | 'connecting' | 'starting' | 'listening' | 'thinking' | 'speaking';

interface UseVapiReturn {
    status: CallStatus;
    isActive: boolean;
    messages: Messages[];
    currentMessage: string;
    currentUserMessage: string;
    duration: number;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    clearError: () => void;
    limitError: string | null;
    isBillingError: boolean;
    maxDurationSeconds: number;
}

const vapiInstance = typeof window !== 'undefined'
    ? new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!)
    : null;

export default function useVapi(book: IBook): UseVapiReturn {
    const [status, setStatus] = useState<CallStatus>('idle');
    const [isActive, setIsActive] = useState(false);
    const [messages, setMessages] = useState<Messages[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const [duration, setDuration] = useState(0);
    const [limitError, setLimitError] = useState<string | null>(null);
    const [isBillingError, setIsBillingError] = useState(false);
    const [maxDurationSeconds, setMaxDurationSeconds] = useState(300); // default 5 min

    const sessionIdRef = useRef<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const durationRef = useRef(0);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback((maxSeconds: number) => {
        durationRef.current = 0;
        setDuration(0);
        timerRef.current = setInterval(() => {
            durationRef.current += 1;
            setDuration(durationRef.current);

            if (durationRef.current >= maxSeconds) {
                stop();
            }
        }, 1000);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const stop = useCallback(async () => {
        stopTimer();

        if (vapiInstance) {
            await vapiInstance.stop();
        }

        if (sessionIdRef.current) {
            await endSession(sessionIdRef.current, durationRef.current);
            sessionIdRef.current = null;
        }

        setIsActive(false);
        setStatus('idle');
        setCurrentMessage('');
        setCurrentUserMessage('');
    }, [stopTimer]);

    const start = useCallback(async () => {
        if (isActive || !vapiInstance) return;

        setStatus('connecting');
        setMessages([]);
        setCurrentMessage('');
        setCurrentUserMessage('');

        const sessionResult = await startSession(book._id);
        if (!sessionResult.success) {
            setLimitError(sessionResult.error ?? 'Unable to start session');
            setIsBillingError(sessionResult.isBillingError ?? false);
            setStatus('idle');
            return;
        }

        sessionIdRef.current = sessionResult.sessionId ?? null;
        const maxSecs = (sessionResult.maxDurationMinutes ?? 5) * 60;
        setMaxDurationSeconds(maxSecs);

        try {
            setStatus('starting');
            await vapiInstance.start(ASSISTANT_ID, {
                variableValues: {
                    bookId: book._id,
                    bookTitle: book.title,
                    bookAuthor: book.author,
                },
            });
        } catch (err) {
            console.error('Vapi start error:', err);
            setLimitError('Failed to connect to voice assistant. Please try again.');
            setIsBillingError(false);
            setStatus('idle');
            if (sessionIdRef.current) {
                await endSession(sessionIdRef.current, 0);
                sessionIdRef.current = null;
            }
        }
    }, [book, isActive]);

    const clearError = useCallback(() => {
        setLimitError(null);
        setIsBillingError(false);
    }, []);

    useEffect(() => {
        if (!vapiInstance) return;

        const onCallStart = () => {
            setIsActive(true);
            setStatus('listening');
            const maxSecs = maxDurationSeconds;
            startTimer(maxSecs);
        };

        const onCallEnd = async () => {
            stopTimer();
            if (sessionIdRef.current) {
                await endSession(sessionIdRef.current, durationRef.current);
                sessionIdRef.current = null;
            }
            setIsActive(false);
            setStatus('idle');
            setCurrentMessage('');
            setCurrentUserMessage('');
        };

        const onMessage = (msg: { type: string; transcriptType?: string; role?: string; transcript?: string; content?: string }) => {
            if (msg.type === 'transcript') {
                const role = msg.role ?? 'assistant';
                const text = msg.transcript ?? '';

                if (msg.transcriptType === 'final' && text) {
                    setMessages((prev) => [...prev, { role, content: text }]);
                    if (role === 'assistant') {
                        setCurrentMessage('');
                    } else {
                        setCurrentUserMessage('');
                    }
                } else if (msg.transcriptType === 'partial') {
                    if (role === 'assistant') {
                        setCurrentMessage(text);
                        setStatus('speaking');
                    } else {
                        setCurrentUserMessage(text);
                        setStatus('listening');
                    }
                }
            } else if (msg.type === 'speech-update') {
                setStatus('thinking');
            }
        };

        const onSpeechStart = () => setStatus('speaking');
        const onSpeechEnd = () => setStatus('listening');

        vapiInstance.on('call-start', onCallStart);
        vapiInstance.on('call-end', onCallEnd);
        vapiInstance.on('message', onMessage);
        vapiInstance.on('speech-start', onSpeechStart);
        vapiInstance.on('speech-end', onSpeechEnd);

        return () => {
            vapiInstance.off('call-start', onCallStart);
            vapiInstance.off('call-end', onCallEnd);
            vapiInstance.off('message', onMessage);
            vapiInstance.off('speech-start', onSpeechStart);
            vapiInstance.off('speech-end', onSpeechEnd);
        };
    }, [maxDurationSeconds, startTimer, stopTimer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTimer();
            if (vapiInstance && isActive) {
                vapiInstance.stop();
            }
        };
    }, [isActive, stopTimer]);

    return {
        status,
        isActive,
        messages,
        currentMessage,
        currentUserMessage,
        duration,
        start,
        stop,
        clearError,
        limitError,
        isBillingError,
        maxDurationSeconds,
    };
}
