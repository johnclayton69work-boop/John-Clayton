
export const getApiErrorMessage = (error: any, componentName: string): string => {
  console.error(`Error in ${componentName}:`, error);

  const defaultMessage = `An unexpected error occurred in ${componentName}. Please try again.`;
  
  if (!error) return defaultMessage;

  // The error from the SDK might have a 'message' property that is a JSON string
  // or it might be an object with response data.
  let messageSource = '';
  if (typeof error.message === 'string') {
      messageSource = error.message;
  } else if (error.toString) {
      messageSource = error.toString();
  }

  const message = messageSource.toLowerCase();

  if (message.includes('quota') || message.includes('resource_exhausted')) {
    return 'You have exceeded your API usage quota. Please check your plan and billing details, or try again later. For more information, visit https://ai.google.dev/gemini-api/docs/rate-limits.';
  }
  
  if (message.includes("requested entity was not found") || message.includes("api key not valid")) {
    return "Your API key appears to be invalid or missing required permissions. Please select a valid key to continue.";
  }

  // Try to parse for a cleaner message from a JSON string in the message
  try {
      const parsedError = JSON.parse(error.message);
      if (parsedError?.error?.message) {
          // Recurse once to check the nested message for keywords
          const nestedMessage = parsedError.error.message.toLowerCase();
          if (nestedMessage.includes('quota')) {
              return 'You have exceeded your API usage quota. Please check your plan and billing details, or try again later. For more information, visit https://ai.google.dev/gemini-api/docs/rate-limits.';
          }
           if (nestedMessage.includes("api key not valid")) {
              return "Your API key appears to be invalid or missing required permissions. Please select a valid key to continue.";
           }
          return parsedError.error.message;
      }
  } catch (e) {
      // It's not a JSON string.
      // If the original message is short and readable, use it.
      if (error.message && error.message.length < 200 && !error.message.startsWith('{')) {
          return error.message;
      }
  }

  return defaultMessage;
};

export const isInvalidApiKeyError = (error: any): boolean => {
    if (!error) return false;
    let messageSource = '';
    if (typeof error.message === 'string') {
        messageSource = error.message;
    } else if (error.toString) {
        messageSource = error.toString();
    }
    const message = messageSource.toLowerCase();
    return message.includes("requested entity was not found") || message.includes("api key not valid");
}
