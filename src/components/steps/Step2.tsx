import React from 'react';
import { Loader2, FileText, Clock, Users, ArrowRight, DollarSign, Zap } from 'lucide-react';
import { TranscriptionData } from '../../types';

interface Step2Props {
  transcription: TranscriptionData | null;
  isProcessing: boolean;
  onNext: () => void;
}

const Step2: React.FC<Step2Props> = ({ transcription, isProcessing, onNext }) => {
  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Analyse en cours
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Analyse préliminaire du contenu pour estimer les coûts et identifier les points clés...
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progression</span>
                <span>Analyse...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-3/4 transition-all duration-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!transcription) return null;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Analyse préliminaire terminée
        </h2>
        <p className="text-lg text-gray-600">
          Voici les métriques détectées et l'estimation des coûts de traitement
        </p>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatDuration(transcription.duration)}
          </div>
          <div className="text-sm text-gray-600">Durée totale</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {transcription.speakers.length}
          </div>
          <div className="text-sm text-gray-600">Intervenants détectés</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {transcription.tokenCount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Tokens estimés</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {transcription.estimatedCost.toFixed(2)}€
          </div>
          <div className="text-sm text-gray-600">Coût estimé</div>
        </div>
      </div>

      {/* Intervenants détectés */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Intervenants identifiés</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {transcription.speakers.map((speaker) => (
            <div 
              key={speaker.id}
              className="flex items-center justify-between p-4 rounded-lg border"
              style={{ borderColor: speaker.color, backgroundColor: `${speaker.color}20` }}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: speaker.color }}
                ></div>
                <span className="font-medium text-gray-700">
                  {speaker.name}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {Math.floor(speaker.speakingTime / 60)}min {speaker.speakingTime % 60}s
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aperçu du contenu */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu du contenu</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 leading-relaxed">
            {transcription.text.substring(0, 500)}...
          </p>
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <FileText className="w-4 h-4 mr-2" />
          <span>{transcription.text.split(' ').length} mots au total</span>
        </div>
      </div>

      {/* Détails de facturation */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Détails de facturation</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-800">Transcription complète</span>
            <span className="font-medium text-blue-900">{(transcription.estimatedCost * 0.4).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-800">Extraction des points clés</span>
            <span className="font-medium text-blue-900">{(transcription.estimatedCost * 0.3).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-800">Génération de contenu</span>
            <span className="font-medium text-blue-900">{(transcription.estimatedCost * 0.3).toFixed(2)}€</span>
          </div>
          <div className="border-t border-blue-300 pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-900">Total estimé</span>
              <span className="text-xl font-bold text-blue-900">{transcription.estimatedCost.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Information importante */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Information importante</h4>
            <p className="text-sm text-yellow-700">
              Le coût final peut varier légèrement selon la complexité du contenu et les options choisies. 
              Vous pourrez valider le paiement à l'étape suivante avant le traitement complet.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
        >
          Continuer vers le paiement
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step2;