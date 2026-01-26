// =================================
// LIMIT MANAGER - SISTEMA DE EXPANSIÓN PROGRESIVA
// =================================

import { BOLITA_CONFIG } from './prizeCalculations';

/**
 * Sistema de gestión de límites progresivos
 * El 30% de cada apuesta va al pool para aumentar límites futuros
 */

export class LimitManager {
    constructor() {
        this.config = BOLITA_CONFIG.LIMITS;
        this.MAX_LIMIT_PER_NUMBER = 1000; // Máximo absoluto por número
    }

    /**
     * Calcular contribución al pool desde una apuesta
     */
    calculatePoolContribution(betAmount) {
        return betAmount * (this.config.poolPercentage / 100);
    }

    /**
     * Calcular fee del sistema
     */
    calculateSystemFee(betAmount) {
        return betAmount * (this.config.feePercentage / 100);
    }

    /**
     * Calcular monto destinado a pagos
     */
    calculatePayoutAmount(betAmount) {
        return betAmount * (this.config.payoutPercentage / 100);
    }

    /**
     * Calcular siguiente límite basado en el pool acumulado
     * Permite aumentos hasta alcanzar números enteros (2, 3, 4...1000)
     */
    calculateNextLimit(currentPoolBalance, currentLimit) {
        // Calcular cuántos números enteros podemos soportar
        const maxSupportedLimit = Math.min(
            Math.floor(currentPoolBalance / 100) * 100, // Cada 100 USDT = 1 USDT adicional por número
            this.MAX_LIMIT_PER_NUMBER
        );
        
        const nextLimit = Math.max(currentLimit, Math.min(maxSupportedLimit, this.MAX_LIMIT_PER_NUMBER));
        
        // Calcular cuánto falta para el siguiente nivel entero
        const currentInt = Math.floor(currentLimit);
        const nextInt = Math.min(currentInt + 1, this.MAX_LIMIT_PER_NUMBER);
        const requiredForNextInt = (nextInt * 100) - currentPoolBalance;
        
        return {
            currentLimit,
            nextLimit,
            maxLimit: this.MAX_LIMIT_PER_NUMBER,
            poolBalance: currentPoolBalance,
            canReachNextInt: currentPoolBalance >= (nextInt * 100),
            requiredForNextInt,
            nextInt,
            maxIntSupported: Math.floor(currentPoolBalance / 100)
        };
    }

    /**
     * Verificar disponibilidad de un número específico
     */
    checkNumberAvailability(number, currentBets, maxPerNumber) {
        if (!currentBets || !currentBets[number]) {
            return {
                available: true,
                maxAmount: maxPerNumber,
                remaining: maxPerNumber,
                totalBet: 0
            };
        }

        const totalBet = currentBets[number].totalAmount || 0;
        const remaining = maxPerNumber - totalBet;

        return {
            available: remaining > 0,
            maxAmount: remaining,
            remaining: Math.max(0, remaining),
            totalBet,
            isSold: remaining <= 0
        };
    }

    /**
     * Procesar apuesta y actualizar disponibilidad
     */
    processBet(number, amount, currentBets, maxPerNumber) {
        const availability = this.checkNumberAvailability(number, currentBets, maxPerNumber);
        
        if (!availability.available) {
            return {
                success: false,
                message: availability.isSold ? 
                    'Número vendido' : 
                    `Límite excedido. Disponible: $${availability.remaining.toFixed(2)}`
            };
        }

        if (amount > availability.remaining) {
            return {
                success: false,
                message: `Monto máximo: $${availability.remaining.toFixed(2)} USDT`
            };
        }

        // Actualizar apuestas actuales
        const updatedBets = {
            ...currentBets,
            [number]: {
                totalAmount: availability.totalBet + amount,
                betCount: (currentBets[number]?.betCount || 0) + 1
            }
        };

        return {
            success: true,
            updatedBets,
            poolContribution: this.calculatePoolContribution(amount),
            systemFee: this.calculateSystemFee(amount),
            payoutAmount: this.calculatePayoutAmount(amount)
        };
    }

    /**
     * Procesar resultado del sorteo (sin ganadores)
     */
    processNoWinnersDraw(totalCollected, poolBalance) {
        // 5% fee inmediato a wallet empresarial
        const businessFee = totalCollected * (this.config.feePercentage / 100);
        
        // 95% restante va a aumentar pool de límites
        const poolIncrease = totalCollected * (95 / 100);
        const newPoolBalance = poolBalance + poolIncrease;
        
        // Calcular nuevo límite con el pool actualizado
        const limitInfo = this.calculateNextLimit(newPoolBalance, this.getMaxLimitSupported(newPoolBalance));
        
        return {
            businessFee,
            poolIncrease,
            newPoolBalance,
            previousLimit: this.getMaxLimitSupported(poolBalance),
            newLimit: limitInfo.nextLimit,
            limitInfo,
            message: `Sin ganadores - Pool aumentado en $${poolIncrease.toFixed(2)} USDT`
        };
    }
    
    /**
     * Procesar resultado del sorteo (con ganadores)
     */
    processWinnersDraw(totalCollected, totalPaidOut) {
        // 5% fee se mantiene en el sistema
        const systemFee = totalCollected * (this.config.feePercentage / 100);
        
        // 30% va al pool de expansión
        const poolIncrease = totalCollected * (this.config.poolPercentage / 100);
        
        return {
            systemFee,
            poolIncrease,
            totalPaidOut,
            winners: true,
            message: `Sorteo con ganadores - Se pagó $${totalPaidOut.toFixed(2)} USDT`
        };
    }
    
    /**
     * Obtener límite máximo soportado por el pool
     */
    getMaxLimitSupported(poolBalance) {
        return Math.min(
            Math.floor(poolBalance / 100),
            this.MAX_LIMIT_PER_NUMBER
        );
    }
    
    /**
     * Formatear mensaje de disponibilidad para UI
     */
    formatAvailabilityMessage(availability) {
        if (availability.isSold) {
            return {
                type: 'error',
                message: 'Número vendido - No disponible para este sorteo',
                icon: '❌'
            };
        }
        
        if (!availability.available) {
            return {
                type: 'warning',
                message: `Límite excedido - Disponible: $${availability.remaining.toFixed(2)} USDT`,
                icon: '⚠️'
            };
        }
        
        return {
            type: 'info',
            message: `Máximo a jugar: $${availability.remaining.toFixed(2)} USDT`,
            icon: 'ℹ️'
        };
    }
}

// Exportar instancia única
export const limitManager = new LimitManager();

export default limitManager;