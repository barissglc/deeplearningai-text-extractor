// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "copyTexts") {
    try {
      // Select paragraphs with the "text-neutral" class
      const paragraphs = document.querySelectorAll('p.text-neutral');
      
      if (paragraphs.length === 0) {
        sendResponse({ 
          success: false, 
          message: "No text-neutral content found on this page. Please click the transcript button and try again." 
        });
        return;
      }

      // Collect and clean texts
      const texts = Array.from(paragraphs)
        .map(p => p.innerText.trim())
        .filter(text => text.length > 0);

      // Combine texts
      const combinedText = texts.join('\n\n');

      // Return success response
      sendResponse({ 
        success: true, 
        text: combinedText,
        count: texts.length,
        message: `${texts.length} texts successfully collected.`
      });

    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({ 
        success: false, 
        message: "An error occurred while collecting texts." 
      });
    }
  }
  return true; // Necessary for asynchronous responses
});
