t# Interview Bot Role-Based Interview Enhancement

## Completed Tasks

- [x] Modify frontend Chatbot.jsx to start with asking user's name first
- [x] Add state management for awaitingName, awaitingRole, userName, and userRole
- [x] Implement handleNameInput function to process name input and ask for role
- [x] Implement handleRoleInput function to process role input and start interview
- [x] Update UI to show only questions in chat, greetings in voice only
- [x] Update handleSendMessage to include role in API calls
- [x] Update UI elements (placeholder text, button text) to reflect name/role input vs answer input
- [x] Update backend answer.js to provide point-formatted explanations when candidate doesn't know answer
- [x] Verify question.js already supports role parameter (confirmed it does)
- [x] Improve TTS functionality with better error handling and fallback settings
- [x] Update ElevenLabs client with proper API parameters and timeout handling

## Summary

The chatbot now follows a complete personalized flow:
1. Asks for user's name (voice only)
2. Asks for role with personalized greeting (voice only)
3. Welcomes user by name and confirms role (voice only)
4. Shows only interview questions in the chat interface
5. Provides point-formatted explanations when candidates don't know answers

TTS has been improved with:
- Better error handling for API failures and audio playback issues
- Proper fallback to browser TTS with optimized settings (rate, pitch, volume)
- Timeout handling in ElevenLabs client
- Correct API parameters for ElevenLabs v1 endpoint
