/**
 * OpenAI Service for Rekapp
 * Handles transcription with Whisper and content generation with GPT models
 * Supports all OpenAI models including GPT-4o, GPT-4-turbo, o1, o3, etc.
 */

export interface OpenAITranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  segments?: OpenAISegment[];
  keyPoints?: string[];
}

export interface OpenAISegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export class OpenAIService {
  private apiKey: string | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
      this.modelName = modelName || 'gpt-4o'; // Default to GPT-4o
      console.log(`🔧 OpenAI service initialized with API key and model: ${this.modelName}`);
    } else {
      this.modelName = 'gpt-4o';
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async transcribeFile(
    audioFile: File,
    options: {
      language?: string;
      extractKeyPoints?: boolean;
      detectSpeakers?: boolean;
      prompt?: string;
    } = {}
  ): Promise<OpenAITranscriptionResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI service not configured. Please provide an OpenAI API key.');
    }

    // Validate file size (OpenAI Whisper limit is 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      throw new Error('File too large for OpenAI Whisper. Maximum size is 25MB.');
    }

    try {
      console.log(`🎵 Starting OpenAI Whisper transcription for:`, audioFile.name);
      console.log('📊 File size:', (audioFile.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('📊 File type:', audioFile.type);

      // Validate file type
      // Step 1: Transcribe with Whisper
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      
      if (options.language) {
        formData.append('language', options.language === 'fr' ? 'fr' : options.language === 'en' ? 'en' : 'auto');
      }

      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }

      console.log('🚀 Sending request to OpenAI Whisper...');
      
      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || transcriptionResponse.statusText;
        
        if (transcriptionResponse.status === 429) {
          throw new Error('OpenAI API quota exceeded. Please check your quota or upgrade your plan.');
        }
        throw new Error(`OpenAI Whisper API error: ${transcriptionResponse.status} - ${errorMessage}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcriptionText = transcriptionData.text;

      console.log('✅ OpenAI Whisper transcription completed');
      console.log('📄 Transcription length:', transcriptionText.length, 'characters');

      // Step 2: Post-process with the assigned GPT model for speaker detection and key points if requested
      let processedResult = {
        text: transcriptionText,
        language: this.detectLanguage(transcriptionText),
        confidence: 0.95,
        segments: undefined as OpenAISegment[] | undefined,
        keyPoints: undefined as string[] | undefined
      };

      if (options.detectSpeakers || options.extractKeyPoints) {
        console.log('🔄 Post-processing with GPT for speaker detection and key points...');
        console.log('🤖 Using model for post-processing:', this.modelName);
        const postProcessPrompt = this.buildPostProcessPrompt(transcriptionText, options);
        
        // Determine the correct token parameter based on model
        const requestBody: any = {
          model: this.modelName,
          messages: [
            {
              role: 'user',
              content: postProcessPrompt
            }
          ],
          temperature: 0.1
        };

        // Use max_completion_tokens for newer models (o1, o3, etc.)
        if (this.modelName.startsWith('o1') || this.modelName.startsWith('o3')) {
          requestBody.max_completion_tokens = 4000;
        } else {
          requestBody.max_tokens = 4000;
        }

        const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!gptResponse.ok) {
          const errorData = await gptResponse.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || gptResponse.statusText;
          
          if (gptResponse.status === 429) {
            throw new Error('OpenAI API quota exceeded during post-processing. Please check your quota.');
          }
          
          console.warn('⚠️ GPT post-processing failed:', errorMessage);
        } else {
          const gptData = await gptResponse.json();
          const gptResult = gptData.choices?.[0]?.message?.content;
          
          if (gptResult) {
            const parsed = this.parseGPTResponse(gptResult, options);
            processedResult = {
              ...processedResult,
              text: parsed.text || processedResult.text,
              segments: parsed.segments,
              keyPoints: parsed.keyPoints
            };
          }
        }
      }

      return processedResult;

    } catch (error) {
      console.error('❌ Error during OpenAI transcription:', error);
      
      if (error instanceof Error) {
        // Handle specific OpenAI API errors
        if (error.message.includes('quota') || error.message.includes('429')) {
          throw new Error('OpenAI API quota exceeded. Check your API key or increase your quota.');
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Invalid OpenAI API key or insufficient permissions.');
        } else if (error.message.includes('400')) {
          throw new Error('Invalid request. Please check file format and size.');
        } else if (error.message.includes('413')) {
          throw new Error('File too large for OpenAI Whisper. Maximum size is 25MB.');
        } else if (error.message.includes('415')) {
          throw new Error('Unsupported file format. Please use supported audio formats (mp3, wav, m4a, etc.).');
        }
      }
      
      throw new Error(`OpenAI transcription error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transcribeFromUrl(
    audioUrl: string,
    options: {
      language?: string;
      extractKeyPoints?: boolean;
      detectSpeakers?: boolean;
      prompt?: string;
    } = {}
  ): Promise<OpenAITranscriptionResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI service not configured.');
    }

    try {
      console.log('🌐 Downloading audio from:', audioUrl);
      
      const response = await fetch(audioUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OpenAITranscriber/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Unable to download audio: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      const audioBlob = await response.blob();
      
      const fileName = audioUrl.split('/').pop()?.split('?')[0] || 'audio';
      const audioFile = new File([audioBlob], fileName, { type: contentType });
      
      console.log('📥 Audio downloaded, size:', (audioFile.size / 1024 / 1024).toFixed(2), 'MB');

      return await this.transcribeFile(audioFile, options);

    } catch (error) {
      console.error('❌ Error during OpenAI URL transcription:', error);
      throw new Error(`OpenAI URL transcription error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractKeyPoints(transcription: string): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI service not configured.');
    }

    try {
      console.log(`🎯 Extracting key points with ${this.modelName}...`);
      console.log('📊 Transcription length:', transcription.length, 'characters');
      
      const prompt = `Analyze this transcription and extract key points, main themes, important quotes, and major insights:

${transcription}

Focus on:
- Main themes and topics discussed
- Important decisions or conclusions
- Key insights and takeaways
- Notable quotes or statements
- Action items or next steps

Respond only with a list of key points, one per line, preceded by a dash (-).
Each point should be concise but comprehensive (1-2 sentences max).`;

      // Determine the correct token parameter based on model
      const requestBody: any = {
        model: this.modelName,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      };

      // Use max_completion_tokens for newer models (o1, o3, etc.)
      if (this.modelName.startsWith('o1') || this.modelName.startsWith('o3')) {
        requestBody.max_completion_tokens = 2048;
      } else {
        requestBody.max_tokens = 2048;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        if (response.status === 429) {
          throw new Error('OpenAI API quota exceeded during key points extraction. Please check your quota.');
        }
        
        throw new Error(`OpenAI API error: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      const keyPointsText = data.choices?.[0]?.message?.content || '';

      const keyPoints = keyPointsText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(point => point.length > 0);

      console.log('✅ Key points extracted with', this.modelName + ':', keyPoints.length);
      return keyPoints;

    } catch (error) {
      console.error('❌ Error during OpenAI key points extraction:', error);
      throw error;
    }
  }

  async generateContent(
    transcription: string,
    keyPoints: string[],
    settings: {
      title: string;
      subtitle: string;
      summary: string;
      format: string;
      tone: string;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI service not configured.');
    }

    try {
      console.log(`📝 Generating content with ${this.modelName}...`);
      console.log('🎯 Format:', settings.format, '| Tone:', settings.tone);
      console.log('📊 Key points count:', keyPoints.length);
      
      const prompt = `Generate ${settings.format} content based on this transcription and key points:

TITLE: ${settings.title}
SUBTITLE: ${settings.subtitle}
SUMMARY: ${settings.summary}
TONE: ${settings.tone}
FORMAT: ${settings.format}

TRANSCRIPTION:
${transcription}

KEY POINTS:
${keyPoints.map(point => `- ${point}`).join('\n')}

Generate well-structured ${settings.format} content with a ${settings.tone} tone that:
- Uses the provided title and subtitle
- Incorporates all key points naturally
- Maintains the ${settings.tone} tone throughout
- Is engaging and well-formatted for ${settings.format}
- Reflects the original discussion accurately

Please create comprehensive, professional content that would be suitable for publication.`;

      // Determine the correct token parameter based on model
      const requestBody: any = {
        model: this.modelName,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      };

      // Use max_completion_tokens for newer models (o1, o3, etc.)
      if (this.modelName.startsWith('o1') || this.modelName.startsWith('o3')) {
        requestBody.max_completion_tokens = 4096;
      } else {
        requestBody.max_tokens = 4096;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        if (response.status === 429) {
          throw new Error('OpenAI API quota exceeded during content generation. Please check your quota.');
        }
        
        throw new Error(`OpenAI API error: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      const generatedContent = data.choices?.[0]?.message?.content || '';
      
      console.log('✅ Content generated:', generatedContent.length, 'characters');
      return generatedContent;

    } catch (error) {
      console.error('❌ Error during OpenAI content generation:', error);
      throw error;
    }
  }

  private buildPostProcessPrompt(transcription: string, options: any): string {
    console.log('🔧 Building post-process prompt with options:', options);
    let prompt = `Analyze this transcription and provide the following:

TRANSCRIPTION:
${transcription}

Please provide:`;

    if (options.detectSpeakers) {
      prompt += `

SPEAKERS:
- Identify different speakers and label them consistently
- Format speaker sections as [Speaker 1]: [their words]
- Provide a brief description of each speaker if possible`;
    }

    if (options.extractKeyPoints) {
      prompt += `

KEY_POINTS:
- Extract main themes and important insights
- List key points with - prefix
- Focus on actionable insights and important decisions`;
    }

    prompt += `

OUTPUT FORMAT:
PROCESSED_TRANSCRIPTION:
[Provide the transcription with speaker labels if requested]

LANGUAGE:
[Detected language: French or English]`;

    if (options.detectSpeakers) {
      prompt += `

SPEAKERS:
[List identified speakers with descriptions]`;
    }

    if (options.extractKeyPoints) {
      prompt += `

KEY_POINTS:
[List main points with - prefix]`;
    }

    return prompt;
  }

  private parseGPTResponse(response: string, options: any): {
    text?: string;
    language?: string;
    segments?: OpenAISegment[];
    keyPoints?: string[];
  } {
    const sections = {
      // Parse the GPT response into structured sections
      transcription: '',
      language: '',
      speakers: '',
      keyPoints: ''
    };

    const transcriptionMatch = response.match(/PROCESSED_TRANSCRIPTION:\s*([\s\S]*?)(?=\n(?:LANGUAGE|SPEAKERS|KEY_POINTS|$))/i);
    if (transcriptionMatch) {
      sections.transcription = transcriptionMatch[1].trim();
    }

    const languageMatch = response.match(/LANGUAGE:\s*(.*?)(?=\n|$)/i);
    if (languageMatch) {
      sections.language = languageMatch[1].trim();
    }

    const keyPointsMatch = response.match(/KEY_POINTS:\s*([\s\S]*?)$/i);
    if (keyPointsMatch) {
      sections.keyPoints = keyPointsMatch[1].trim();
    }

    let segments: OpenAISegment[] = [];
    if (options.detectSpeakers && sections.transcription) {
      segments = this.parseSegmentsWithSpeakers(sections.transcription);
    }

    let keyPoints: string[] = [];
    if (sections.keyPoints) {
      keyPoints = sections.keyPoints
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(point => point.length > 10);
    }

    console.log('📊 Parsed GPT response:', { hasText: !!sections.transcription, segmentsCount: segments.length, keyPointsCount: keyPoints.length });
    return {
      text: sections.transcription || undefined,
      language: sections.language || undefined,
      segments: segments.length > 0 ? segments : undefined,
      keyPoints: keyPoints.length > 0 ? keyPoints : undefined
    };
  }

  private parseSegmentsWithSpeakers(transcription: string): OpenAISegment[] {
    console.log('👥 Parsing segments with speakers...');
    const segments: OpenAISegment[] = [];
    const lines = transcription.split('\n');
    let currentTime = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const speakerPatterns = [
        /^\[([^\]]+)\]:\s*(.+)$/,
        /^\[([^\]]+)\]\s*(.+)$/,
        /^([^:]+):\s*(.+)$/,
        /^(Speaker\s+\d+):\s*(.+)$/i
      ];

      let matched = false;
      for (const pattern of speakerPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const speaker = match[1].trim();
          const text = match[2].trim();
          
          if (text.length > 0) {
            const duration = Math.max(30, text.length * 0.08);
            segments.push({
              start: currentTime,
              end: currentTime + duration,
              text: text,
              speaker: speaker
            });
            
            currentTime += duration;
            matched = true;
            break;
          }
        }
      }

      if (!matched && trimmedLine.length > 0) {
        const duration = Math.max(20, trimmedLine.length * 0.08);
        segments.push({
          start: currentTime,
          end: currentTime + duration,
          text: trimmedLine,
          speaker: 'Unknown Speaker'
        });
        
        currentTime += duration;
      }
    }

    console.log('👥 Parsed', segments.length, 'segments with speakers');
    return segments;
  }

  private detectLanguage(text: string): string {
    // Enhanced language detection for French and English
    const languagePatterns = {
      'French': /\b(le|la|les|de|et|à|un|une|ce|que|qui|dans|pour|avec|sur|par|du|des|au|aux|est|sont|avoir|être|mais|tout|vous|ils|nous|comme|peut|plus|temps|très|bien|encore|aussi|autre|après|deux|même|faire|dire|ici|où|comment|pourquoi|quand|alors|depuis|pendant|avant|maintenant|toujours|jamais|souvent|parfois)\b/gi,
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

    console.log('🌍 Detected language:', detectedLanguage);
    return detectedLanguage;
  }
}

export class OpenAIServiceFactory {
  private static instance: OpenAIService | null = null;

  static create(apiKey?: string, modelName?: string): OpenAIService {
    if (!OpenAIServiceFactory.instance || apiKey || modelName) {
      OpenAIServiceFactory.instance = new OpenAIService(apiKey, modelName);
    }
    return OpenAIServiceFactory.instance;
  }

  static getInstance(): OpenAIService | null {
    return OpenAIServiceFactory.instance;
  }
}