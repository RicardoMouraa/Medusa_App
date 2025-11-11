import { OrderSummary } from '@/types/api';

export const PERCENTUAL_FEE = 0.0599;
export const FIXED_FEE_VALUE = 3.99;
export const RESERVE_PERCENTAGE = 0.0699;

export const calculateNetAmount = (amount: number) => {
  const percentageFee = amount * PERCENTUAL_FEE;
  const fixedFee = FIXED_FEE_VALUE;
  const intermediationFee = percentageFee + fixedFee;
  const netBeforeReserve = Math.max(0, amount - intermediationFee);
  const reserveHold = netBeforeReserve * RESERVE_PERCENTAGE;
  const net = Math.max(0, netBeforeReserve - reserveHold);

  return {
    percentageFee,
    fixedFee,
    intermediationFee,
    netBeforeReserve,
    reserveHold,
    net
  };
};

export const sumPaidNetAmount = (transactions: OrderSummary[]) => {
  return transactions
    .filter((transaction) => transaction.status === 'paid')
    .reduce((acc, transaction) => acc + calculateNetAmount(transaction.amount).net, 0);
};

export const sumNetBreakdown = (transactions: OrderSummary[]) => {
  return transactions
    .filter((transaction) => transaction.status === 'paid')
    .reduce(
      (acc, transaction) => {
        const breakdown = calculateNetAmount(transaction.amount);
        return {
          netBeforeReserve: acc.netBeforeReserve + breakdown.netBeforeReserve,
          reserveHold: acc.reserveHold + breakdown.reserveHold,
          net: acc.net + breakdown.net
        };
      },
      { netBeforeReserve: 0, reserveHold: 0, net: 0 }
    );
};
