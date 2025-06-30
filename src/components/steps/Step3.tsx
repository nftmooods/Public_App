import React, { useState } from 'react';
import { CreditCard, Bitcoin, ArrowRight, Shield, Check, AlertCircle } from 'lucide-react';
import { TranscriptionData } from '../../types';

interface Step3Props {
  transcription: TranscriptionData | null;
  onPaymentAccept: (method: 'crypto' | 'card', amount: number) => void;
}

const Step3: React.FC<Step3Props> = ({ transcription, onPaymentAccept }) => {
  const [selectedMethod, setSelectedMethod] = useState<'crypto' | 'card' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showCryptoForm, setShowCryptoForm] = useState(false);

  if (!transcription) return null;

  const handlePayment = async () => {
    if (!selectedMethod) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onPaymentAccept(selectedMethod, transcription.estimatedCost);
  };

  const paymentMethods = [
    {
      id: 'card' as const,
      name: 'Credit Card',
      icon: CreditCard,
      description: 'Secure card payment',
      features: ['Instant payment', 'SSL secured', 'All cards accepted'],
      color: 'blue'
    },
    {
      id: 'crypto' as const,
      name: 'Cryptocurrency',
      icon: Bitcoin,
      description: 'Bitcoin, Ethereum, USDC',
      features: ['Decentralized payment', 'Lower fees', 'Anonymous'],
      color: 'orange'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Validation and Payment
        </h2>
        <p className="text-lg text-gray-600">
          Choose your payment method to proceed with complete processing
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Content duration</span>
            <span className="font-medium">{Math.floor(transcription.duration / 60)} minutes</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Number of speakers</span>
            <span className="font-medium">{transcription.speakers.length}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Estimated tokens</span>
            <span className="font-medium">{transcription.tokenCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4">
            <span className="font-semibold text-blue-900">Total to pay</span>
            <span className="text-xl font-bold text-blue-900">${transcription.estimatedCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose your payment method</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;
            
            return (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? `border-${method.color}-500 bg-${method.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? `bg-${method.color}-100` : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isSelected ? `text-${method.color}-600` : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className={`w-5 h-5 text-${method.color}-600`} />
                  )}
                </div>
                <ul className="space-y-1">
                  {method.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Payment Form */}
      {selectedMethod === 'card' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name on Card
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Crypto Payment Form */}
      {selectedMethod === 'crypto' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cryptocurrency Payment</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {['Bitcoin (BTC)', 'Ethereum (ETH)', 'USDC'].map((crypto) => (
                <button
                  key={crypto}
                  className="p-3 border border-gray-300 rounded-lg hover:border-orange-400 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900">{crypto}</div>
                </button>
              ))}
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                After validation, you will receive a wallet address to make the payment.
                Processing will start automatically after transaction confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800 mb-1">Secure Payment</h4>
            <p className="text-sm text-green-700">
              All transactions are secured and encrypted. Your payment data is never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Terms of Use</h4>
            <p className="text-sm text-gray-600">
              By proceeding with payment, you accept our terms of use and privacy policy. 
              Processing will begin immediately after payment confirmation.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handlePayment}
          disabled={!selectedMethod || isProcessing}
          className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all ${
            selectedMethod && !isProcessing
              ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              Confirm Payment (${transcription.estimatedCost.toFixed(2)})
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step3;