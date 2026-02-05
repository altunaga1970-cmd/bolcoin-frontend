// =================================
// POOL STATISTICS - VISUALIZACIÓN DE ESTADOS
// =================================

import { limitManager } from './limitManager';

/**
 * Componente para mostrar estadísticas del pool y límites
 */
export class PoolStatistics {
    
    /**
     * Obtener estadísticas completas del pool
     */
    getPoolStatistics(poolBalance, currentLimit) {
        const limitInfo = limitManager.calculateNextLimit(poolBalance, currentLimit);
        
        return {
            poolBalance,
            currentLimit,
            maxLimit: limitManager.MAX_LIMIT_PER_NUMBER,
            maxIntSupported: limitInfo.maxIntSupported,
            canReachNextInt: limitInfo.canReachNextInt,
            nextInt: limitInfo.nextInt,
            requiredForNextInt: limitInfo.requiredForNextInt,
            
            // Progreso hacia el siguiente nivel
            progressToNext: {
                percentage: Math.min((poolBalance / (limitInfo.nextInt * 100)) * 100, 100),
                current: poolBalance,
                target: limitInfo.nextInt * 100,
                remaining: Math.max(0, limitInfo.requiredForNextInt)
            },
            
            // Niveles alcanzados
            levelsReached: Math.floor(poolBalance / 100),
            totalLevels: limitManager.MAX_LIMIT_PER_NUMBER,
            
            // Formateo para display
            formatted: {
                poolBalance: this.formatCurrency(poolBalance),
                currentLimit: this.formatCurrency(currentLimit),
                maxLimit: this.formatCurrency(limitManager.MAX_LIMIT_PER_NUMBER),
                requiredForNextInt: this.formatCurrency(limitInfo.requiredForNextInt)
            }
        };
    }
    
    /**
     * Generar mensaje de estado del pool
     */
    generateStatusMessage(poolBalance, currentLimit) {
        const stats = this.getPoolStatistics(poolBalance, currentLimit);
        
        if (stats.currentLimit >= stats.maxLimit) {
            return {
                type: 'success',
                message: `¡Límite máximo alcanzado! Puedes apostar hasta $${stats.formatted.maxLimit} por número`,
                icon: '🎯'
            };
        }
        
        if (stats.canReachNextInt) {
            return {
                type: 'info',
                message: `Pool suficiente para límite de $${stats.nextInt} por número`,
                icon: '📈'
            };
        }
        
        return {
            type: 'warning',
            message: `Faltan $${stats.formatted.requiredForNextInt} para alcanzar límite de $${stats.nextInt} por número`,
            icon: '💰'
        };
    }
    
    /**
     * Calcular progreso visual
     */
    calculateProgress(poolBalance, targetLevel) {
        const required = targetLevel * 100;
        const percentage = Math.min((poolBalance / required) * 100, 100);
        
        return {
            percentage,
            current: poolBalance,
            required,
            remaining: Math.max(0, required - poolBalance),
            isComplete: poolBalance >= required
        };
    }
    
    /**
     * Formatear moneda
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    /**
     * Generar barras de progreso para niveles
     */
    generateLevelBars(poolBalance, maxLevels = 10) {
        const bars = [];
        
        for (let level = 1; level <= Math.min(maxLevels, limitManager.MAX_LIMIT_PER_NUMBER); level++) {
            const progress = this.calculateProgress(poolBalance, level);
            
            bars.push({
                level,
                limit: level,
                progress: progress.percentage,
                isComplete: progress.isComplete,
                isActive: level === Math.floor(poolBalance / 100) + 1,
                required: progress.required,
                current: progress.current
            });
        }
        
        return bars;
    }
}

// Exportar instancia única
export const poolStatistics = new PoolStatistics();

export default poolStatistics;