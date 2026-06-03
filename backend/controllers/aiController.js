import { generateGeminiExplanation } from '../services/geminiService.js';

export async function explainQuestion(req, res, next) {
  try {
    const {
      questionText,
      options,
      correctOptionIndex,
      userAnswerIndex,
      subject,
      topic,
      difficulty,
      conceptualTags,
    } = req.body;

    // Validate request inputs
    if (
      !questionText ||
      !options ||
      options.length < 4 ||
      correctOptionIndex === undefined ||
      userAnswerIndex === undefined ||
      !subject ||
      !topic ||
      !difficulty
    ) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid payload. Ensure all question details, correct index, and user answer index are provided.'
      });
    }

    console.log(`[AI] Generating explanation for subject="${subject}", topic="${topic}", correct=${correctOptionIndex === userAnswerIndex}`);

    let explanation;
    try {
      explanation = await generateGeminiExplanation({
        questionText,
        options,
        correctOptionIndex,
        userAnswerIndex,
        subject,
        topic,
        difficulty,
        conceptualTags: conceptualTags || [],
      });
    } catch (apiError) {
      console.error('[AI SDK Error]', apiError);
      
      // Secondary check: If API Key is missing or invalid, fail gracefully with useful error
      if (apiError.message.includes('GEMINI_API_KEY')) {
        return res.status(401).json({
          error: 'Configuration Error',
          message: 'Gemini API Key is not set on the server. Please add it to your backend environment settings.',
        });
      }

      throw apiError; // bubble up to general catch block
    }

    return res.status(200).json({ explanation });
  } catch (error) {
    next(error);
  }
}
