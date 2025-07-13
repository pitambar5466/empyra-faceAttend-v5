
import React, { useState, useEffect } from 'react';
import { CreditCardIcon, LoaderIcon, StripeIcon, ShieldCheckIcon, AlertTriangleIcon, CheckCircleIcon } from './icons';

interface MockStripeCheckoutProps {
  plan: { title: string; price: string; durationInDays: number } | null;
  user: { name: string; email: string } | null;
  onSuccess: (planName: string, durationInDays: number) => void;
  onCancel: () => void;
}

const TEST_CARDS = {
    SUCCESS: '4242424242424242',
    DECLINED: '5105105105105100',
    INSUFFICIENT_FUNDS: '4200000000000000',
};

type PaymentState = 'idle' | 'processing' | 'verifying' | 'success' | 'failed';

const MockStripeCheckout: React.FC<MockStripeCheckoutProps> = ({ plan, user, onSuccess, onCancel }) => {
  const [email, setEmail] = useState(user?.email || '');
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!plan) {
      const timer = setTimeout(() => {
        onCancel();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [plan, onCancel]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-700 dark:text-gray-300">
        <div className="text-center">
            <LoaderIcon className="w-8 h-8 mx-auto animate-spin" />
            <p className="mt-2 font-semibold">No plan selected. Redirecting...</p>
        </div>
      </div>
    );
  }
  
  const isProcessing = paymentState !== 'idle' && paymentState !== 'failed';
  const isFormValid = email.trim() && cardName.trim() && cardNumber.length === 16 && expiry.length === 4 && cvc.length >= 3;

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isProcessing) return;
    
    setErrorMessage('');
    setPaymentState('processing');

    setTimeout(() => {
        setPaymentState('verifying');
        setTimeout(() => {
            if (cardNumber === TEST_CARDS.SUCCESS) {
                setPaymentState('success');
                setTimeout(() => {
                    onSuccess(plan.title, plan.durationInDays);
                }, 1500);
            } else {
                setPaymentState('failed');
                if (cardNumber === TEST_CARDS.DECLINED) {
                    setErrorMessage('Your card was declined. Please try a different card.');
                } else if (cardNumber === TEST_CARDS.INSUFFICIENT_FUNDS) {
                    setErrorMessage('Your card has insufficient funds.');
                }
                 else {
                    setErrorMessage('Invalid card number. Please check the details and try again.');
                }
            }
        }, 1500);
    }, 1000);
  };
  
  const getButtonContent = () => {
    switch(paymentState) {
        case 'processing': return <><LoaderIcon className="w-5 h-5 animate-spin" />Processing...</>;
        case 'verifying': return <><LoaderIcon className="w-5 h-5 animate-spin" />Verifying Payment...</>;
        case 'success': return <><CheckCircleIcon className="w-5 h-5" />Success!</>;
        case 'failed': return `Try Again (${plan.price})`;
        default: return `Pay ${plan.price}`;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center p-4 animate-fade-in">
        <div className="w-full max-w-lg">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pay</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-white">EMPYRA</p>
                    </div>
                    <StripeIcon className="h-8 text-indigo-600" />
                </div>

                <div className="flex justify-between items-center mb-6">
                    <p className="text-gray-600 dark:text-gray-300">Subscribe to {plan.title} Plan</p>
                    <p className="font-bold text-lg text-gray-800 dark:text-white">{plan.price}</p>
                </div>

                {paymentState === 'success' ? (
                    <div className="text-center py-10 animate-fade-in">
                        <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto" />
                        <h3 className="text-2xl font-bold mt-4 text-gray-800 dark:text-white">Payment Confirmed!</h3>
                        <p className="text-gray-500 dark:text-gray-400">Your subscription is now active. Redirecting...</p>
                    </div>
                ) : (
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required disabled={isProcessing} />
                    </div>
                    <div>
                        <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name on Card</label>
                        <input type="text" id="cardName" value={cardName} onChange={(e) => setCardName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required disabled={isProcessing} />
                    </div>
                    <div>
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Card information</label>
                        <div className="relative">
                            <input type="text" id="cardNumber" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} className="mt-1 block w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" placeholder="0000 0000 0000 0000" required disabled={isProcessing} />
                            <CreditCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                         <div className="grid grid-cols-2 gap-4 mt-2">
                            <input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value.replace(/\D/g, '').slice(0, 4))} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" placeholder="MM / YY" required disabled={isProcessing} />
                            <input type="text" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" placeholder="CVC" required disabled={isProcessing} />
                        </div>
                        <div className="mt-2 p-2 bg-sky-50 dark:bg-sky-900/40 rounded-md text-xs text-sky-700 dark:text-sky-300">
                          <strong>Demo Only:</strong> Use card number <strong className="font-mono">{TEST_CARDS.SUCCESS}</strong> to simulate a successful payment. Other numbers will simulate a failure.
                        </div>
                    </div>

                    {errorMessage && paymentState === 'failed' && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/40 rounded-md text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                            <AlertTriangleIcon className="w-5 h-5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <div className="pt-4">
                         <button 
                            type="submit" 
                            disabled={!isFormValid || isProcessing}
                            className={`w-full inline-flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm font-bold text-white transition-colors
                                ${paymentState === 'failed' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                                disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed`}
                         >
                            {getButtonContent()}
                        </button>
                    </div>
                </form>
                )}

                 <div className="mt-6 text-center">
                    <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium" disabled={isProcessing}>Cancel and return to EMPYRA</button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-gray-500" />
                    <span>Secure payments by Stripe.</span>
                    <span className="font-bold">This is a simulated checkout page.</span>
                </div>
             </div>
        </div>
    </div>
  );
};

export default MockStripeCheckout;
