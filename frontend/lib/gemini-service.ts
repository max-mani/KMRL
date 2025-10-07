interface TrainData {
  trainId: string;
  score: number;
  factors?: {
    fitness?: { score: number; status: string };
    jobCard?: { score: number; status: string };
    branding?: { score: number; status: string };
    mileage?: { score: number; status: string };
    cleaning?: { score: number; status: string };
    geometry?: { score: number; status: string };
  };
  inductionStatus?: string;
  cleaningSlot?: number;
  stablingBay?: number;
  reason?: string;
}

interface CalculatedData {
  depot: string;
  cleaningSlot: number;
  stablingPosition: string;
}

export class GeminiService {
  private static apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  private static baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  static async calculateTrainData(trainData: TrainData[]): Promise<CalculatedData[]> {
    if (!this.apiKey) {
      console.warn('Gemini API key not found, using fallback data');
      return this.getFallbackData(trainData);
    }

    try {
      const prompt = this.createPrompt(trainData);
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!result) {
        throw new Error('No response from Gemini API');
      }

      return this.parseGeminiResponse(result, trainData);
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackData(trainData);
    }
  }

  private static createPrompt(trainData: TrainData[]): string {
    return `
You are an AI assistant for Kochi Metro Rail Limited (KMRL) fleet optimization system. 
Analyze the following train data and calculate optimal depot assignments, cleaning slots, and stabling positions for Kochi Metro operations.

Train Data:
${trainData.map(train => `
Train ID: ${train.trainId}
Score: ${train.score}
Status: ${train.inductionStatus || 'unknown'}
Fitness: ${train.factors?.fitness?.score || 0}
Job Card: ${train.factors?.jobCard?.score || 0}
Branding: ${train.factors?.branding?.score || 0}
Mileage: ${train.factors?.mileage?.score || 0}
Cleaning: ${train.factors?.cleaning?.score || 0}
Geometry: ${train.factors?.geometry?.score || 0}
`).join('\n')}

Requirements for Kochi Metro:
1. Depot: Assign to "Muttom Depot" (primary depot for Kochi Metro)
2. Cleaning Slot: Assign time slots based on train score and cleaning factor
   - High priority trains (score ≥80): Slots 1-3 (10:00 PM - 1:00 AM)
   - Medium priority trains (score 60-79): Slots 4-6 (1:00 AM - 4:00 AM)  
   - Low priority trains (score <60): Slots 7-8 (4:00 AM - 6:00 AM)
3. Stabling Position: Assign to specific tracks in Muttom Depot
   - Format: Track-[Number] (e.g., Track-1, Track-2, Track-15)
   - Higher scoring trains get tracks closer to service area (1-10)
   - Lower scoring trains get maintenance tracks (11-20)

Rules:
- All trains are assigned to Muttom Depot (Kochi Metro's main depot)
- Cleaning slots are time-based for overnight maintenance
- Stabling positions use track numbers for operational efficiency
- Consider train scores and geometry factors for optimal placement

Return ONLY a JSON array with this exact format:
[
  {
    "trainId": "T001",
    "depot": "Muttom Depot",
    "cleaningSlot": 1,
    "stablingPosition": "Track-1"
  }
]

Do not include any other text or formatting.
`;
  }

  private static parseGeminiResponse(response: string, trainData: TrainData[]): CalculatedData[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and map to our format
      return parsed.map((item: any) => ({
        depot: item.depot || 'Kochi Metro Depot',
        cleaningSlot: parseInt(item.cleaningSlot) || 1,
        stablingPosition: item.stablingPosition || 'Bay-A1'
      }));
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return this.getFallbackData(trainData);
    }
  }

  private static getFallbackData(trainData: TrainData[]): CalculatedData[] {
    return trainData.map((train, index) => {
      // Calculate cleaning slot based on score (time-based slots for Kochi Metro)
      let cleaningSlot: number;
      if (train.score >= 80) {
        cleaningSlot = (index % 3) + 1; // Slots 1-3 (10:00 PM - 1:00 AM)
      } else if (train.score >= 60) {
        cleaningSlot = (index % 3) + 4; // Slots 4-6 (1:00 AM - 4:00 AM)
      } else {
        cleaningSlot = (index % 2) + 7; // Slots 7-8 (4:00 AM - 6:00 AM)
      }
      
      // Calculate stabling position based on score (track numbers in Muttom Depot)
      let trackNumber: number;
      if (train.score >= 70) {
        trackNumber = (index % 10) + 1; // Tracks 1-10 (service area)
      } else {
        trackNumber = (index % 10) + 11; // Tracks 11-20 (maintenance area)
      }
      
      return {
        depot: 'Muttom Depot',
        cleaningSlot: Math.min(cleaningSlot, 8),
        stablingPosition: `Track-${trackNumber}`
      };
    });
  }
}
