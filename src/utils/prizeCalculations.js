// =================================
// PRIZE CALCULATIONS - FRONTEND UTILITIES
// =================================

/**
 * Lottery prize configuration (mirrors backend config)
 */
export const LOTTERY_CONFIG = {
    ticketPrice: 1, // USDT

    // Revenue distribution (BPS)
    revenueDistribution: {
        jackpotBps: 4000,      // 40%
        prizepoolBps: 4000,    // 40%
        operatorBps: 1500,     // 15%
        reserveBps: 500        // 5%
    },

    // Jackpot
    jackpot: {
        cap: 1000000,          // $1M
        minStart: 10000        // $10K
    },

    // Category distribution (BPS out of prize pool)
    categoryDistribution: {
        2: 3000,   // 30%
        3: 2000,   // 20%
        4: 1500,   // 15%
        5: 1200,   // 12%
        6: 1000,   // 10%
        7: 800,    // 8%
        8: 500     // 5%
    },

    // Minimum guaranteed prizes
    minimumPrizes: {
        1: 'jackpot',
        2: 100000,
        3: 10000,
        4: 1000,
        5: 100,
        6: 50,
        7: 10,
        8: 5
    }
};

/**
 * Prize categories info
 */
export const PRIZE_CATEGORIES = [
    {
        category: 1,
        matches: 6,
        keyMatch: true,
        name: '6 + Clave',
        nameEn: '6 + Key',
        description: 'Jackpot',
        color: 'gold',
        icon: 'trophy'
    },
    {
        category: 2,
        matches: 6,
        keyMatch: false,
        name: '6 Aciertos',
        nameEn: '6 Matches',
        description: '$100,000 garantizado',
        color: 'purple'
    },
    {
        category: 3,
        matches: 5,
        keyMatch: true,
        name: '5 + Clave',
        nameEn: '5 + Key',
        description: '$10,000 garantizado',
        color: 'blue'
    },
    {
        category: 4,
        matches: 5,
        keyMatch: false,
        name: '5 Aciertos',
        nameEn: '5 Matches',
        description: '$1,000 garantizado',
        color: 'teal'
    },
    {
        category: 5,
        matches: 4,
        keyMatch: true,
        name: '4 + Clave',
        nameEn: '4 + Key',
        description: '$100 garantizado',
        color: 'green'
    },
    {
        category: 6,
        matches: 4,
        keyMatch: false,
        name: '4 Aciertos',
        nameEn: '4 Matches',
        description: '$50 garantizado',
        color: 'lime'
    },
    {
        category: 7,
        matches: 3,
        keyMatch: true,
        name: '3 + Clave',
        nameEn: '3 + Key',
        description: '$10 garantizado',
        color: 'orange'
    },
    {
        category: 8,
        matches: 3,
        keyMatch: false,
        name: '3 Aciertos',
        nameEn: '3 Matches',
        description: '$5 garantizado',
        color: 'yellow'
    }
];

// =================================
// CALCULATION HELPERS
// =================================

/**
 * Convert BPS to percentage
 */
export function bpsToPercent(bps) {
    return bps / 100;
}

/**
 * Calculate amount from BPS
 */
export function calculateFromBps(amount, bps) {
    return (amount * bps) / 10000;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Format large numbers with abbreviations
 */
export function formatLargeNumber(num) {
    if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}K`;
    }
    return formatCurrency(num);
}

/**
 * Get category info by number
 */
export function getCategoryInfo(category) {
    return PRIZE_CATEGORIES.find(c => c.category === category);
}

/**
 * Get category color class
 */
export function getCategoryColorClass(category) {
    const info = getCategoryInfo(category);
    return info ? `category-${info.color}` : 'category-gray';
}

// =================================
// PRIZE ESTIMATIONS
// =================================

/**
 * Estimate prizes based on ticket sales
 */
export function estimatePrizes(ticketCount, currentJackpot) {
    const totalSales = ticketCount * LOTTERY_CONFIG.ticketPrice;
    const { revenueDistribution, categoryDistribution, minimumPrizes } = LOTTERY_CONFIG;

    // Calculate pools
    const jackpotContribution = calculateFromBps(totalSales, revenueDistribution.jackpotBps);
    const prizePool = calculateFromBps(totalSales, revenueDistribution.prizepoolBps);

    // New jackpot amount (capped)
    let newJackpot = currentJackpot + jackpotContribution;
    let jackpotOverflow = 0;
    if (newJackpot > LOTTERY_CONFIG.jackpot.cap) {
        jackpotOverflow = newJackpot - LOTTERY_CONFIG.jackpot.cap;
        newJackpot = LOTTERY_CONFIG.jackpot.cap;
    }

    // Adjusted prize pool
    const adjustedPrizePool = prizePool + jackpotOverflow;

    // Calculate estimated prizes by category
    const estimates = PRIZE_CATEGORIES.map(cat => {
        if (cat.category === 1) {
            return {
                ...cat,
                estimatedPrize: newJackpot,
                poolShare: null,
                isJackpot: true
            };
        }

        const poolShareBps = categoryDistribution[cat.category];
        const poolShare = calculateFromBps(adjustedPrizePool, poolShareBps);
        const minPrize = minimumPrizes[cat.category];
        const estimatedPrize = Math.max(poolShare, minPrize);

        return {
            ...cat,
            estimatedPrize,
            poolShare,
            minPrize,
            isGuaranteedMin: poolShare < minPrize,
            poolSharePercent: bpsToPercent(poolShareBps)
        };
    });

    return {
        ticketCount,
        totalSales,
        jackpot: {
            current: currentJackpot,
            contribution: jackpotContribution,
            new: newJackpot,
            overflow: jackpotOverflow,
            isCapped: newJackpot >= LOTTERY_CONFIG.jackpot.cap
        },
        prizePool: {
            base: prizePool,
            adjusted: adjustedPrizePool
        },
        categories: estimates
    };
}

/**
 * Calculate revenue breakdown for display
 */
export function calculateRevenueBreakdown(ticketCount) {
    const totalSales = ticketCount * LOTTERY_CONFIG.ticketPrice;
    const { revenueDistribution } = LOTTERY_CONFIG;

    return {
        totalSales,
        breakdown: [
            {
                name: 'Jackpot',
                nameEs: 'Pozo Acumulado',
                amount: calculateFromBps(totalSales, revenueDistribution.jackpotBps),
                percent: bpsToPercent(revenueDistribution.jackpotBps),
                color: 'gold'
            },
            {
                name: 'Prize Pool',
                nameEs: 'Premios',
                amount: calculateFromBps(totalSales, revenueDistribution.prizepoolBps),
                percent: bpsToPercent(revenueDistribution.prizepoolBps),
                color: 'green'
            },
            {
                name: 'Operations',
                nameEs: 'Operaciones',
                amount: calculateFromBps(totalSales, revenueDistribution.operatorBps),
                percent: bpsToPercent(revenueDistribution.operatorBps),
                color: 'blue'
            },
            {
                name: 'Reserve',
                nameEs: 'Reserva',
                amount: calculateFromBps(totalSales, revenueDistribution.reserveBps),
                percent: bpsToPercent(revenueDistribution.reserveBps),
                color: 'gray'
            }
        ]
    };
}

/**
 * Calculate probability of winning each category
 * (Approximate odds for 6/49 + 1/10 key)
 */
export function getWinningOdds() {
    // Combinations C(49,6) = 13,983,816
    // With key number 0-9: 13,983,816 * 10 = 139,838,160
    const totalCombinations = 139838160;

    return PRIZE_CATEGORIES.map(cat => {
        let combinations;

        switch (cat.category) {
            case 1: // 6 + key: 1 combination
                combinations = 1;
                break;
            case 2: // 6 without key: 9 combinations (any other key)
                combinations = 9;
                break;
            case 3: // 5 + key: C(6,5) * C(43,1) * 1 = 258
                combinations = 258;
                break;
            case 4: // 5 without key: 258 * 9 = 2,322
                combinations = 2322;
                break;
            case 5: // 4 + key: C(6,4) * C(43,2) * 1 = 13,545
                combinations = 13545;
                break;
            case 6: // 4 without key: 13,545 * 9 = 121,905
                combinations = 121905;
                break;
            case 7: // 3 + key: C(6,3) * C(43,3) * 1 = 246,820
                combinations = 246820;
                break;
            case 8: // 3 without key: 246,820 * 9 = 2,221,380
                combinations = 2221380;
                break;
            default:
                combinations = 0;
        }

        const probability = combinations / totalCombinations;
        const odds = Math.round(1 / probability);

        return {
            ...cat,
            combinations,
            probability,
            odds: `1 in ${odds.toLocaleString()}`,
            oddsNumber: odds
        };
    });
}

// =================================
// BOLITA CALCULATIONS
// =================================

export const BOLITA_MULTIPLIERS = {
    fijos: { multiplier: 80, maxPayout: 80000 },
    centenas: { multiplier: 500, maxPayout: 100000 },
    parles: { multiplier: 900, maxPayout: 100000 }
};

/**
 * Calculate potential payout for La Bolita bet
 */
export function calculateBolitaPayout(gameType, betAmount) {
    const config = BOLITA_MULTIPLIERS[gameType];
    if (!config) return null;

    const rawPayout = betAmount * config.multiplier;
    const cappedPayout = Math.min(rawPayout, config.maxPayout);

    return {
        gameType,
        betAmount,
        multiplier: config.multiplier,
        rawPayout,
        actualPayout: cappedPayout,
        wasCapped: rawPayout > config.maxPayout
    };
}
