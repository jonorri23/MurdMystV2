import { GeneratedMystery } from './solution-validator';

export interface DurationEstimate {
    minimumTime: number; // minutes
    typicalTime: number;
    maximumTime: number;
    breakdown: {
        introAndRoleReading: number;
        clueDiscovery: number;
        investigation: number;
        accusationAndReveal: number;
    };
    factors: string[];
}

export function estimateGameDuration(mystery: GeneratedMystery, playerCount: number): DurationEstimate {
    // Base times
    const introTime = 10; // Every game needs ~10min intro
    const roleReadingTime = playerCount * 2; // ~2min per player to read their role

    // Clue discovery timing (depends on difficulty and type)
    const avgPhysicalClueTime = 5; // Players need ~5min per physical clue (finding + reading)
    const avgDigitalClueTime = 2; // Digital clues are faster

    const physicalClueCount = mystery.physicalClues?.length || 0;
    const digitalClueCount = mystery.clues?.length || 0;

    const physicalClueTime = physicalClueCount * avgPhysicalClueTime;
    const digitalClueTime = digitalClueCount * avgDigitalClueTime;

    // Investigation time (discussion, deduction)
    const baseInvestigationTime = 15;
    const difficulty = mystery.solutionMetadata?.difficultyRating || 'medium';

    const complexityMultiplier = difficulty === 'hard' ? 1.5 :
        difficulty === 'medium' ? 1.2 : 1.0;

    // Investigation scales with player count (more people = more talking)
    const investigationTime = baseInvestigationTime * complexityMultiplier * (Math.max(playerCount, 4) / 4);

    // Reveal time
    const revealTime = 10;

    const typicalTime = introTime + roleReadingTime + physicalClueTime + digitalClueTime + investigationTime + revealTime;

    return {
        minimumTime: Math.round(typicalTime * 0.7), // Fast players
        typicalTime: Math.round(typicalTime),
        maximumTime: Math.round(typicalTime * 1.5), // Thorough players
        breakdown: {
            introAndRoleReading: Math.round(introTime + roleReadingTime),
            clueDiscovery: Math.round(physicalClueTime + digitalClueTime),
            investigation: Math.round(investigationTime),
            accusationAndReveal: revealTime
        },
        factors: [
            `${playerCount} players`,
            `${physicalClueCount} physical clues`,
            `${digitalClueCount} digital clues`,
            `Difficulty: ${difficulty}`
        ]
    };
}
