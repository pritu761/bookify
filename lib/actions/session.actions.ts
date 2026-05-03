'use server';

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";
import Book from "@/database/models/book.model";
import { serializeData } from "@/lib/utils";
import { getPlanLimits } from "@/lib/subscription.server";
import { getCurrentBillingPeriodStart } from "@/lib/subscription-constants";
import { SessionCheckResult, StartSessionResult, EndSessionResult } from "@/types";

export const checkSession = async (bookId: string): Promise<SessionCheckResult> => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { allowed: false, currentCount: 0, limit: 0, plan: 'free', maxDurationMinutes: 0, error: 'Unauthorized' };
        }

        await connectToDatabase();

        const limits = await getPlanLimits();
        const billingPeriodStart = getCurrentBillingPeriodStart();

        const sessionCount = await VoiceSession.countDocuments({
            clerkId: userId,
            billingPeriodStart: { $gte: billingPeriodStart },
        });

        const allowed = sessionCount < limits.maxSessionsPerMonth;

        return {
            allowed,
            currentCount: sessionCount,
            limit: limits.maxSessionsPerMonth,
            plan: 'free',
            maxDurationMinutes: limits.maxDurationPerSession,
        };
    } catch (e) {
        console.error('Error checking session', e);
        return { allowed: false, currentCount: 0, limit: 0, plan: 'free', maxDurationMinutes: 0, error: 'Error checking session limits' };
    }
};

export const startSession = async (bookId: string): Promise<StartSessionResult> => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: 'Unauthorized', isBillingError: false };
        }

        await connectToDatabase();

        // Verify the book belongs to this user
        const book = await Book.findOne({ _id: bookId, clerkId: userId }).lean();
        if (!book) {
            return { success: false, error: 'Book not found', isBillingError: false };
        }

        const limits = await getPlanLimits();
        const billingPeriodStart = getCurrentBillingPeriodStart();

        const sessionCount = await VoiceSession.countDocuments({
            clerkId: userId,
            billingPeriodStart: { $gte: billingPeriodStart },
        });

        if (sessionCount >= limits.maxSessionsPerMonth) {
            return {
                success: false,
                error: `You have reached your monthly session limit (${limits.maxSessionsPerMonth}). Upgrade your plan to continue.`,
                isBillingError: true,
            };
        }

        const session = await VoiceSession.create({
            clerkId: userId,
            bookId,
            startedAt: new Date(),
            durationSeconds: 0,
            billingPeriodStart,
        });

        return {
            success: true,
            sessionId: String(session._id),
            maxDurationMinutes: limits.maxDurationPerSession,
        };
    } catch (e) {
        console.error('Error starting session', e);
        return { success: false, error: 'Failed to start session', isBillingError: false };
    }
};

export const endSession = async (sessionId: string, durationSeconds: number): Promise<EndSessionResult> => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectToDatabase();

        await VoiceSession.findOneAndUpdate(
            { _id: sessionId, clerkId: userId },
            { endedAt: new Date(), durationSeconds },
        );

        return { success: true };
    } catch (e) {
        console.error('Error ending session', e);
        return { success: false, error: 'Failed to end session' };
    }
};

export const getSessionHistory = async () => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectToDatabase();

        const sessions = await VoiceSession.find({ clerkId: userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return { success: true, data: serializeData(sessions) };
    } catch (e) {
        console.error('Error fetching session history', e);
        return { success: false, error: 'Failed to fetch session history' };
    }
};
