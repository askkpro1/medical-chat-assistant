// Utility function to format AI responses for better readability
export function formatMedicalResponse(text: string): string {
  return (
    text
      // Replace **bold** with proper formatting
      .replace(/\*\*(.*?)\*\*/g, "$1")
      // Ensure proper spacing after numbers
      .replace(/(\d+\.)\s*/g, "$1 ")
      // Clean up multiple spaces
      .replace(/\s+/g, " ")
      // Ensure proper line breaks before numbered items
      .replace(/(\d+\.)/g, "\n$1")
      // Clean up the start
      .trim()
  )
}

// Format text for display with proper line breaks and structure
export function formatForDisplay(text: string): string {
  return (
    text
      // Remove markdown bold formatting
      .replace(/\*\*(.*?)\*\*/g, "$1")
      // Ensure proper spacing
      .replace(/\s+/g, " ")
      // Add line breaks before numbered items
      .replace(/(\d+\.)/g, "\n$1")
      // Add line breaks before bullet points
      .replace(/([.!?])\s*([•·-])/g, "$1\n$2")
      // Clean up
      .trim()
  )
}
