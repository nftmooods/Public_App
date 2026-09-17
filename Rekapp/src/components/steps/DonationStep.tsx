import React, { useState } from 'react';
import { Heart, Star, MessageSquare, Copy, CheckCircle, RotateCcw, ExternalLink, Coffee } from 'lucide-react';
import { FeedbackService } from '../../lib/supabase';
import { useAppContext } from '../../contexts/AppContext';

interface DonationStepProps {
  onNewAnalysis: () => void;
}

const DonationStep: React.FC<DonationStepProps> = ({ onNewAnalysis }) => {
  const { user, analysisSessionId } = useAppContext();
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Adresse de donation Build"On" project
  const donationAddress = '0x1247083EEEbdbb2EEE6950b1D9D2038a4e69595b1D9f9';

  const handleFeedbackSubmit = async () => {
    if (feedback.trim() || rating > 0) {
      setIsSubmitting(true);
      
      try {
        const feedbackData = {
          rating,
          comment: feedback.trim() || undefined,
          userId: user?.id,
          sessionId: analysisSessionId || Date.now().toString()
        };

        const result = await FeedbackService.submitFeedback(feedbackData);
        
        if (result) {
          setFeedbackSubmitted(true);
          console.log('✅ Feedback soumis avec succès:', result);
        } else {
          console.error('❌ Erreur lors de la soumission du feedback');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la soumission du feedback:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const copyWalletAddress = async () => {
    try {
      await navigator.clipboard.writeText(donationAddress);
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy wallet address:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Support Rekapp Development
        </h2>
        <p className="text-lg text-gray-600">
          Help us continue developing this tool by supporting the Build"On" project
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Feedback Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Share Your Experience</h3>
          </div>

          {!feedbackSubmitted ? (
            <div className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you rate Rekapp?
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-lg transition-colors ${
                        star <= rating 
                          ? 'text-yellow-500' 
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star className={`w-8 h-8 ${star <= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {rating === 5 ? '🎉 Amazing!' : 
                     rating === 4 ? '😊 Great!' : 
                     rating === 3 ? '👍 Good!' : 
                     rating === 2 ? '😐 Okay' : 
                     '😞 Needs improvement'}
                  </p>
                )}
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us how we can improve (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Your feedback helps us make Rekapp better for everyone..."
                />
              </div>

              <button
                onClick={handleFeedbackSubmit}
                disabled={(!feedback.trim() && rating === 0) || isSubmitting}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <MessageSquare className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Thank you!</h4>
              <p className="text-gray-600">
                Your feedback helps us improve Rekapp for everyone. We really appreciate it! 🙏
              </p>
            </div>
          )}
        </div>

        {/* Donation Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Heart className="w-6 h-6 text-pink-600" />
            <h3 className="text-xl font-semibold text-gray-900">Support the Build"On" Project</h3>
          </div>

          <p className="text-gray-600 mb-6">
            Your support helps us maintain and improve Rekapp for everyone
          </p>

          {/* Suggested Amounts */}
          <div className="space-y-3 mb-6">
            <h4 className="font-medium text-gray-900">Suggested amounts:</h4>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors">
              <div className="flex items-center space-x-3">
                <Coffee className="w-5 h-5 text-pink-600" />
                <div>
                  <span className="font-medium text-gray-900">$5</span>
                  <p className="text-sm text-gray-600">Buy us a coffee ☕</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors">
              <div className="flex items-center space-x-3">
                <Heart className="w-5 h-5 text-pink-600" />
                <div>
                  <span className="font-medium text-gray-900">$15</span>
                  <p className="text-sm text-gray-600">Support development 🚀</p>
                </div>
              </div>
            </div>
          </div>

          {/* Donation Address */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Donation Address</h4>
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Donation EVM Address for Build"On" project wallet
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <code className="text-sm text-gray-800 break-all">
                  {donationAddress}
                </code>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={copyWalletAddress}
                    className={`p-2 rounded-lg transition-colors ${
                      walletCopied 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Copy address"
                  >
                    {walletCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`https://etherscan.io/address/${donationAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="View on Etherscan"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-yellow-800 mb-2">Important Note</h4>
            <p className="text-sm text-yellow-700">
              Donations are completely optional and will <strong>not affect your access</strong> to Rekapp's demo features. 
              All demo functionality remains free and unlimited.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Ready for your next project?</h3>
        <p className="text-gray-600 mb-6">
          Thank you for using Rekapp! Start a new analysis whenever you're ready.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onNewAnalysis}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Analysis
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all shadow-sm"
          >
            Restart Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationStep;