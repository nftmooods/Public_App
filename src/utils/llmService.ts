/**
 * Interface for Language Model Services
 * This interface defines the common methods that all LLM services must implement
 */
export interface LLMService {
  /**
   * Checks if the service is properly configured with API keys
   */
  isConfigured(): boolean;
  
  /**
   * Extracts key points from a transcription
   * @param transcription The text to extract key points from
   * @returns An array of key points as strings
   */
  extractKeyPoints(transcription: string): Promise<string[]>;
  
  /**
   * Generates content based on transcription and key points
   * @param transcription The original transcription text
   * @param keyPoints Array of key points to include in the content
   * @param settings Content generation settings (format, tone, etc.)
   * @returns Generated content as a string
   */
  generateContent(
    transcription: string,
    keyPoints: string[],
    settings: {
      title: string;
      subtitle: string;
      summary: string;
      format: string;
      tone: string;
    }
  ): Promise<string>;
  
  /**
   * Counts tokens in a text (for quota estimation)
   * @param content The text to count tokens for
   * @returns Number of tokens
   */
  countTokens(content: string): Promise<number>;
}

/**
 * Base class for LLM services with common utility methods
 */
export abstract class BaseLLMService implements LLMService {
  protected apiKey: string | null = null;
  protected modelName: string | null = null;
  
  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || null;
    this.modelName = modelName || null;
  }
  
  abstract isConfigured(): boolean;
  abstract extractKeyPoints(transcription: string): Promise<string[]>;
  abstract generateContent(
    transcription: string,
    keyPoints: string[],
    settings: any
  ): Promise<string>;
  abstract countTokens(content: string): Promise<number>;
  
  /**
   * Utility method to detect language of text
   * @param text Text to analyze
   * @returns Detected language name
   */
  protected detectLanguage(text: string): string {
    // Simplified language detection for French and English only
    const languagePatterns = {
      'French': /\b(le|la|les|de|et|à|un|une|ce|que|qui|dans|pour|avec|sur|par|du|des|au|aux|est|sont|avoir|être|mais|tout|vous|ils|nous|comme|peut|plus|temps|très|bien|encore|aussi|autre|après|deux|même|faire|dire|ici|où|comment|pourquoi|quand|alors|depuis|pendant|avant|maintenant|toujours|jamais|souvent|parfois|quelque|chose|personne|rien|tout|tous|toute|toutes|chaque|plusieurs|beaucoup|peu|assez|trop|moins|plus|autant|tant|si|oui|non|peut-être|sûrement|certainement|probablement|évidemment|naturellement|heureusement|malheureusement|finalement|enfin|d'abord|ensuite|puis|après|avant|pendant|depuis|jusqu'à|vers|chez|contre|sans|avec|pour|par|selon|malgré|grâce|à|cause|de|afin|de|dans|le|but|de)\b/gi,
      'English': /\b(the|and|to|of|a|in|that|is|it|you|for|with|on|as|be|at|by|this|have|from|or|one|had|but|words|not|what|all|were|they|we|when|your|can|said|each|which|she|do|how|their|if|will|up|other|about|out|many|then|them|these|so|some|her|would|make|like|into|him|has|two|more|very|what|know|just|first|get|over|think|also|back|after|use|work|life|only|new|way|could|good|water|been|need|should|home|around|right|high|every|another|small|found|still|between|through|where|much|before|move|too|any|same|tell|does|set|three|want|air|well|play|end|put|why|again|turn|here|off|went|old|number|great|men|say|little|came|show|large|often|together|asked|house|don't|world|going|school|important|until|form|food|keep|children|feet|land|side|without|boy|once|animal|enough|took|sometimes|four|head|above|kind|began|almost|live|page|got|earth|far|hand|year|mother|light|country|father|let|night|picture|being|study|second|book|carry|science|eat|room|friend|idea|fish|mountain|stop|base|hear|horse|cut|sure|watch|color|wood|main|plain|girl|usual|young|ready|red|list|though|feel|talk|bird|soon|body|dog|family|direct|leave|song|measure|door|product|black|short|numeral|class|wind|question|happen|complete|ship|area|half|rock|order|fire|south|problem|piece|told|knew|pass|since|top|whole|king|space|heard|best|hour|better|during|hundred|five|remember|step|early|hold|west|ground|interest|reach|fast|verb|sing|listen|six|table|travel|less|morning|ten|simple|several|vowel|toward|war|lay|against|pattern|slow|center|love|person|money|serve|appear|road|map|rain|rule|govern|pull|cold|notice|voice|unit|power|town|fine|certain|fly|fall|lead|cry|dark|machine|note|wait|plan|figure|star|box|noun|field|rest|correct|able|pound|done|beauty|drive|stood|contain|front|teach|week|final|gave|green|quick|develop|ocean|warm|free|minute|strong|special|mind|behind|clear|tail|produce|fact|street|inch|multiply|nothing|course|stay|wheel|full|force|blue|object|decide|surface|deep|moon|island|foot|system|busy|test|record|boat|common|gold|possible|plane|stead|dry|wonder|laugh|thousands|ago|ran|check|game|shape|equate|hot|miss|brought|heat|snow|tire|bring|yes|distant|fill|east|paint|language|among|grand|ball|yet|wave|drop|heart|present|heavy|dance|engine|position|arm|wide|sail|material|size|vary|settle|speak|weight|general|ice|matter|circle|pair|include|divide|syllable|felt|perhaps|pick|sudden|count|square|reason|length|represent|art|subject|region|energy|hunt|probable|bed|brother|egg|ride|cell|believe|fraction|forest|sit|race|window|store|summer|train|sleep|prove|lone|leg|exercise|wall|catch|mount|wish|sky|board|joy|winter|sat|written|wild|instrument|kept|glass|grass|cow|job|edge|sign|visit|past|soft|fun|bright|gas|weather|month|million|bear|finish|happy|hope|flower|clothe|strange|gone|jump|baby|eight|village|meet|root|buy|raise|solve|metal|whether|push|seven|paragraph|third|shall|held|hair|describe|cook|floor|either|result|burn|hill|safe|cat|century|consider|type|law|bit|coast|copy|phrase|silent|tall|sand|soil|roll|temperature|finger|industry|value|fight|lie|beat|excite|natural|view|sense|ear|else|quite|broke|case|middle|kill|son|lake|moment|scale|loud|spring|observe|child|straight|consonant|nation|dictionary|milk|speed|method|organ|pay|age|section|dress|cloud|surprise|quiet|stone|tiny|climb|bad|oil|blood|touch|grew|cent|mix|team|wire|cost|lost|brown|wear|garden|equal|sent|choose|fell|fit|flow|fair|bank|collect|save|control|decimal|gentle|woman|captain|practice|separate|difficult|doctor|please|protect|noon|whose|locate|ring|character|insect|caught|period|indicate|radio|spoke|atom|human|history|effect|electric|expect|crop|modern|element|hit|student|corner|party|supply|bone|rail|imagine|provide|agree|thus|capital|chair|danger|fruit|rich|thick|soldier|process|operate|guess|necessary|sharp|wing|create|neighbor|wash|bat|rather|crowd|corn|compare|poem|string|bell|depend|meat|rub|tube|famous|dollar|stream|fear|sight|thin|triangle|planet|hurry|chief|colony|clock|mine|tie|enter|major|fresh|search|send|yellow|gun|allow|print|dead|spot|desert|suit|current|lift|rose|continue|block|chart|hat|sell|success|company|subtract|event|particular|deal|swim|term|opposite|wife|shoe|shoulder|spread|arrange|camp|invent|cotton|born|determine|quart|nine|truck|noise|level|chance|gather|shop|stretch|throw|shine|property|column|molecule|select|wrong|gray|repeat|require|broad|prepare|salt|nose|plural|anger|claim|continent|oxygen|sugar|death|pretty|skill|women|season|solution|magnet|silver|thank|branch|match|suffix|especially|afraid|huge|sister|steel|discuss|forward|similar|guide|experience|score|apple|bought|led|pitch|coat|mass|card|band|rope|slip|win|dream|evening|condition|feed|tool|total|basic|smell|valley|double|seat|arrive|master|track|parent|shore|division|sheet|substance|favor|connect|post|spend|chord|fat|glad|original|share|station|dad|bread|charge|proper|bar|offer|segment|slave|duck|instant|market|degree|populate|chick|dear|enemy|reply|drink|occur|support|speech|nature|range|steam|motion|path|liquid|log|meant|quotient|teeth|shell|neck)\b/gi
    };

    let maxMatches = 0;
    let detectedLanguage = 'English';

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      const matches = text.match(pattern);
      const matchCount = matches ? matches.length : 0;
      
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        detectedLanguage = lang;
      }
    }

    return detectedLanguage;
  }
  
  /**
   * Utility method to estimate token count
   * @param text Text to count tokens for
   * @returns Estimated token count
   */
  protected estimateTokenCount(text: string): number {
    // Simple approximation: ~4 characters per token for English text
    return Math.floor(text.length / 4);
  }
}

export { BaseLLMService }