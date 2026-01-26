// =================================
// AUTOMATIC DRAW SCHEDULER
// =================================

/**
 * Sistema para generar sorteos automáticamente
 * Horarios: 10:00, 15:00, 21:00 UTC
 * Siempre 3 sorteos futuros disponibles
 */

export class DrawScheduler {
    constructor() {
        this.DRAW_TIMES = [
            { hour: 10, minute: 0, label: 'Mañana' },    // 10:00 UTC
            { hour: 15, minute: 0, label: 'Tarde' },    // 15:00 UTC
            { hour: 21, minute: 0, label: 'Noche' }     // 21:00 UTC
        ];
        this.CLOSE_BEFORE_MINUTES = 5; // Cerrar apuestas 5 min antes
        this.DRAW_PREFIX = 'BOLITA';
    }

    /**
     * Generar los próximos 3 sorteos disponibles
     */
    generateNextDraws(currentDate = new Date()) {
        const draws = [];
        const now = new Date(currentDate);
        
        // Convertir a UTC
        const nowUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 
                               now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

        let drawCounter = this.getNextDrawNumber(nowUTC);
        
        // Generar hasta tener 3 sorteos futuros
        while (draws.length < 3) {
            const drawTime = this.findNextDrawTime(nowUTC, draws);
            const draw = {
                id: this.generateDrawId(drawCounter),
                draw_number: `${this.DRAW_PREFIX}-${nowUTC.getFullYear()}-${drawCounter.toString().padStart(3, '0')}`,
                scheduled_time: drawTime.toISOString(),
                draw_label: this.getTimeLabel(drawTime),
                status: this.getDrawStatus(drawTime),
                close_time: new Date(drawTime.getTime() - (this.CLOSE_BEFORE_MINUTES * 60000)).toISOString(),
                minutes_until_close: Math.max(0, Math.floor((drawTime - nowUTC) / 60000) - this.CLOSE_BEFORE_MINUTES),
                time_remaining: this.formatTimeRemaining(drawTime, nowUTC),
                is_open: this.isDrawOpen(drawTime),
                seconds_until_close: Math.max(0, Math.floor((drawTime - nowUTC) / 1000) - (this.CLOSE_BEFORE_MINUTES * 60))
            };
            
            draws.push(draw);
            drawCounter++;
        }
        
        return draws;
    }

    /**
     * Encontrar el próximo horario de sorteo disponible
     */
    findNextDrawTime(nowUTC, existingDraws) {
        let targetTime = new Date(nowUTC);
        
        // Si ya es hoy, empezar desde el próximo horario
        const todayStart = new Date(Date.UTC(
            targetTime.getUTCFullYear(),
            targetTime.getUTCMonth(),
            targetTime.getUTCDate(),
            0, 0, 0
        ));
        
        // Probar cada horario hasta encontrar uno disponible
        for (let day = 0; day < 7; day++) { // Buscar por 7 días máximo
            for (const timeSlot of this.DRAW_TIMES) {
                const drawTime = new Date(Date.UTC(
                    todayStart.getUTCFullYear(),
                    todayStart.getUTCMonth(),
                    todayStart.getUTCDate() + day,
                    timeSlot.hour,
                    timeSlot.minute,
                    0
                ));
                
                // Verificar que no esté en uso y sea futuro
                const isUsed = existingDraws.some(d => 
                    new Date(d.scheduled_time).getTime() === drawTime.getTime()
                );
                
                if (!isUsed && drawTime > nowUTC) {
                    return drawTime;
                }
            }
        }
        
        // Fallback: Devolver mañana 10:00
        return new Date(Date.UTC(
            todayStart.getUTCFullYear(),
            todayStart.getUTCMonth(),
            todayStart.getUTCDate() + 1,
            10, 0, 0
        ));
    }

    /**
     * Obtener el siguiente número de sorteo
     */
    getNextDrawNumber(nowUTC) {
        // Para implementación real, esto vendría de la base de datos
        // Por ahora, usamos el día del año + contador
        const startOfYear = new Date(Date.UTC(nowUTC.getUTCFullYear(), 0, 1));
        const dayOfYear = Math.floor((nowUTC - startOfYear) / (24 * 60 * 60 * 1000));
        return dayOfYear + 1;
    }

    /**
     * Generar ID único para sorteo
     */
    generateDrawId(counter) {
        return Date.now() + counter; // Timestamp + contador
    }

    /**
     * Obtener etiqueta del horario
     */
    getTimeLabel(drawTime) {
        const hour = drawTime.getUTCHours();
        const timeSlot = this.DRAW_TIMES.find(t => t.hour === hour);
        return timeSlot ? timeSlot.label : 'Extraordinario';
    }

    /**
     * Determinar estado del sorteo
     */
    getDrawStatus(drawTime) {
        const now = new Date();
        const closeTime = drawTime.getTime() - (this.CLOSE_BEFORE_MINUTES * 60000);
        
        if (now >= drawTime) return 'completed';
        if (now >= closeTime) return 'closed';
        return 'open';
    }

    /**
     * Verificar si el sorteo está abierto para apuestas
     */
    isDrawOpen(drawTime) {
        const status = this.getDrawStatus(drawTime);
        return status === 'open';
    }

    /**
     * Formatear tiempo restante
     */
    formatTimeRemaining(drawTime, now = new Date()) {
        const diff = drawTime - now;
        if (diff <= 0) return 'Sorteo en curso';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    /**
     * Reemplazar sorteo cancelado
     */
    replaceCancelledDraw(cancelledDraw, allDraws) {
        const filteredDraws = allDraws.filter(d => d.id !== cancelledDraw.id);
        return this.generateNextDraws(new Date());
    }

    /**
     * Obtener sorteo actualmente abierto para apuestas
     */
    getCurrentOpenDraw(draws) {
        return draws.find(draw => draw.is_open);
    }

    /**
     * Verificar si需要在5分钟内关闭
     */
    needsToCloseSoon(draw) {
        return draw.seconds_until_close <= 300 && draw.seconds_until_close > 0; // 5 minutos = 300 segundos
    }
}

// Exportar instancia única
export const drawScheduler = new DrawScheduler();

export default drawScheduler;