document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const generateBtn = document.getElementById('generate-btn');
    const numberDisplay = document.getElementById('number-display');
    const asciiDisplay = document.getElementById('ascii-display');
    
    // Add event listener to the generate button
    generateBtn.addEventListener('click', generateNewNumber);
    
    // Function to add terminal typing effect
    function typeEffect(element, text, speed = 30) {
        element.innerHTML = '';
        let i = 0;
        
        function typeNextChar() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeNextChar, speed);
            }
        }
        
        typeNextChar();
    }
    
    // Function to generate a new random number via API
    function generateNewNumber() {
        // Add loading effect
        numberDisplay.textContent = '...';
        asciiDisplay.textContent = 'Generating...';
        
        // Disable the button during the fetch
        generateBtn.disabled = true;
        generateBtn.textContent = 'Processing...';
        
        // Add terminal effect to the button
        let dots = 0;
        const loadingInterval = setInterval(() => {
            generateBtn.textContent = 'Processing' + '.'.repeat(dots % 4);
            dots++;
        }, 300);
        
        // Fetch new random number from API
        fetch('/api/random')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Clear the loading interval
                clearInterval(loadingInterval);
                
                // Update the display with the new number and ASCII art
                setTimeout(() => {
                    numberDisplay.textContent = data.number;
                    typeEffect(asciiDisplay, data.ascii_art);
                    
                    // Re-enable the button
                    generateBtn.disabled = false;
                    generateBtn.textContent = 'Generate New Number';
                }, 500); // Small delay for effect
            })
            .catch(error => {
                // Clear the loading interval
                clearInterval(loadingInterval);
                
                // Handle errors
                console.error('Error fetching random number:', error);
                asciiDisplay.textContent = 'Error generating number!';
                numberDisplay.textContent = 'ERR';
                
                // Re-enable the button
                generateBtn.disabled = false;
                generateBtn.textContent = 'Try Again';
            });
    }
    
    // Add a terminal boot sequence effect on page load
    function bootSequence() {
        const lines = [
            "Initializing Terminal Random Generator...",
            "Loading probability modules...",
            "Calibrating random number generator...",
            "System ready."
        ];
        
        let delay = 0;
        const bootElement = document.createElement('div');
        bootElement.classList.add('boot-sequence');
        document.querySelector('.content').prepend(bootElement);
        
        lines.forEach((line, index) => {
            setTimeout(() => {
                const lineElement = document.createElement('div');
                typeEffect(lineElement, `> ${line}`);
                bootElement.appendChild(lineElement);
                
                // When all lines are printed, fade out and remove
                if (index === lines.length - 1) {
                    setTimeout(() => {
                        bootElement.style.opacity = '0';
                        setTimeout(() => {
                            bootElement.remove();
                        }, 1000);
                    }, 1000);
                }
            }, delay);
            delay += 800;
        });
    }
    
    // Run boot sequence on page load
    bootSequence();
});
