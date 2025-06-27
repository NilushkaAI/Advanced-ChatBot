document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const voiceModeButton = document.getElementById('voiceModeButton');
    const transcribeVoiceButton = document.getElementById('transcribeVoiceButton');
    const documentUploadInput = document.getElementById('documentUpload');
    const uploadStatus = document.getElementById('uploadStatus');
    const voiceStatus = document.getElementById('voiceStatus');
    const messageBox = document.getElementById('messageBox');
    const themeToggleButton = document.getElementById('themeToggleButton');
    const languageSelect = document.getElementById('languageSelect');
    const newChatButton = document.getElementById('newChatButton');
    const assistantVoiceSelect = document.getElementById('assistantVoiceSelect');
    const uploadedFilesPreview = document.getElementById('uploadedFilesPreview'); // New element

    // New elements for Advanced Prompt Enhancement
    const advancedPromptCheckbox = document.getElementById('advancedPromptCheckbox');
    const promptModal = document.getElementById('promptModal');
    const modalPromptTextarea = document.getElementById('modalPromptTextarea');
    const modalSendAgainButton = document.getElementById('modalSendAgainButton');
    const modalCancelButton = document.getElementById('modalCancelButton');
    const closeModalButton = document.getElementById('closeModalButton');


    // --- Gemini API Configuration ---
    const GEMINI_API_KEY = "AIzaSyDTTqivhDq5t3WU_KMHdeXghIZvexqnoi0";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    let currentChatHistory = [];
    let voiceModeRecognition;
    let transcribeRecognition;
    let isVoiceModeListening = false;
    let isTranscribeListening = false;
    let uploadedFileContent = null; // Stores combined text content
    let uploadedFilesMetadata = []; // Stores {name, iconClass, content} for display and eventual sending
    let currentChatSessionId = null;
    let originalUserMessage = ''; // To store the original message before enhancement

    // --- Prompt Template for Advanced Enhancement ---
    const promptTemplate = `These are the List of Prompt Engineering Principles:
Define a Clear Role
→ Assign a persona or expert role to guide response tone and
knowledge level.
 
Be Specific About the Task
→ Clearly state what action you want (e.g., summarize,
explain, generate, compare, correct).
 
Provide Relevant Context
→ Add background info, previous messages, goals, or audience
details.
 
Structure the Output Format
→ Request specific formats like bullet points, lists,
tables, JSON, etc.
 
Specify the Target Audience
→ Tailor explanations to children, beginners, developers,
executives, etc.
 
Set the Tone and Style
→ Define whether it should be formal, friendly, technical,
persuasive, etc.
 
Control the Scope or Depth
→ Limit word count, time to read, technical depth, or number
of items.
 
Use Constraints and Rules
→ Define what to include, exclude, or follow (e.g., "no
jargon", "use British spelling").
 
Include Examples or Templates
→ Provide sample inputs, formats, or outputs to guide the
response.
 
Ask for Step-by-Step Reasoning
→ Improve accuracy by prompting logical breakdowns.
 
Encourage Iteration or Reflection
→ Request multiple versions, alternatives, or
self-evaluation.
 
Use Chain of Thought
→ Guide the model to think through the problem before
answering.
 
Ask Clarifying Questions
→ Instruct the model to ask if something is unclear.
 
Use Few-shot or Zero-shot Learning
→ Provide one or more examples to improve quality
(few-shot), or none (zero-shot).
 
Break Complex Prompts into Subtasks
→ Simplify goals into smaller steps for clearer execution.
 
Avoid Ambiguity
→ Remove vague words like "it", "thing",
"stuff", or unclear requests.
 
Use Positive Instructions
→ Say what to do rather than what not to do (e.g., “Use
simple words” instead of “Don’t be complex”).
 
Control Creativity vs. Accuracy
→ Set whether you want factual, imaginative, or mixed
responses.
 
Set Output Constraints
→ Limit tokens, paragraphs, time, or complexity as needed.
 
Chain Prompts for Complex Tasks
→ Use intermediate outputs to guide the next prompt in a
sequence.
 
Anchor with Keywords or Phrases
→ Mention important terms to increase focus on specific
ideas.
 
Emphasize Instructional Clarity
→ Use precise and direct commands to avoid confusion.
 
Avoid Overloading a Prompt
→ Don’t mix too many objectives in one request—split into
parts if needed.
 
Request Justification or Explanation
→ Ask “why” or “how” to increase trust and depth.
 
Test and Refine Iteratively
→ Tweak prompts based on results for continuous improvement.
 
Balance Constraints with Flexibility
→ Guide firmly but leave room for creativity or
interpretation where helpful.
 
By referring to all the above Prompt Engineering Principles,
improve the prompt and give the prompt directly without any other text: `;

    // --- Language to BCP-47 Tag Mapping for Speech Recognition & Synthesis ---
    const languageMap = {
        'English': { speechRecognition: 'en-US', speechSynthesis: 'en-US', geminiLang: 'en' },
        'Sinhala': { speechRecognition: 'si-LK', speechSynthesis: 'si-LK', geminiLang: 'si' },
        'Tamil': { speechRecognition: 'ta-LK', speechSynthesis: 'ta-LK', geminiLang: 'ta' }
    };

    // --- File Icon Mapping ---
    const fileIconMap = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'xls': 'fa-file-excel',
        'xlsx': 'fa-file-excel',
        'ppt': 'fa-file-powerpoint',
        'pptx': 'fa-file-powerpoint',
        'txt': 'fa-file-alt',
        'csv': 'fa-file-csv',
        'json': 'fa-file-code',
        'xml': 'fa-file-code',
        'html': 'fa-file-code',
        'css': 'fa-file-code',
        'js': 'fa-file-code',
        'py': 'fa-file-code',
        'c': 'fa-file-code',
        'cpp': 'fa-file-code',
        'java': 'fa-file-code',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'png': 'fa-file-image',
        'gif': 'fa-file-image',
        'zip': 'fa-file-archive',
        'rar': 'fa-file-archive',
        '7z': 'fa-file-archive',
        'mp3': 'fa-file-audio',
        'wav': 'fa-file-audio',
        'mp4': 'fa-file-video',
        'mov': 'fa-file-video',
        // Default fallback
        'default': 'fa-file'
    };

    function getFileIconClass(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        return fileIconMap[ext] || fileIconMap['default'];
    }

    // --- Initial Setup ---
    initializeChatSession();

    // --- Theme Toggle ---
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleButton.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    } else {
        themeToggleButton.querySelector('i').classList.replace('fa-sun', 'fa-moon');
    }

    themeToggleButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = themeToggleButton.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            localStorage.setItem('theme', 'light');
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    });

    // --- Message Display Utility ---
    function appendMessage(text, sender, files = []) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);

        // Avatar
        const avatarElement = document.createElement('div');
        avatarElement.classList.add('message-avatar');
        if (sender === 'user') {
            avatarElement.innerHTML = '<i class="fas fa-user"></i>'; // User icon
        } else {
            avatarElement.innerHTML = '<i class="fas fa-robot"></i>'; // Bot icon
        }
        messageElement.appendChild(avatarElement);

        const bubbleElement = document.createElement('div');
        bubbleElement.classList.add('message-bubble');

        // Add file icons if present (only for user messages)
        if (files.length > 0 && sender === 'user') {
            const filesContainer = document.createElement('div');
            filesContainer.classList.add('message-files-container');
            const filesHtml = files.map(file => `
                <div class="message-file-tag">
                    <i class="fas ${file.iconClass} file-icon"></i>
                    <span class="file-name">${file.name}</span>
                </div>
            `).join('');
            filesContainer.innerHTML = filesHtml;
            bubbleElement.appendChild(filesContainer);
        }

        // Markdown rendering for bot messages
        if (sender === 'bot') {
            const botResponseContent = document.createElement('div');
            botResponseContent.classList.add('bot-response-content');
            botResponseContent.innerHTML = marked.parse(text); // Render Markdown
            bubbleElement.appendChild(botResponseContent);

            const copyButton = document.createElement('button');
            copyButton.classList.add('copy-button');
            copyButton.innerHTML = '<i class="far fa-copy"></i>'; // Copy icon
            copyButton.title = 'Copy to clipboard';
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(text)
                    .then(() => {
                        displayStatusMessage('Copied to clipboard!', 'success');
                        copyButton.innerHTML = '<i class="fas fa-check"></i>'; // Change to check icon
                        setTimeout(() => {
                            copyButton.innerHTML = '<i class="far fa-copy"></i>'; // Revert after a short delay
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                        displayStatusMessage('Failed to copy text.', 'error');
                    });
            });
            bubbleElement.appendChild(copyButton);

        } else {
            const textParagraph = document.createElement('p');
            textParagraph.innerHTML = text; // User input can contain simple HTML (like line breaks) but not full Markdown
            bubbleElement.appendChild(textParagraph);
        }
        
        messageElement.appendChild(bubbleElement);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function displayStatusMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
            messageBox.textContent = '';
            messageBox.className = 'message-box';
        }, 3000);
    }

    // --- Chat Session Management ---
    function generateUniqueId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    function initializeChatSession() {
        chatBox.innerHTML = ''; // Always clear chat display on initialization

        // Explicitly clear all chat history from localStorage
        localStorage.removeItem('chatSessions');
        currentChatSessionId = generateUniqueId();
        currentChatHistory = [];
        uploadedFilesMetadata = []; // Clear any pending uploaded files
        uploadedFileContent = null;
        uploadedFilesPreview.innerHTML = ''; // Clear preview area
        uploadedFilesPreview.classList.remove('has-files'); // Remove border class
        uploadStatus.style.display = 'none'; // Hide upload status

        displayStatusMessage('Starting new chat.', 'info');

        setTimeout(() => {
            // Initial bot message with new appendMessage structure
            appendMessage("Hello! I am UD AI Assistant. How can I help you today?", 'bot');
            speakResponse("Hello, I am UD Ai Assistant. How can I help you today?");
        }, 500);
    }

    newChatButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to start a new chat? All previous chat history will be cleared.')) {
            initializeChatSession();
            displayStatusMessage('New chat started. All previous history cleared.', 'info');
        }
    });


    // --- Speech Synthesis (Text-to-Speech) ---
    let speechSynth = window.speechSynthesis;
    let voices = [];

    speechSynth.onvoiceschanged = () => {
        voices = speechSynth.getVoices();
        populateVoiceSelection();
        console.log("Available voices:", voices);
    };

    function populateVoiceSelection() {
        assistantVoiceSelect.innerHTML = `
            <option value="default">Default Voice</option>
            <option value="male">Male Voice</option>
            <option value="female">Female Voice</option>
        `;
        const currentLangTag = languageMap[languageSelect.value]?.speechSynthesis || 'en-US';

        if (!currentLangTag.startsWith('en')) {
            voices.filter(voice => voice.lang === currentLangTag || voice.lang.startsWith(currentLangTag.split('-')[0]))
                  .forEach(voice => {
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    assistantVoiceSelect.appendChild(option);
                });
        }

        const savedVoice = localStorage.getItem('selectedAssistantVoice');
        if (savedVoice && Array.from(assistantVoiceSelect.options).some(opt => opt.value === savedVoice)) {
            assistantVoiceSelect.value = savedVoice;
        } else if (assistantVoiceSelect.options.length > 0) {
            assistantVoiceSelect.value = 'default';
        }
    }

    assistantVoiceSelect.addEventListener('change', () => {
        localStorage.setItem('selectedAssistantVoice', assistantVoiceSelect.value);
        displayStatusMessage(`Assistant voice set to: ${assistantVoiceSelect.value}`, 'info');
    });

    languageSelect.addEventListener('change', () => {
        populateVoiceSelection();
        stopAllVoiceRecognition();
        displayStatusMessage(`Language set to: ${languageSelect.value}`, 'info');
    });

    function speakResponse(text) {
        if (!speechSynth) {
            displayStatusMessage('Text-to-speech not supported by your browser.', 'error');
            return;
        }
        if (speechSynth.speaking) {
            speechSynth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const selectedLanguage = languageSelect.value;
        const targetLangTag = languageMap[selectedLanguage]?.speechSynthesis || 'en-US';
        const selectedVoicePreference = assistantVoiceSelect.value;

        let selectedVoice = null;

        if (selectedVoicePreference !== 'default') {
            if (selectedVoicePreference === 'male') {
                selectedVoice = voices.find(voice =>
                    (voice.lang === targetLangTag || voice.lang.startsWith(targetLangTag.split('-')[0])) &&
                    (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('david') || voice.name.toLowerCase().includes('thomas') || voice.name.toLowerCase().includes('peter') || voice.name.toLowerCase().includes('jonas') || voice.name.toLowerCase().includes('us english male') || voice.name.toLowerCase().includes('en-us') || voice.name.toLowerCase().includes('google'))
                );
            } else if (selectedVoicePreference === 'female') {
                selectedVoice = voices.find(voice =>
                    (voice.lang === targetLangTag || voice.lang.startsWith(targetLangTag.split('-')[0])) &&
                    (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('zira') || voice.name.toLowerCase().includes('sara') || voice.name.toLowerCase().includes('jenna') || voice.name.toLowerCase().includes('eva') || voice.name.toLowerCase().includes('us english female') || voice.name.toLowerCase().includes('en-us') || voice.name.toLowerCase().includes('google'))
                );
            } else {
                selectedVoice = voices.find(voice => voice.name === selectedVoicePreference);
            }
        }

        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang === targetLangTag && voice.name.includes('Google'));
        }
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang === targetLangTag);
        }
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang.startsWith(targetLangTag.split('-')[0]));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log("Using voice:", selectedVoice.name, selectedVoice.lang);
        } else {
            console.warn(`No suitable voice found for language ${selectedLanguage} and preference ${selectedVoicePreference}. Using browser default.`);
            displayStatusMessage(`No specific voice found for ${selectedLanguage}. Using default browser voice.`, 'info');
        }

        utterance.lang = targetLangTag;
        speechSynth.speak(utterance);
    }

    // --- Translation Function for Prompt Template ---
    async function translateText(text, targetLanguage) {
        if (targetLanguage === 'English') {
            return text; // No translation needed for English
        }

        const prompt = `Translate the following English text into ${targetLanguage}. Provide only the translated text, without any additional explanations or formatting: "${text}"`;
        const tempHistory = [{ role: "user", parts: [{ text: prompt }] }];

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: tempHistory })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error during translation:', errorData);
                throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Error translating text:', error);
            displayStatusMessage('Error translating prompt principles. Using English.', 'error');
            return text; // Fallback to original English text on error
        }
    }

    // --- Chat Logic (Send Message) ---
    async function sendMessage(userMessage, fileContent = null, language = 'English', isFromModal = false) {
        // userMessage here contains the actual text to be displayed and sent to the API.
        // For modal, it's the edited prompt. For direct input, it's the original input.
        const userDisplayMessage = userMessage; 

        let promptForAPI = userMessage;
        let filesForDisplay = []; // To store file metadata for displaying in chat bubble

        if (fileContent) {
            promptForAPI = `Here is some document content: "${fileContent}".\n\nBased on this and my request, please respond in ${language}: ${userMessage}`;
            filesForDisplay = [...uploadedFilesMetadata]; // Copy for this message bubble
            uploadedFileContent = null; // Clear content after use
            uploadedFilesMetadata = []; // Clear metadata after use
            documentUploadInput.value = ''; // Clear file input element
            uploadedFilesPreview.innerHTML = ''; // Clear preview area
            uploadedFilesPreview.classList.remove('has-files'); // Remove border class
            uploadStatus.style.display = 'none';
        } else if (!isFromModal && advancedPromptCheckbox.checked) {
            // This case should ideally not be hit if modal handles the first send
            // But as a fallback, ensure promptForAPI is the raw user message if enhancement is on but modal bypassed
            promptForAPI = userMessage;
        } else if (!isFromModal) {
            promptForAPI = `Please respond in ${language}: ${userMessage}`;
        }
        
        // Pass filesForDisplay to appendMessage for the user's bubble
        // This line now always appends the user message, regardless of whether it's from modal or direct input
        appendMessage(userDisplayMessage, 'user', filesForDisplay);
        userInput.value = '';

        const loadingIndicator = document.createElement('div');
        loadingIndicator.classList.add('message', 'bot-message', 'loading-indicator-wrapper');
        loadingIndicator.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="loading-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        chatBox.appendChild(loadingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            // Only add user's original message to chat history if it's not from modal
            if (!isFromModal) {
                // Add the user's initial *display* message to history. The API might get an enhanced version.
                currentChatHistory.push({ role: "user", parts: [{ text: userDisplayMessage }] }); 
            } else {
                // If from modal, the "user" message in history should be the final edited prompt
                currentChatHistory.push({ role: "user", parts: [{ text: userMessage }] });
            }

            const apiCallContents = [...currentChatHistory];
            // Ensure the last message sent to API is the correct prompt (userMessage or promptForAPI)
            apiCallContents[apiCallContents.length - 1].parts[0].text = promptForAPI; 

            const requestBody = {
                contents: apiCallContents
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
            }

            const data = await response.json();
            const botResponse = data.candidates[0].content.parts[0].text;
            console.log("Gemini API Response:", botResponse);

            currentChatHistory.push({ role: "model", parts: [{ text: botResponse }] });

            chatBox.removeChild(loadingIndicator);
            appendMessage(botResponse, 'bot');
            speakResponse(botResponse);
            displayStatusMessage('Message sent successfully!', 'success');

        } catch (error) {
            console.error('Error sending message:', error);
            if (chatBox.contains(loadingIndicator)) {
                chatBox.removeChild(loadingIndicator);
            }
            appendMessage('Sorry, I am having trouble connecting to the AI. Please try again later. (Error: ' + error.message + ')', 'bot');
            displayStatusMessage('Error sending message. See console for details.', 'error');
            speakResponse('Sorry, I am having trouble connecting to the AI. Please try again later.');
        }
    }

    // --- Event Listeners ---
    sendButton.addEventListener('click', async () => {
        const userInputValue = userInput.value.trim();
        if (userInputValue === '') {
            displayStatusMessage('Please type a message to send.', 'info');
            return;
        }

        if (advancedPromptCheckbox.checked) {
            originalUserMessage = userInputValue; // Store the original message
            modalPromptTextarea.value = 'Generating enhanced prompt...';
            promptModal.classList.add('visible');

            const selectedLanguageForPromptEnhancement = languageSelect.value;
            let translatedPromptTemplate = promptTemplate;

            if (selectedLanguageForPromptEnhancement !== 'English') {
                modalPromptTextarea.value = `Translating prompt principles into ${selectedLanguageForPromptEnhancement}...`;
                try {
                    translatedPromptTemplate = await translateText(promptTemplate, selectedLanguageForPromptEnhancement);
                } catch (translationError) {
                    console.error('Error during prompt template translation:', translationError);
                    displayStatusMessage('Could not translate prompt principles. Using English.', 'error');
                    translatedPromptTemplate = promptTemplate; // Fallback
                }
            }
            
            const enhancedPrompt = translatedPromptTemplate + `"${userInputValue}"`;

            // Send initial enhanced prompt to API for generation
            try {
                // Temporarily create a chat history for this specific enhanced prompt generation
                const tempHistory = [{ role: "user", parts: [{ text: enhancedPrompt }] }];

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: tempHistory })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('API Error during prompt enhancement:', errorData);
                    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
                }

                const data = await response.json();
                const generatedPrompt = data.candidates[0].content.parts[0].text;
                modalPromptTextarea.value = generatedPrompt;
            } catch (error) {
                console.error('Error generating enhanced prompt:', error);
                modalPromptTextarea.value = `Error generating enhanced prompt: ${error.message}. Please try again or uncheck "Advanced Prompt Enhancement".`;
            }
            
        } else {
            sendMessage(userInputValue, uploadedFileContent, languageSelect.value);
        }
    });

    // Modal Send Again button
    modalSendAgainButton.addEventListener('click', () => {
        const finalPrompt = modalPromptTextarea.value.trim();
        if (finalPrompt) {
            // Pass finalPrompt as userMessage to sendMessage.
            // sendMessage will now correctly use finalPrompt for display via userDisplayMessage.
            sendMessage(finalPrompt, null, languageSelect.value, true); 
            promptModal.classList.remove('visible');
            modalPromptTextarea.value = ''; // Clear textarea
        } else {
            displayStatusMessage('Enhanced prompt cannot be empty.', 'error');
        }
    });

    // Modal Cancel button
    modalCancelButton.addEventListener('click', () => {
        promptModal.classList.remove('visible');
        modalPromptTextarea.value = ''; // Clear textarea
        userInput.value = originalUserMessage; // Restore original message to input
    });

    // Close Modal button (X button)
    closeModalButton.addEventListener('click', () => {
        promptModal.classList.remove('visible');
        modalPromptTextarea.value = ''; // Clear textarea
        userInput.value = originalUserMessage; // Restore original message to input
    });

    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    // --- Speech Recognition (Voice Input) ---
    function initializeVoiceRecognition(mode) {
        if (!('webkitSpeechRecognition' in window)) {
            displayStatusMessage('Speech recognition not supported by your browser. Please use Chrome.', 'error');
            return null;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.lang = languageMap[languageSelect.value]?.speechRecognition || 'en-US';

        recognition.onstart = () => {
            voiceStatus.textContent = `Listening in ${languageSelect.value}...`;
            voiceStatus.style.display = 'block';
            if (mode === 'voice') {
                isVoiceModeListening = true;
                voiceModeButton.classList.add('listening');
            } else if (mode === 'transcribe') {
                isTranscribeListening = true;
                transcribeVoiceButton.classList.add('listening');
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Speech Recognition Result:', transcript);
            if (mode === 'voice') {
                sendMessage(transcript, uploadedFileContent, languageSelect.value);
            } else if (mode === 'transcribe') {
                userInput.value = transcript;
                adjustTextareaHeight();
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            displayStatusMessage(`Speech recognition error: ${event.error}`, 'error');
            stopAllVoiceRecognition();
        };

        recognition.onend = () => {
            console.log('Speech recognition ended.');
            voiceStatus.style.display = 'none';
            if (mode === 'voice') {
                isVoiceModeListening = false;
                voiceModeButton.classList.remove('listening');
            } else if (mode === 'transcribe') {
                isTranscribeListening = false;
                transcribeVoiceButton.classList.remove('listening');
            }
        };
        return recognition;
    }

    function stopAllVoiceRecognition() {
        if (voiceModeRecognition && isVoiceModeListening) {
            voiceModeRecognition.stop();
            isVoiceModeListening = false;
            voiceModeButton.classList.remove('listening');
        }
        if (transcribeRecognition && isTranscribeListening) {
            transcribeRecognition.stop();
            isTranscribeListening = false;
            transcribeVoiceButton.classList.remove('listening');
        }
        voiceStatus.style.display = 'none';
    }

    voiceModeButton.addEventListener('click', () => {
        if (isVoiceModeListening) {
            stopAllVoiceRecognition();
        } else {
            stopAllVoiceRecognition(); // Stop any other recognition
            voiceModeRecognition = initializeVoiceRecognition('voice');
            if (voiceModeRecognition) {
                voiceModeRecognition.start();
            }
        }
    });

    transcribeVoiceButton.addEventListener('click', () => {
        if (isTranscribeListening) {
            stopAllVoiceRecognition();
        } else {
            stopAllVoiceRecognition(); // Stop any other recognition
            transcribeRecognition = initializeVoiceRecognition('transcribe');
            if (transcribeRecognition) {
                transcribeRecognition.start();
            }
        }
    });

    // --- File Upload ---
    documentUploadInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (files.length === 0) {
            displayStatusMessage('No files selected.', 'info');
            return;
        }

        displayStatusMessage('Processing files...', 'info');
        uploadedFilesMetadata = []; // Reset for new upload
        uploadedFileContent = null; // Reset content

        let allFilesTextContent = [];
        let fileReadPromises = [];

        for (const file of files) {
            const reader = new FileReader();
            fileReadPromises.push(new Promise((resolve, reject) => {
                reader.onload = (e) => {
                    const fileContent = e.target.result;
                    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    const iconClass = getFileIconClass(file.name);

                    uploadedFilesMetadata.push({
                        id: fileId,
                        name: file.name,
                        type: file.type,
                        content: fileContent,
                        iconClass: iconClass
                    });
                    allFilesTextContent.push(`--- Start of ${file.name} ---\n${fileContent}\n--- End of ${file.name} ---`);
                    resolve();
                };
                reader.onerror = (e) => {
                    console.error('Error reading file:', file.name, e);
                    displayStatusMessage(`Failed to read file: ${file.name}`, 'error');
                    reject(e);
                };
                reader.readAsText(file); // Read as text, assuming most documents can be processed as text
            }));
        }

        try {
            await Promise.all(fileReadPromises);
            uploadedFileContent = allFilesTextContent.join('\n\n'); // Join all file contents
            displayStatusMessage(`${files.length} file(s) uploaded and ready to be sent with your next message.`, 'success');
            renderUploadedFilesPreview();
        } catch (error) {
            console.error('Error processing file uploads:', error);
            displayStatusMessage('One or more files could not be processed.', 'error');
            uploadedFilesMetadata = []; // Clear partial uploads on error
            uploadedFileContent = null;
        }
    });

    function renderUploadedFilesPreview() {
        uploadedFilesPreview.innerHTML = ''; // Clear existing previews
        if (uploadedFilesMetadata.length > 0) {
            uploadedFilesPreview.classList.add('has-files');
            uploadedFilesMetadata.forEach(file => {
                const fileTag = document.createElement('div');
                fileTag.classList.add('uploaded-file-tag');
                fileTag.dataset.fileId = file.id; // Store unique ID for removal
                fileTag.innerHTML = `
                    <i class="fas ${file.iconClass} file-icon"></i>
                    <span class="file-name">${file.name}</span>
                    <button class="remove-file-button" data-file-id="${file.id}" title="Remove file">&times;</button>
                `;
                uploadedFilesPreview.appendChild(fileTag);
            });
            // Add click listener to the parent and delegate
            uploadedFilesPreview.addEventListener('click', handleFileRemoval);
        } else {
            uploadedFilesPreview.classList.remove('has-files');
            uploadedFilesPreview.innerHTML = '';
        }
    }

    function handleFileRemoval(event) {
        if (event.target.classList.contains('remove-file-button')) {
            event.stopPropagation(); // Prevent event from bubbling up to parent
            const fileIdToRemove = event.target.dataset.fileId;
            removeUploadedFile(fileIdToRemove);
        }
    }

    function removeUploadedFile(fileIdToRemove) {
        uploadedFilesMetadata = uploadedFilesMetadata.filter(file => file.id !== fileIdToRemove);
        const fileTagToRemove = uploadedFilesPreview.querySelector(`[data-file-id="${fileIdToRemove}"]`);
        if (fileTagToRemove) {
            uploadedFilesPreview.removeChild(fileTagToRemove);
        }

        // Re-combine content if any files remain
        if (uploadedFilesMetadata.length > 0) {
            uploadedFileContent = uploadedFilesMetadata.map(file => `--- Start of ${file.name} ---\n${file.content}\n--- End of ${file.name} ---`).join('\n\n');
            uploadedFilesPreview.classList.add('has-files');
            displayStatusMessage(`Removed file. ${uploadedFilesMetadata.length} file(s) remaining.`, 'info');
        } else {
            uploadedFileContent = null;
            uploadedFilesPreview.classList.remove('has-files');
            uploadedFilesPreview.innerHTML = ''; // Ensure div is empty
            uploadStatus.style.display = 'none';
            displayStatusMessage('All uploaded files removed.', 'info');
        }
    }


    // --- Initial setup calls ---
    adjustTextareaHeight();
    if (speechSynth) {
        if (speechSynth.getVoices().length === 0) {
            speechSynth.onvoiceschanged = () => {
                voices = speechSynth.getVoices();
                populateVoiceSelection();
                console.log("Voices loaded asynchronously.");
            };
        } else {
            voices = speechSynth.getVoices();
            populateVoiceSelection();
        }
    }

    // Adjust textarea height dynamically
    function adjustTextareaHeight() {
        userInput.style.height = 'auto'; // Reset height to recalculate
        userInput.style.height = userInput.scrollHeight + 'px';
    }
    userInput.addEventListener('input', adjustTextareaHeight);
});