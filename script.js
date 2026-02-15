const textContainer = document.getElementById('textContainer');
const cursor = document.getElementById('cursor');
const logo = document.getElementById('logo');
const heightSlider = document.getElementById('heightSlider');
const stickerText = document.getElementById('stickerText');

// Track all elements in the playground (words and spaces)
const playgroundElements = [];

// Track current word being typed
let currentWord = null;

// Current letter height (controlled by slider)
let currentHeight = 56;

// Update cursor height when slider changes
heightSlider.addEventListener('input', (e) => {
    currentHeight = parseInt(e.target.value);
    cursor.style.height = currentHeight + 'px';
});

// Reusable function to convert text content into clickable letters
function letterizeElement(element, startWeight = 'unreadable') {
    const text = element.textContent;
    element.textContent = ''; // Clear the element
    
    // Split by spaces to get words
    const words = text.split(' ');
    
    words.forEach((word, wordIndex) => {
        // Create a word container to keep letters together
        const wordContainer = document.createElement('span');
        wordContainer.className = 'word';
        
        // Add each letter of the word
        word.split('').forEach(char => {
            const wrapper = document.createElement('span');
            wrapper.className = 'letter-wrapper';

            const letterSpan = document.createElement('span');
            letterSpan.className = `letter weight-${startWeight}`;
            letterSpan.textContent = char;

            // Add click handler for weight toggle
            letterSpan.addEventListener('click', () => toggleWeight(letterSpan));

            wrapper.appendChild(letterSpan);
            wordContainer.appendChild(wrapper);
        });
        
        element.appendChild(wordContainer);
        
        // Add space after each word (except the last one)
        if (wordIndex < words.length - 1) {
            const space = document.createElement('span');
            space.innerHTML = '&nbsp;';
            space.className = 'letter-space';
            element.appendChild(space);
        }
    });
}

// Initialize the logo
letterizeElement(logo, 'unreadable');

// Initialize sticker text
letterizeElement(stickerText, 'readable');

// Initialize section headlines
document.querySelectorAll('.section-headline').forEach(headline => {
    letterizeElement(headline, 'readable');
});

// Initialize about text
document.querySelectorAll('.about-text').forEach(aboutText => {
    letterizeElement(aboutText, 'readable');
});

// Add default text to playground on page load
function addDefaultPlaygroundText() {
    const defaultText = 'אי שם מעבר לקשת בענן';
    
    // Set slider to maximum for biggest font
    currentHeight = 220;
    heightSlider.value = 220;
    cursor.style.height = currentHeight + 'px';
    
    // Add each character from the default text
    defaultText.split('').forEach(char => {
        addLetter(char);
    });
}

// Run after a small delay to ensure everything is initialized
addDefaultPlaygroundText();

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    // Ignore modifier keys alone
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Handle backspace
    if (e.key === 'Backspace') {
        e.preventDefault();
        removeLastLetter();
        return;
    }

    // Handle printable characters (single character keys)
    if (e.key.length === 1) {
        e.preventDefault();
        addLetter(e.key);
    }
});

// Get or create the current word container
function getOrCreateCurrentWord() {
    if (!currentWord) {
        currentWord = document.createElement('span');
        currentWord.className = 'word';
        currentWord.letters = []; // Track letters in this word
        textContainer.insertBefore(currentWord, cursor);
        playgroundElements.push({ type: 'word', element: currentWord });
    }
    return currentWord;
}

function addLetter(char) {
    // Handle space character - finish current word and add space
    if (char === ' ') {
        // End current word
        currentWord = null;
        
        // Add a space element between words
        const space = document.createElement('span');
        space.innerHTML = '&nbsp;';
        space.className = 'letter-space';
        space.style.fontSize = currentHeight + 'px';
        textContainer.insertBefore(space, cursor);
        playgroundElements.push({ type: 'space', element: space });
        return;
    }
    
    // Get the current word container
    const word = getOrCreateCurrentWord();
    
    // Create wrapper for overflow clipping
    const wrapper = document.createElement('span');
    wrapper.className = 'letter-wrapper';
    wrapper.style.height = (currentHeight * 1.1) + 'px';

    // Create the letter span (starts with readable weight)
    const letterSpan = document.createElement('span');
    letterSpan.className = 'letter weight-readable';
    letterSpan.textContent = char;
    letterSpan.style.fontSize = currentHeight + 'px';

    // Add click handler for weight toggle
    letterSpan.addEventListener('click', () => toggleWeight(letterSpan));

    wrapper.appendChild(letterSpan);

    // Add to current word
    word.appendChild(wrapper);
    word.letters.push({ wrapper, letter: letterSpan });
}

function removeLastLetter() {
    // If we have a current word with letters, remove from it
    if (currentWord && currentWord.letters.length > 0) {
        const lastLetter = currentWord.letters.pop();
        lastLetter.wrapper.remove();
        
        // If word is now empty, remove the word container
        if (currentWord.letters.length === 0) {
            currentWord.remove();
            playgroundElements.pop(); // Remove word from tracking
            currentWord = null;
            
            // If there's a space before, remove it and set currentWord to previous word
            if (playgroundElements.length > 0) {
                const lastElement = playgroundElements[playgroundElements.length - 1];
                if (lastElement.type === 'space') {
                    lastElement.element.remove();
                    playgroundElements.pop();
                    
                    // Set current word to the previous word (if any)
                    if (playgroundElements.length > 0) {
                        const prevElement = playgroundElements[playgroundElements.length - 1];
                        if (prevElement.type === 'word') {
                            currentWord = prevElement.element;
                        }
                    }
                }
            }
        }
        return;
    }
    
    // No current word - check if there's a space to remove
    if (playgroundElements.length > 0) {
        const lastElement = playgroundElements[playgroundElements.length - 1];
        
        if (lastElement.type === 'space') {
            // Remove the space
            lastElement.element.remove();
            playgroundElements.pop();
            
            // Set current word to previous word
            if (playgroundElements.length > 0) {
                const prevElement = playgroundElements[playgroundElements.length - 1];
                if (prevElement.type === 'word') {
                    currentWord = prevElement.element;
                }
            }
        } else if (lastElement.type === 'word') {
            // This shouldn't happen normally, but handle it
            currentWord = lastElement.element;
            removeLastLetter(); // Recursive call to remove from this word
        }
    }
}

function toggleWeight(letterSpan) {
    const isReadable = letterSpan.classList.contains('weight-readable');
    
    // Determine animation direction based on current weight
    // Readable → Unreadable: go UP
    // Unreadable → Readable: go DOWN
    const direction = isReadable ? 'up' : 'down';

    // Animate out
    letterSpan.classList.add(`animate-out-${direction}`);

    // Start the new letter animation BEFORE the old one finishes (overlap)
    setTimeout(() => {
        // Disable transition for instant position change
        letterSpan.classList.add('no-transition');
        
        // Remove animate-out, add animate-in (instant jump)
        letterSpan.classList.remove(`animate-out-${direction}`);
        letterSpan.classList.add(`animate-in-${direction}`);

        // Toggle the weight
        if (isReadable) {
            letterSpan.classList.remove('weight-readable');
            letterSpan.classList.add('weight-unreadable');
        } else {
            letterSpan.classList.remove('weight-unreadable');
            letterSpan.classList.add('weight-readable');
        }

        // Force reflow to apply the new position instantly
        letterSpan.offsetHeight;

        // Re-enable transition and animate to final position
        letterSpan.classList.remove('no-transition');
        
        // Small delay to ensure transition is re-enabled
        requestAnimationFrame(() => {
            letterSpan.classList.remove(`animate-in-${direction}`);
        });
    }, 60); // Start earlier to create overlap effect
}

