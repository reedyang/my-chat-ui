/**
 * Generate a chat session title using AI model
 */
export async function generateTitleWithAI(content: string, model: string, ollamaService: any): Promise<string> {
  try {
    const prompt = `Generate a concise title (10-30 characters) for this conversation based on the user's message:

User message: ${content}

Requirements:
- Keep it short and descriptive
- No quotes or special symbols
- Extract the main topic or intent
- Chinese response preferred

Title:`

    const response = await ollamaService.generateCompletion(model, [
      { id: 'temp', sessionId: 'temp', role: 'user', content: prompt, timestamp: new Date() }
    ], {
      temperature: 0.3, // 较低温度确保标题稳定
      maxTokens: 50
    })

    console.log(`AI generated raw response: "${response}"`)

    // Extract and clean the generated title
    let title = response.trim()
    
    // Remove common prefixes
    title = title.replace(/^(标题：|Title:\s*|答：|回答：)/i, '').trim()
    
    // Remove quotes if present
    title = title.replace(/^["']|["']$/g, '').trim()
    
    // Remove newlines
    title = title.split('\n')[0].trim()
    
    // Limit length
    if (title.length > 30) {
      const breakPoints = [' ', '，', ',', '、', '的', '了', '？', '?']
      let bestBreak = 27
      
      for (const breakPoint of breakPoints) {
        const index = title.lastIndexOf(breakPoint, 27)
        if (index > 10) {
          bestBreak = index
          break
        }
      }
      
      title = title.substring(0, bestBreak) + '...'
    }
    
    console.log(`Processed AI title: "${title}"`)
    
    // Fallback to simple generation if result is too short or empty
    if (!title || title.length < 3) {
      console.log('AI title too short, falling back to simple method')
      return generateTitleFromMessage(content)
    }
    
    return title
    
  } catch (error) {
    console.warn('AI title generation failed, falling back to simple method:', error)
    return generateTitleFromMessage(content)
  }
}

/**
 * Simple fallback title generation from the first user message
 */
export function generateTitleFromMessage(content: string): string {
  // Clean the content
  const cleaned = content.trim()
  
  if (!cleaned) {
    return '新对话'
  }
  
  // Simple title generation strategies:
  
  // 1. If it's a question, keep it as is (up to 30 chars)
  if (cleaned.includes('?') || cleaned.includes('？')) {
    return cleaned.length <= 30 ? cleaned : cleaned.substring(0, 27) + '...'
  }
  
  // 2. If it starts with common action words, extract the key part
  const actionPatterns = [
    /^(请|帮我|帮忙|能否|可以|如何|怎么|怎样)(.*)/,
    /^(写|创建|生成|制作|设计|开发)(.*)/,
    /^(解释|说明|介绍|告诉我)(.*)/,
    /^(翻译|转换|转化)(.*)/,
  ]
  
  for (const pattern of actionPatterns) {
    const match = cleaned.match(pattern)
    if (match && match[2]) {
      const extracted = match[2].trim()
      if (extracted.length > 0) {
        const title = extracted.length <= 25 ? extracted : extracted.substring(0, 22) + '...'
        return title
      }
    }
  }
  
  // 3. Extract first sentence or clause
  const sentences = cleaned.split(/[。！？.!?]/)
  if (sentences.length > 1 && sentences[0].length > 0) {
    const firstSentence = sentences[0].trim()
    return firstSentence.length <= 30 ? firstSentence : firstSentence.substring(0, 27) + '...'
  }
  
  // 4. Use first few words (up to 30 characters)
  if (cleaned.length <= 30) {
    return cleaned
  }
  
  // Find a good breaking point (space, comma, etc.)
  const breakPoints = [' ', '，', ',', '、']
  let bestBreak = 27
  
  for (const breakPoint of breakPoints) {
    const index = cleaned.lastIndexOf(breakPoint, 27)
    if (index > 10) { // At least 10 characters
      bestBreak = index
      break
    }
  }
  
  return cleaned.substring(0, bestBreak) + '...'
}

/**
 * Validate title before updating
 */
export function validateTitle(title: string): { valid: boolean; message?: string } {
  const trimmed = title.trim()
  
  if (!trimmed) {
    return { valid: false, message: 'Title cannot be empty' }
  }
  
  if (trimmed.length > 100) {
    return { valid: false, message: 'Title must be less than 100 characters' }
  }
  
  return { valid: true }
}

/**
 * Clean and normalize title for storage
 */
export function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ')
} 