import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiTranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  segments?: GeminiSegment[];
  keyPoints?: string[];
}

export interface GeminiSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.modelName = modelName || 'gemini-2.5-flash'; // Default to 2.5 Flash
      console.log(`🔧 Gemini service initialized with API key and model: ${this.modelName}`);
    } else {
      this.modelName = 'gemini-2.5-flash';
    }
  }

  isConfigured(): boolean {
    return !!this.genAI && !!this.apiKey;
  }

  async transcribeFile(
    audioFile: File,
    options: {
      language?: string;
      extractKeyPoints?: boolean;
      detectSpeakers?: boolean;
      prompt?: string;
    } = {}
  ): Promise<GeminiTranscriptionResult> {
    if (!this.genAI) {
      throw new Error('Gemini service not configured. Please provide a Google AI API key.');
    }

    try {
      console.log(`🎵 Starting ${this.modelName} transcription for:`, audioFile.name);
      console.log('📊 File size:', (audioFile.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('📊 File type:', audioFile.type);
      
      // Validate file size - use Files API for files > 20MB only if available
      const maxInlineSizeBytes = 20 * 1024 * 1024; // 20MB
      if (audioFile.size > maxInlineSizeBytes) {
        console.log('📁 File too large for inline data, checking Files API availability...');
        
        // Check if Files API is available
        if (this.genAI.files && typeof this.genAI.files.upload === 'function') {
          console.log('✅ Files API available, using Files API...');
          return await this.transcribeFileWithFilesAPI(audioFile, options);
        } else {
          console.warn('⚠️ Files API not available, attempting inline transcription anyway...');
          console.warn('⚠️ This may fail due to file size limitations');
          // Continue with inline method despite size - let Gemini handle the error
        }
      }

      // Validate file type
      const supportedTypes = [
        'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/aac',
        'audio/ogg', 'audio/flac', 'audio/webm', 'video/mp4', 'video/mpeg',
        'video/mov', 'video/avi', 'video/x-flv', 'video/mpg', 'video/webm'
      ];
      
      if (!supportedTypes.includes(audioFile.type)) {
        console.warn('⚠️ File type not in supported list, but attempting transcription:', audioFile.type);
      }

      // Convert audio file to base64 for inline data
      const audioBase64 = await this.fileToBase64(audioFile);
      console.log('🔄 File converted to base64');
      
      // Use the specified model for transcription
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent transcription
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });

      // Build optimized transcription prompt
      const transcriptionPrompt = this.buildOptimizedTranscriptionPrompt(options);
      console.log('📝 Optimized transcription prompt built');

      console.log(`🚀 Sending request to ${this.modelName}...`);
      
      // Create the request with proper MIME type using the correct API format
      const mimeType = this.detectMimeType(audioFile);
      console.log('🔍 Detected MIME type:', mimeType);

      // Use the correct API format with single user role containing all parts
      const contents = [
        {
          role: 'user',
          parts: [
            { text: transcriptionPrompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64,
              }
            }
          ]
        }
      ];

      const result = await model.generateContent({ contents });
      const response = await result.response;
      const transcriptionText = response.text();

      console.log(`✅ ${this.modelName} transcription completed`);
      console.log('📄 Transcription length:', transcriptionText.length, 'characters');

      // Parse response to extract different information
      const parsedResult = this.parseGeminiResponse(transcriptionText, options);

      return {
        text: parsedResult.text,
        language: parsedResult.language || this.detectLanguage(parsedResult.text),
        confidence: parsedResult.confidence || 0.96,
        segments: parsedResult.segments,
        keyPoints: parsedResult.keyPoints
      };

    } catch (error) {
      console.error(`❌ Error during ${this.modelName} transcription:`, error);
      
      // Analyze error type with more specific error handling
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('429')) {
          throw new Error('API quota exceeded. Check your API key or increase your quota.');
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Invalid API key or insufficient permissions.');
        } else if (error.message.includes('400')) {
          throw new Error('Invalid request. Please check file format and size.');
        } else if (error.message.includes('413')) {
          throw new Error('File too large. Maximum size is 20MB for inline data.');
        } else if (error.message.includes('415')) {
          throw new Error('Unsupported media type. Please use supported audio/video formats.');
        } else if (error.message.includes('500')) {
          throw new Error('Gemini service temporarily unavailable. Please try again later.');
        }
      }
      
      throw new Error(`${this.modelName} transcription error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transcribeFileWithFilesAPI(
    audioFile: File,
    options: {
      language?: string;
      extractKeyPoints?: boolean;
      detectSpeakers?: boolean;
      prompt?: string;
    } = {},
    onProgressUpdate?: (step: string, progress: number) => void
  ): Promise<GeminiTranscriptionResult> {
    if (!this.genAI) {
      throw new Error('Gemini service not configured.');
    }

    // Check if Files API is available
    if (!this.genAI.files || typeof this.genAI.files.upload !== 'function') {
      throw new Error('Files API is not available in this version of @google/generative-ai. Please update to version 0.12.0 or newer, or use smaller files (under 20MB).');
    }

    let uploadedFileName: string | null = null;

    try {
      console.log(`📁 Using Files API for large file transcription with ${this.modelName}...`);
      console.log('📊 File size:', (audioFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Step 1: Upload file using Files API
      console.log('⬆️ Uploading file to Gemini Files API...');
      onProgressUpdate?.('Uploading to Gemini Files API...', 20);
      
      // Detect proper MIME type
      const mimeType = this.detectMimeType(audioFile);
      console.log('🔍 Using MIME type:', mimeType);
      
      // Upload file using the Files API with the new format
      const uploadResult = await this.genAI.files.upload({
        file: audioFile,
        config: { 
          mimeType: mimeType,
          displayName: audioFile.name
        }
      });
      
      uploadedFileName = uploadResult.name;
      console.log('✅ File uploaded successfully');
      console.log('📄 File URI:', uploadResult.uri);
      console.log('📄 File name:', uploadResult.name);
      
      // Step 2: Wait for file processing (if needed)
      console.log('⏳ Waiting for file processing...');
      onProgressUpdate?.('Server-side file processing...', 40);
      
      let fileInfo = uploadResult;
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts = 5 minutes max
      
      while (fileInfo.state === 'PROCESSING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        try {
          fileInfo = await this.genAI.files.get(uploadResult.name);
          console.log(`📊 File processing status: ${fileInfo.state} (attempt ${attempts + 1}/${maxAttempts})`);
          onProgressUpdate?.(`Processing file on server... (${attempts + 1}/${maxAttempts})`, 40 + (attempts / maxAttempts) * 30);
        } catch (error) {
          console.warn('⚠️ Error checking file status, continuing...', error);
          break;
        }
        
        attempts++;
      }
      
      if (fileInfo.state === 'PROCESSING') {
        console.warn('⚠️ File still processing after maximum wait time, proceeding anyway...');
      } else if (fileInfo.state === 'FAILED') {
        throw new Error('File processing failed on Gemini servers');
      } else {
        console.log('✅ File processing completed');
      }
      
      // Step 3: Generate content using the uploaded file
      console.log(`🚀 Generating transcription with uploaded file using ${this.modelName}...`);
      onProgressUpdate?.('Audio transcription (Files API)...', 70);
      
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });
      
      // Build transcription prompt
      const transcriptionPrompt = this.buildOptimizedTranscriptionPrompt(options);
      
      // Create content request with file reference using the correct API format with single user role
      const contents = [
        {
          role: 'user',
          parts: [
            { text: transcriptionPrompt },
            {
              fileData: {
                mimeType: fileInfo.mimeType,
                fileUri: fileInfo.uri
              }
            }
          ]
        }
      ];

      const result = await model.generateContent({ contents });
      const response = await result.response;
      const transcriptionText = response.text();
      
      console.log(`✅ ${this.modelName} transcription completed via Files API`);
      console.log('📄 Transcription length:', transcriptionText.length, 'characters');
      
      // Parse response
      const parsedResult = this.parseGeminiResponse(transcriptionText, options);
      
      // Step 4: Keep cleanup step in progress until the very end
      console.log('🗑️ Starting cleanup process...');
      onProgressUpdate?.('Cleaning up uploaded file...', 90);
      
      // Simulate extended cleanup time to show the progress bar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 5: Clean up - delete the uploaded file
      try {
        await this.genAI.files.delete(uploadResult.name);
        console.log('🗑️ Uploaded file cleaned up successfully');
        onProgressUpdate?.('Cleanup completed', 100);
      } catch (error) {
        console.warn('⚠️ Could not delete uploaded file:', error);
        onProgressUpdate?.('Cleanup completed (with warnings)', 100);
      }
      
      return {
        text: parsedResult.text,
        language: parsedResult.language || this.detectLanguage(parsedResult.text),
        confidence: parsedResult.confidence || 0.96,
        segments: parsedResult.segments,
        keyPoints: parsedResult.keyPoints
      };
      
    } catch (error) {
      console.error(`❌ Error with Files API transcription using ${this.modelName}:`, error);
      
      // Clean up uploaded file in case of error
      if (uploadedFileName && this.genAI?.files) {
        try {
          await this.genAI.files.delete(uploadedFileName);
          console.log('🗑️ Uploaded file cleaned up after error');
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up uploaded file after error:', cleanupError);
        }
      }
      
      // Enhanced error handling for Files API
      if (error instanceof Error) {
        if (error.message.includes('Files API is not available')) {
          throw error; // Re-throw our custom error message
        } else if (error.message.includes('quota') || error.message.includes('429')) {
          throw new Error('API quota exceeded. Check your API key or increase your quota.');
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Invalid API key or insufficient permissions for Files API.');
        } else if (error.message.includes('413') || error.message.includes('file too large')) {
          throw new Error('File too large even for Files API. Please use a smaller file.');
        } else if (error.message.includes('415') || error.message.includes('unsupported')) {
          throw new Error('Unsupported file format for Files API.');
        } else if (error.message.includes('processing failed')) {
          throw new Error('File processing failed on Gemini servers. Please try again or use a different file.');
        }
      }
      
      throw new Error(`Files API transcription error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  ): Promise<GeminiTranscriptionResult> {
    if (!this.genAI) {
      throw new Error('Gemini service not configured. Please provide a Google AI API key.');
    }

    try {
      console.log('🌐 Downloading audio from:', audioUrl);
      
      // Download audio file from URL with proper headers
      const response = await fetch(audioUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GeminiTranscriber/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Unable to download audio: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      const audioBlob = await response.blob();
      
      // Create file with proper type
      const fileName = audioUrl.split('/').pop()?.split('?')[0] || 'audio';
      const audioFile = new File([audioBlob], fileName, { type: contentType });
      
      console.log('📥 Audio downloaded, size:', (audioFile.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('📥 Content type:', contentType);

      // Use file transcription method (will automatically choose inline vs Files API)
      return await this.transcribeFile(audioFile, options);

    } catch (error) {
      console.error('❌ Error during URL transcription:', error);
      throw new Error(`URL transcription error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildOptimizedTranscriptionPrompt(options: {
    language?: string;
    extractKeyPoints?: boolean;
    detectSpeakers?: boolean;
    prompt?: string;
  }): string {
    // Build prompt following Google's best practices for audio transcription
    let prompt = `Generate a transcript of the speech in this audio file.

INSTRUCTIONS:
- Provide a complete, word-for-word transcription
- Maintain natural punctuation and capitalization
- Preserve the original language of the audio`;

    // Language specification
    if (options.language) {
      if (options.language === 'fr') {
        prompt += `
- The audio is expected to be in French`;
      } else if (options.language === 'en') {
        prompt += `
- The audio is expected to be in English`;
      }
    } else {
      prompt += `
- Detect the language automatically (French or English expected)`;
    }

    // Speaker detection
    if (options.detectSpeakers) {
      prompt += `
- Identify different speakers and label them as [Speaker 1], [Speaker 2], etc.
- Use consistent speaker labels throughout the transcription
- Format: [Speaker X]: [their words]
- If you can identify speaker characteristics (gender, role), mention them briefly`;
    }

    // Key points extraction
    if (options.extractKeyPoints) {
      prompt += `
- After the transcription, extract key points and important topics discussed
- Focus on main themes, important decisions, and actionable insights`;
    }

    prompt += `

OUTPUT FORMAT:
TRANSCRIPTION:
[Provide the complete transcription here]

LANGUAGE:
[Detected language: French or English]`;

    if (options.detectSpeakers) {
      prompt += `

SPEAKERS:
[List of identified speakers with brief descriptions if possible]`;
    }

    if (options.extractKeyPoints) {
      prompt += `

KEY_POINTS:
[List the main points discussed, one per line with - prefix]`;
    }

    if (options.prompt) {
      prompt += `

ADDITIONAL_INSTRUCTIONS:
${options.prompt}`;
    }

    prompt += `

Please ensure accuracy and completeness in your transcription. Focus on clarity and proper formatting.`;

    return prompt;
  }

  private detectMimeType(file: File): string {
    // Map file extensions to proper MIME types for Gemini
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeTypeMap: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'webm': 'audio/webm',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'flv': 'video/x-flv',
      'mpg': 'video/mpeg',
      'mpeg': 'video/mpeg'
    };

    // Use file's MIME type if available and valid, otherwise use extension mapping
    if (file.type && file.type !== 'application/octet-stream') {
      return file.type;
    }

    if (extension && mimeTypeMap[extension]) {
      return mimeTypeMap[extension];
    }

    // Default fallback
    return 'audio/mpeg';
  }

  private parseGeminiResponse(response: string, options: any): {
    text: string;
    language?: string;
    confidence?: number;
    segments?: GeminiSegment[];
    keyPoints?: string[];
  } {
    console.log(`🔍 Parsing ${this.modelName} response...`);
    
    const sections = {
      transcription: '',
      language: '',
      speakers: '',
      keyPoints: ''
    };

    // Parse different sections of the response with improved regex
    const transcriptionMatch = response.match(/TRANSCRIPTION:\s*([\s\S]*?)(?=\n(?:LANGUAGE|SPEAKERS|KEY_POINTS|$))/i);
    if (transcriptionMatch) {
      sections.transcription = transcriptionMatch[1].trim();
      console.log('📝 Transcription section found:', sections.transcription.length, 'characters');
    }

    const languageMatch = response.match(/LANGUAGE:\s*(.*?)(?=\n|$)/i);
    if (languageMatch) {
      sections.language = languageMatch[1].trim();
      console.log('🌍 Language detected:', sections.language);
    }

    const speakersMatch = response.match(/SPEAKERS:\s*([\s\S]*?)(?=\n(?:KEY_POINTS|$))/i);
    if (speakersMatch) {
      sections.speakers = speakersMatch[1].trim();
      console.log('👥 Speakers section found');
    }

    const keyPointsMatch = response.match(/KEY_POINTS:\s*([\s\S]*?)$/i);
    if (keyPointsMatch) {
      sections.keyPoints = keyPointsMatch[1].trim();
      console.log('🎯 Key points found');
    }

    // If no structured response, use entire response as transcription
    if (!sections.transcription) {
      sections.transcription = response;
      console.log('⚠️ No structure detected, using entire response');
    }

    // Parse segments with speakers if detection enabled
    let segments: GeminiSegment[] = [];
    if (options.detectSpeakers && sections.transcription) {
      segments = this.parseSegmentsWithSpeakers(sections.transcription);
      console.log('👥 Segments with speakers parsed:', segments.length);
    }

    // Parse key points with improved extraction
    let keyPoints: string[] = [];
    if (sections.keyPoints) {
      keyPoints = sections.keyPoints
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(point => point.length > 10); // Filter out very short points
      console.log('🎯 Key points extracted:', keyPoints.length);
    }

    return {
      text: sections.transcription,
      language: sections.language,
      confidence: 0.96, // Gemini models have high confidence
      segments: segments.length > 0 ? segments : undefined,
      keyPoints: keyPoints.length > 0 ? keyPoints : undefined
    };
  }

  private parseSegmentsWithSpeakers(transcription: string): GeminiSegment[] {
    const segments: GeminiSegment[] = [];
    const lines = transcription.split('\n');
    let currentTime = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Look for various speaker patterns: [Speaker X], [Name], Speaker X:, Name:
      const speakerPatterns = [
        /^\[([^\]]+)\]:\s*(.+)$/,           // [Speaker 1]: text
        /^\[([^\]]+)\]\s*(.+)$/,            // [Speaker 1] text
        /^([^:]+):\s*(.+)$/,                // Speaker 1: text
        /^(Speaker\s+\d+):\s*(.+)$/i        // Speaker 1: text (case insensitive)
      ];

      let matched = false;
      for (const pattern of speakerPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const speaker = match[1].trim();
          const text = match[2].trim();
          
          if (text.length > 0) {
            const duration = Math.max(30, text.length * 0.08); // More realistic timing
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

      // If no speaker pattern matched, treat as continuation or unknown speaker
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

    return segments;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:audio/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  private detectLanguage(text: string): string {
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

  // Method to extract key points from existing transcription
  async extractKeyPoints(transcription: string): Promise<string[]> {
    if (!this.genAI) {
      throw new Error('Gemini service not configured.');
    }

    try {
      console.log(`🎯 Extracting key points with ${this.modelName}...`);
      
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      });
      
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

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt }
            ]
          }
        ]
      });
      const response = await result.response;
      const keyPointsText = response.text();

      const keyPoints = keyPointsText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(point => point.length > 0);

      console.log('✅ Key points extracted:', keyPoints.length);
      return keyPoints;

    } catch (error) {
      console.error('❌ Error during key points extraction:', error);
      return [];
    }
  }

  // Method to generate content based on transcription
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
    if (!this.genAI) {
      throw new Error('Gemini service not configured.');
    }

    try {
      console.log(`📝 Generating content with ${this.modelName}...`);
      console.log('🎯 Format:', settings.format, '| Tone:', settings.tone);
      
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: {
          temperature: 0.7, // Higher temperature for creative content generation
          topP: 0.9,
          maxOutputTokens: 4096,
        }
      });
      
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

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt }
            ]
          }
        ]
      });
      const response = await result.response;
      const generatedContent = response.text();
      
      console.log('✅ Content generated:', generatedContent.length, 'characters');
      return generatedContent;

    } catch (error) {
      console.error('❌ Error during content generation:', error);
      throw new Error(`Content generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Method to count tokens in content
  async countTokens(content: string): Promise<number> {
    if (!this.genAI) {
      throw new Error('Gemini service not configured.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      const countTokensResponse = await model.countTokens({
        contents: [{ role: 'user', parts: [{ text: content }] }]
      });
      
      return countTokensResponse.totalTokens || 0;
    } catch (error) {
      console.error('❌ Error counting tokens:', error);
      // Fallback estimation: roughly 4 characters per token
      return Math.floor(content.length / 4);
    }
  }
}

// Service factory to create Gemini instance
export class GeminiServiceFactory {
  private static instance: GeminiService | null = null;

  static create(apiKey?: string, modelName?: string): GeminiService {
    if (!GeminiServiceFactory.instance || apiKey || modelName) {
      GeminiServiceFactory.instance = new GeminiService(apiKey, modelName);
    }
    return GeminiServiceFactory.instance;
  }

  static getInstance(): GeminiService | null {
    return GeminiServiceFactory.instance;
  }
}