/**
 * Generate a chat session title using AI model
 */
export async function generateTitleWithAI(content: string, model: string, ollamaService: any): Promise<string> {
  try {
    // Clean the content by removing <think></think> tags and their content
    let cleanedContent = content
    
    // Remove <think></think> tags and their content
    cleanedContent = cleanedContent.replace(/<think[^>]*>[\s\S]*?<\/think>/gi, '')
    
    // Remove incomplete <think> tags at the end
    cleanedContent = cleanedContent.replace(/<think[^>]*>[\s\S]*$/gi, '')
    
    // Clean up extra whitespace
    cleanedContent = cleanedContent.trim()
    
    // If content is empty after cleaning, use fallback
    if (!cleanedContent) {
      console.log('Content empty after removing think tags, using fallback')
      return generateTitleFromMessage(content)
    }
    
    const prompt = `Generate a concise title (10-30 characters) for this conversation based on the user's message:

User message: ${cleanedContent}

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
    
    // Remove <think></think> tags and their content from AI response
    title = title.replace(/<think[^>]*>[\s\S]*?<\/think>/gi, '')
    
    // Remove incomplete <think> tags at the end
    title = title.replace(/<think[^>]*>[\s\S]*$/gi, '')
    
    // Remove common prefixes
    title = title.replace(/^(标题：|Title:\s*|答：|回答：)/i, '').trim()
    
    // Remove quotes if present
    title = title.replace(/^["']|["']$/g, '').trim()
    
    // Remove newlines
    title = title.split('\n')[0].trim()
    
    // If title is empty after removing think tags, use fallback
    if (!title || title.trim() === '') {
      console.log('AI title empty after removing think tags, using fallback')
      return generateTitleFromMessage(content)
    }
    
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
  // Clean the content by removing <think></think> tags and their content
  let cleaned = content
  
  // Remove <think></think> tags and their content
  cleaned = cleaned.replace(/<think[^>]*>[\s\S]*?<\/think>/gi, '')
  
  // Remove incomplete <think> tags at the end
  cleaned = cleaned.replace(/<think[^>]*>[\s\S]*$/gi, '')
  
  // Clean up extra whitespace
  cleaned = cleaned.trim()
  
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
    /^(翻译|转换|转化)(.*)/,
  ]
  
  for (const pattern of actionPatterns) {
    const match = cleaned.match(pattern)
    if (match && match[2]) {
      const extracted = match[2].trim()
      if (extracted.length > 0) {
        // 如果提取的内容太短（少于3个字符），可能不是完整的短语
        // 在这种情况下，使用原始内容
        if (extracted.length < 3) {
          const title = cleaned.length <= 30 ? cleaned : cleaned.substring(0, 27) + '...'
          return title
        }
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