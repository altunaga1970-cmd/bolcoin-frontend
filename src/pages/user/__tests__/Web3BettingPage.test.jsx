import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { MemoryRouter } from 'react-router-dom';
import Web3BettingPage from '../../pages/user/Web3BettingPage';
import { Web3Provider } from '../../contexts/Web3Context';
import { ToastProvider } from '../../contexts/ToastContext';

// Mocks
const mockWeb3Context = {
    isConnected: true,
    account: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
};

const mockContract = {
    getContractBalance: sinon.stub().resolves('50.000000')
};

const mockDrawApi = {
    getActive: sinon.stub().resolves({
        draws: [{
            id: 17,
            draw_number: '20240123-2000-LB',
            scheduled_time: '2024-01-23T20:00:00.000Z',
            status: 'open',
            total_bets_amount: '1000.00',
            bets_count: 50
        }]
    })
};

const mockBetApi = {
    placeBets: sinon.stub().resolves({
        data: {
            bets: [{
                id: 123,
                game_type: 'fijos',
                bet_number: '25',
                amount: '5.00',
                has_pass: true
            }],
            new_balance: '44.000000',
            total_cost: 6
        }
    })
};

const mockJackpotApi = {
    getPoolStats: sinon.stub().resolves({
        data: {
            superJackpotPool: '25000.000000'
        }
    }),
    formatPoolBalance: (amount) => `$${parseFloat(amount).toLocaleString()}`
};

// Mock modules
jest.mock('../../contexts/Web3Context', () => ({
    useWeb3: () => mockWeb3Context
}));

jest.mock('../../hooks/useContract', () => ({
    useContract: () => mockContract
}));

jest.mock('../../api/drawApi', () => mockDrawApi);
jest.mock('../../api/betApi', () => mockBetApi);
jest.mock('../../api/jackpotApi', () => mockJackpotApi);

jest.mock('../../contexts/ToastContext', () => ({
    useToast: () => ({
        success: sinon.spy(),
        error: sinon.spy()
    })
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

describe('Web3BettingPage with Jackpot Pass', () => {
    beforeEach(() => {
        // Reset mocks
        mockContract.getContractBalance.reset();
        mockDrawApi.getActive.reset();
        mockBetApi.placeBets.reset();
        mockJackpotApi.getPoolStats.reset();

        // Default responses
        mockContract.getContractBalance.resolves('50.000000');
        mockDrawApi.getActive.resolves({
            draws: [{
                id: 17,
                draw_number: '20240123-2000-LB',
                scheduled_time: '2024-01-23T20:00:00.000Z',
                status: 'open',
                total_bets_amount: '1000.00',
                bets_count: 50
            }]
        });
        mockJackpotApi.getPoolStats.resolves({
            data: {
                superJackpotPool: '25000.000000'
            }
        });
    });

    it('should render betting page with jackpot pass option', async () => {
        render(
            <TestWrapper>
                <Web3BettingPage />
            </TestWrapper>
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Realizar Apuesta')).to.exist;
        });

        expect(screen.getByText('Balance disponible:')).to.exist;
        expect(screen.getByText('$50.00 USDT')).to.exist;
    });

    it('should show jackpot pass checkbox', async () => {
        render(
            <TestWrapper>
                <Web3BettingPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('🏆 Jackpot Pass')).to.exist;
        });

        expect(screen.getByText('+1 USDT')).to.exist;
        expect(screen.getByText('añade +1 USDT para participar en el Super Jackpot diario')).to.exist;
    });

    it('should display jackpot pool info', async () => {
        render(
            <TestWrapper>
                <Web3BettingPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Pool actual: $25,000')).to.exist;
        });
    });

    it('should calculate total cost with jackpot pass', async () => {
        render(
            <TestWrapper>
                <Web3BettingPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByDisplayValue('')).to.exist; // Numbers input
        });

        // Fill form
        const numbersInput = screen.getByDisplayValue('');
        const amountInput = screen.getByDisplayValue('');
        const jackpotCheckbox = screen.getByRole('checkbox');

        fireEvent.change(numbersInput, { target: { value: '25' } });
        fireEvent.change(amountInput, { target: { value: '5' } });
        fireEvent.click(jackpotCheckbox);

        // Check summary shows total cost
        await waitFor(() => {
            expect(screen.getByText('Total a debitar:')).to.exist;
            expect(screen.getByText('$6.00')).to.exist; // 5 + 1
        });

        expect(screen.getByText('Jackpot Pass:')).to.exist;
        expect(screen.getByText('$1.00')).to.exist;
    });

    it('should submit bet with jackpot pass', async () => {
        mockBetApi.placeBets.resolves({
            data: {
                bets: [{
                    id: 123,
                    game_type: 'fijos',
                    bet_number: '25',
                    amount: '5.00',
                    has_pass: true
                }],
                new_balance: '44.000000',
                total_cost: 6
            }
        });

        render(
            <TestWrapper>
                <Web3BettingPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Realizar Apuesta')).to.exist;
        });

        // Fill form
        const numbersInput = screen.getByDisplayValue('');
        const amountInput = screen.getByDisplayValue('');
        const jackpotCheckbox = screen.getByRole('checkbox');
        const submitButton = screen.getByText('Confirmar Apuesta');

        fireEvent.change(numbersInput, { target: { value: '25' } });
        fireEvent.change(amountInput, { target: { value: '5' } });
        fireEvent.click(jackpotCheckbox);
        fireEvent.click(submitButton);

        // Wait for API call
        await waitFor(() => {
            expect(mockBetApi.placeBets.calledOnce).to.be.true;
        });

        const callArgs = mockBetApi.placeBets.firstCall.args[1];
        expect(callArgs.draw_id).to.equal(17);
        expect(callArgs.bets[0].game_type).to.equal('fijos');
        expect(callArgs.bets[0].number).to.equal('025');
        expect(callArgs.bets[0].amount).to.equal(5);
        expect(callArgs.bets[0].has_pass).to.be.true;
    });

    it('should show jackpot potential in summary', async () => {
        render(
            <TestWrapper>
                <Web3BettingPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Realizar Apuesta')).to.exist;
        });

        // Fill form with jackpot pass
        const numbersInput = screen.getByDisplayValue('');
        const amountInput = screen.getByDisplayValue('');
        const jackpotCheckbox = screen.getByRole('checkbox');

        fireEvent.change(numbersInput, { target: { value: '25' } });
        fireEvent.change(amountInput, { target: { value: '5' } });
        fireEvent.click(jackpotCheckbox);

        await waitFor(() => {
            expect(screen.getByText('Jackpot potencial:')).to.exist;
            expect(screen.getByText('Hasta $1,250')).to.exist; // 5% of 25,000
        });
    });

    it('should validate minimum bet amount', async () => {
        render(
            <TestWrapper>
                <Web3BettingPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Realizar Apuesta')).to.exist;
        });

        const numbersInput = screen.getByDisplayValue('');
        const amountInput = screen.getByDisplayValue('');
        const submitButton = screen.getByText('Confirmar Apuesta');

        fireEvent.change(numbersInput, { target: { value: '25' } });
        fireEvent.change(amountInput, { target: { value: '0.5' } }); // Below minimum
        fireEvent.click(submitButton);

        // Should not call API
        expect(mockBetApi.placeBets.called).to.be.false;
    });
});