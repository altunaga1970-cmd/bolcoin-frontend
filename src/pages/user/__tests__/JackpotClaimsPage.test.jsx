import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { MemoryRouter } from 'react-router-dom';
import JackpotClaimsPage from '../JackpotClaimsPage';
import { Web3Provider } from '../../contexts/Web3Context';
import { ToastProvider } from '../../contexts/ToastContext';

// Mocks
const mockWeb3Context = {
    isConnected: true,
    account: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
};

const mockJackpotApi = {
    getPoolStats: sinon.stub().resolves({
        data: {
            superJackpotPool: '50000.000000',
            totalPassesRegistered: 150
        }
    }),
    getPendingClaims: sinon.stub().resolves({
        data: {
            claims: [
                {
                    id: 123,
                    round_id: 20240123,
                    user_wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                    game_type: 'fijos',
                    bet_number: '25',
                    amount: '5.00',
                    potential_jackpot_value: '2500.000000',
                    created_at: '2024-01-23T15:30:00Z'
                }
            ],
            total: 1
        }
    }),
    getClaimProof: sinon.stub().resolves({
        data: {
            roundId: 20240123,
            ticketId: 123,
            userWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            leafHash: '0x123...',
            proof: [
                '0x456...',
                '0x789...'
            ]
        }
    }),
    processJackpotClaim: sinon.stub().resolves({
        data: {
            success: true,
            txHash: '0xabc123...',
            amount: '2,500.00'
        }
    }),
    formatPoolBalance: (amount) => `$${parseFloat(amount).toLocaleString()}`
};

const mockToast = {
    success: sinon.spy(),
    error: sinon.spy()
};

// Mock modules
jest.mock('../../contexts/Web3Context', () => ({
    useWeb3: () => mockWeb3Context
}));

jest.mock('../../api/jackpotApi', () => mockJackpotApi);

jest.mock('../../contexts/ToastContext', () => ({
    useToast: () => mockToast
}));

const TestWrapper = ({ children }) => (
    <MemoryRouter>
        <ToastProvider>
            <Web3Provider value={mockWeb3Context}>
                {children}
            </Web3Provider>
        </ToastProvider>
    </MemoryRouter>
);

describe('JackpotClaimsPage - End-to-End Flow', () => {
    beforeEach(() => {
        // Reset mocks
        mockJackpotApi.getPoolStats.reset();
        mockJackpotApi.getPendingClaims.reset();
        mockJackpotApi.getClaimProof.reset();
        mockJackpotApi.processJackpotClaim.reset();
        mockToast.success.resetHistory();
        mockToast.error.resetHistory();

        // Default responses
        mockJackpotApi.getPoolStats.resolves({
            data: {
                superJackpotPool: '50000.000000',
                totalPassesRegistered: 150
            }
        });
        mockJackpotApi.getPendingClaims.resolves({
            data: {
                claims: [
                    {
                        id: 123,
                        round_id: 20240123,
                        user_wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                        game_type: 'fijos',
                        bet_number: '25',
                        amount: '5.00',
                        potential_jackpot_value: '2500.000000',
                        created_at: '2024-01-23T15:30:00Z'
                    }
                ],
                total: 1
            }
        });
    });

    it('should load and display jackpot claims page', async () => {
        render(
            <TestWrapper>
                <JackpotClaimsPage />
            </TestWrapper>
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Super Jackpot Claims')).to.exist;
        });

        expect(screen.getByText('$50,000')).to.exist; // Pool amount
        expect(screen.getByText('Claims Disponibles')).to.exist;
    });

    it('should display pending claims', async () => {
        render(
            <TestWrapper>
                <JackpotClaimsPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Round 20240123')).to.exist;
        });

        expect(screen.getByText('Fijo')).to.exist;
        expect(screen.getByText('25')).to.exist;
        expect(screen.getByText('$5.00')).to.exist;
        expect(screen.getByText('$2,500.00')).to.exist; // Potential jackpot value
    });

    it('should process jackpot claim successfully', async () => {
        mockJackpotApi.getClaimProof.resolves({
            data: {
                roundId: 20240123,
                ticketId: 123,
                userWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                leafHash: '0x1234567890abcdef',
                proof: [
                    '0x4567890123456789',
                    '0x7890123456789012'
                ]
            }
        });

        mockJackpotApi.processJackpotClaim.resolves({
            data: {
                success: true,
                txHash: '0xabcdef1234567890',
                amount: '2,500.00'
            }
        });

        render(
            <TestWrapper>
                <JackpotClaimsPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Reclamar Jackpot')).to.exist;
        });

        // Click claim button
        const claimButton = screen.getByText('Reclamar Jackpot');
        fireEvent.click(claimButton);

        // Wait for claim to process
        await waitFor(() => {
            expect(mockJackpotApi.getClaimProof.calledWith(20240123, 123)).to.be.true;
        });

        await waitFor(() => {
            expect(mockJackpotApi.processJackpotClaim.calledOnce).to.be.true;
        });

        // Check success message
        expect(mockToast.success.calledWith('¡Claim procesado exitosamente! Recibiste 2,500.00 USDT')).to.be.true;
    });

    it('should handle claim errors gracefully', async () => {
        mockJackpotApi.processJackpotClaim.rejects({
            response: {
                data: {
                    message: 'Ya reclamado'
                }
            }
        });

        render(
            <TestWrapper>
                <JackpotClaimsPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Reclamar Jackpot')).to.exist;
        });

        const claimButton = screen.getByText('Reclamar Jackpot');
        fireEvent.click(claimButton);

        await waitFor(() => {
            expect(mockToast.error.calledWith('Ya reclamado')).to.be.true;
        });
    });

    it('should show loading state during claim', async () => {
        // Make API call slow
        mockJackpotApi.processJackpotClaim.returns(new Promise(resolve => {
            setTimeout(() => resolve({
                data: {
                    success: true,
                    txHash: '0xabc123',
                    amount: '1,000.00'
                }
            }), 100);
        }));

        render(
            <TestWrapper>
                <JackpotClaimsPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Reclamar Jackpot')).to.exist;
        });

        const claimButton = screen.getByText('Reclamar Jackpot');
        fireEvent.click(claimButton);

        // Should show loading state
        expect(screen.getByText('Procesando...')).to.exist;

        // After completion
        await waitFor(() => {
            expect(mockToast.success.called).to.be.true;
        });
    });

    it('should display empty state when no claims', async () => {
        mockJackpotApi.getPendingClaims.resolves({
            data: {
                claims: [],
                total: 0
            }
        });

        render(
            <TestWrapper>
                <JackpotClaimsPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('No tienes claims pendientes')).to.exist;
        });

        expect(screen.getByText('Cuando ganes con Jackpot Pass, podrás reclamar aquí')).to.exist;
    });

    it('should refresh data after successful claim', async () => {
        let callCount = 0;
        mockJackpotApi.getPendingClaims.callsFake(() => {
            callCount++;
            if (callCount === 1) {
                return Promise.resolve({
                    data: {
                        claims: [{
                            id: 123,
                            round_id: 20240123,
                            user_wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                            game_type: 'fijos',
                            bet_number: '25',
                            amount: '5.00',
                            potential_jackpot_value: '2500.000000',
                            created_at: '2024-01-23T15:30:00Z'
                        }],
                        total: 1
                    }
                });
            } else {
                // After claim, no more claims
                return Promise.resolve({
                    data: {
                        claims: [],
                        total: 0
                    }
                });
            }
        });

        render(
            <TestWrapper>
                <JackpotClaimsPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Reclamar Jackpot')).to.exist;
        });

        // Click claim
        const claimButton = screen.getByText('Reclamar Jackpot');
        fireEvent.click(claimButton);

        // Wait for claim to complete and data refresh
        await waitFor(() => {
            expect(screen.getByText('No tienes claims pendientes')).to.exist;
        });

        expect(mockJackpotApi.getPendingClaims.callCount).to.equal(2);
    });
});