import { z } from 'zod';

// Define the types based on our schema
export interface SolutionMetadata {
    completeSolution: {
        steps: string[];
        estimatedTime: string;
        criticalClues: string[];
    };
    alternativePaths: {
        description: string;
        clues: string[];
        estimatedTime: string;
    }[];
    timeline: {
        murderTime: string;
        bodyDiscovery: string;
        eventSequence: string[];
    };
    difficultyRating: 'easy' | 'medium' | 'hard';
    redHerrings: {
        element: string;
        purpose: string;
    }[];
}

export interface GeneratedMystery {
    title: string;
    intro: string;
    victim: any;
    characters: any[];
    physicalClues: any[];
    clues: any[];
    solutionMetadata: SolutionMetadata;
}

export interface ValidationResult {
    isValid: boolean;
    issues: string[];
    score: number; // 0-100
    estimatedDurationMinutes: number;
}

export function validateMysteryCoherence(mystery: GeneratedMystery): ValidationResult {
    const issues: string[] = [];
    let score = 100;

    // 1. Check Solution Existence
    if (!mystery.solutionMetadata?.completeSolution?.steps?.length) {
        issues.push("No solution steps provided");
        score -= 50;
    }

    // 2. Check Timeline Consistency
    const timeline = mystery.solutionMetadata?.timeline;
    if (!timeline?.murderTime) {
        issues.push("No murder time specified");
        score -= 20;
    }

    // 3. Check Clue Sufficiency
    const totalClues = (mystery.physicalClues?.length || 0) + (mystery.clues?.length || 0);
    if (totalClues < 5) {
        issues.push("Too few clues generated (minimum 5 total)");
        score -= 20;
    }

    // 4. Check Character Roles
    const murdererCount = mystery.characters.filter(c => c.isMurderer).length;
    if (murdererCount !== 1) {
        issues.push(`Invalid murderer count: ${murdererCount} (must be exactly 1)`);
        score -= 50;
    }

    // 5. Check Critical Clues Existence
    const criticalClues = mystery.solutionMetadata?.completeSolution?.criticalClues || [];
    // Ideally we'd check if these IDs exist, but for now we just check if they are listed
    if (criticalClues.length === 0) {
        issues.push("No critical clues identified for solution");
        score -= 10;
    }

    // Calculate estimated duration
    // Base: 30 mins + 5 mins per clue + 10 mins per player
    const baseTime = 30;
    const clueTime = totalClues * 5;
    const playerTime = mystery.characters.length * 5;
    const estimatedDuration = baseTime + clueTime + playerTime;

    return {
        isValid: issues.length === 0,
        issues,
        score: Math.max(0, score),
        estimatedDurationMinutes: estimatedDuration
    };
}
