import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import JackpotBanner from '../../src/components/web3/JackpotBanner';
import { Web3Provider } from '../../src/contexts/Web3Context';

// Mock de la API
const mockJackpotApi = {
    getPoolStats: sinon.stub().resolves({
        data: {
            superJackpotPool: '50000.000000', // 50 USDT
            totalPassesRegistered: 150
        }
    }),
    formatPoolBalance: (amount) => `$${parseFloat(amount).toLocaleString()}`
};

// Mock del contexto Web3
const mockWeb3Context = {
    isConnected: true,
    account: '0x123...'
};

// Wrapper para tests
const TestWrapper = ({ children }) => (
    <Web3Provider value={mockWeb3Context}>
        {children}
    </Web3Provider>
);

describe('JackpotBanner Component', () => {
    beforeEach(() => {
        // Reset mocks
        mockJackpotApi.getPoolStats.reset();
        mockJackpotApi.getPoolStats.resolves({
            data: {
                superJackpotPool: '75000.000000', // 75 USDT
                totalPassesRegistered: 200
            }
        });
    });

    it('should render loading state initially', () => {
        render(
            <TestWrapper>
                <JackpotBanner variant="compact" />
            </TestWrapper>
        );

        // Should not render anything while loading
        expect(screen.queryByText(/SUPER JACKPOT/)).to.be.null;
    });

    it('should render compact variant with jackpot data', async () => {
        render(
            <TestWrapper>
                <JackpotBanner variant="compact" />
            </TestWrapper>
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('SUPER JACKPOT')).to.exist;
        });

        expect(screen.getByText('$75,000')).to.exist;
        expect(screen.getByText('Pago diario • +1 USDT por ticket')).to.exist;
        expect(screen.getByText('Ver Claims')).to.exist;
    });

    it('should render default variant with jackpot info', async () => {
        render(
            <TestWrapper>
                <JackpotBanner variant="default" />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('🏆 SUPER JACKPOT LA BOLITA')).to.exist;
        });

        expect(screen.getByText('$75,000')).to.exist;
        expect(screen.getByText('Pago diario del 5% del pool a ganadores con Jackpot Pass')).to.exist;
        expect(screen.getByText('Ver Mis Claims')).to.exist;
    });

    it('should render mini variant', async () => {
        render(
            <TestWrapper>
                <JackpotBanner variant="mini" />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('SUPER JACKPOT')).to.exist;
        });

        expect(screen.getByText('🏆')).to.exist;
        expect(screen.getByText('$75,000')).to.exist;
    });

    it('should handle API errors gracefully', async () => {
        mockJackpotApi.getPoolStats.rejects(new Error('API Error'));

        render(
            <TestWrapper>
                <JackpotBanner variant="compact" />
            </TestWrapper>
        );

        // Should not crash, should just not render
        await waitFor(() => {
            expect(screen.queryByText('SUPER JACKPOT')).to.be.null;
        });
    });

    it('should format jackpot amounts correctly', async () => {
        mockJackpotApi.getPoolStats.resolves({
            data: {
                superJackpotPool: '1234567.890000', // 1,234,567.89 USDT
                totalPassesRegistered: 1000
            }
        });

        render(
            <TestWrapper>
                <JackpotBanner variant="compact" />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('$1,234,567')).to.exist;
        });
    });
});