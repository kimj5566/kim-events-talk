document.addEventListener('DOMContentLoaded', () => {
    const scheduleContainer = document.getElementById('schedule');
    const categorySearchInput = document.getElementById('categorySearch');
    let allTalks = [];

    const EVENT_START_HOUR = 10;
    const EVENT_START_MINUTE = 0;
    const TRANSITION_DURATION = 10; // minutes

    // Helper to format time
    function formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Function to calculate and display the schedule
    async function fetchAndRenderSchedule() {
        try {
            const response = await fetch('/api/talks');
            let talksData = await response.json();

            allTalks = calculateSchedule(talksData);
            renderSchedule(allTalks);

        } catch (error) {
            console.error('Error fetching or processing talks:', error);
            scheduleContainer.innerHTML = '<p>Error loading schedule. Please try again later.</p>';
        }
    }

    function calculateSchedule(talksData) {
        const scheduledItems = [];
        let currentEventTime = new Date(2026, 1, 9, EVENT_START_HOUR, EVENT_START_MINUTE); // Use a dummy date for time calculations

        // Separate talks from the lunch break for specific ordering
        const talks = talksData.filter(item => item.id !== 'lunch');
        const lunchBreak = talksData.find(item => item.id === 'lunch');

        // Insert lunch break after the third talk
        const talksBeforeLunch = talks.slice(0, 3);
        const talksAfterLunch = talks.slice(3);

        let talkIndex = 0;

        // Schedule talks before lunch
        talksBeforeLunch.forEach((talk, index) => {
            if (index > 0) { // Add transition before subsequent talks
                scheduledItems.push({
                    id: `transition-${talkIndex}`,
                    title: 'Transition',
                    type: 'transition',
                    duration: TRANSITION_DURATION,
                    startTime: new Date(currentEventTime),
                    endTime: new Date(currentEventTime.setMinutes(currentEventTime.getMinutes() + TRANSITION_DURATION))
                });
                talkIndex++;
            }

            talk.startTime = new Date(currentEventTime);
            talk.endTime = new Date(currentEventTime.setMinutes(currentEventTime.getMinutes() + talk.duration));
            scheduledItems.push(talk);
        });

        // Schedule lunch break
        if (lunchBreak) {
            scheduledItems.push({
                id: `transition-${talkIndex}`,
                title: 'Transition',
                type: 'transition',
                duration: TRANSITION_DURATION,
                startTime: new Date(currentEventTime),
                endTime: new Date(currentEventTime.setMinutes(currentEventTime.getMinutes() + TRANSITION_DURATION))
            });
            talkIndex++;

            lunchBreak.startTime = new Date(currentEventTime);
            lunchBreak.endTime = new Date(currentEventTime.setMinutes(currentEventTime.getMinutes() + lunchBreak.duration));
            scheduledItems.push(lunchBreak);
        }

        // Schedule talks after lunch
        talksAfterLunch.forEach((talk, index) => {
            scheduledItems.push({
                id: `transition-${talkIndex}`,
                title: 'Transition',
                type: 'transition',
                duration: TRANSITION_DURATION,
                startTime: new Date(currentEventTime),
                endTime: new Date(currentEventTime.setMinutes(currentEventTime.getMinutes() + TRANSITION_DURATION))
            });
            talkIndex++;

            talk.startTime = new Date(currentEventTime);
            talk.endTime = new Date(currentEventTime.setMinutes(currentEventTime.getMinutes() + talk.duration));
            scheduledItems.push(talk);
        });
        
        return scheduledItems;
    }


    function renderSchedule(talksToDisplay) {
        scheduleContainer.innerHTML = ''; // Clear previous schedule

        talksToDisplay.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('talk-card');
            if (item.id === 'lunch') {
                card.classList.add('lunch-break');
            } else if (item.type === 'transition') {
                card.classList.add('transition');
            }
            card.dataset.categories = (item.categories || []).join(',').toLowerCase(); // For search

            let content = '';

            if (item.type === 'transition') {
                content = `
                    <p class="time">${formatTime(item.startTime)} - ${formatTime(item.endTime)}</p>
                    <h2 class="transition-title">${item.title} (${item.duration} min)</h2>
                `;
            } else {
                content = `
                    <p class="time">${formatTime(item.startTime)} - ${formatTime(item.endTime)}</p>
                    <h2>${item.title}</h2>
                    ${item.speakers && item.speakers.length > 0 ? `<p class="speakers"><strong>Speakers:</strong> ${item.speakers.join(', ')}</p>` : ''}
                    ${item.categories && item.categories.length > 0 ? `<p class="categories"><strong>Categories:</strong> ${item.categories.join(', ')}</p>` : ''}
                    <p class="description">${item.description}</p>
                `;
            }
            card.innerHTML = content;
            scheduleContainer.appendChild(card);
        });
    }

    // Search functionality
    categorySearchInput.addEventListener('keyup', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const talkCards = scheduleContainer.querySelectorAll('.talk-card');

        talkCards.forEach(card => {
            // Only hide/show actual talks, not lunch or transitions for simplicity
            if (!card.classList.contains('lunch-break') && !card.classList.contains('transition')) {
                const categories = card.dataset.categories;
                if (categories.includes(searchTerm) || searchTerm === '') {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            }
        });
    });

    // Initial load
    fetchAndRenderSchedule();
});
