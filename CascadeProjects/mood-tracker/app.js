// DOM Elements
const moodSelection = document.getElementById('mood-selection');
const noteSection = document.getElementById('note-section');
const statsSection = document.getElementById('stats-section');
const currentDateEl = document.getElementById('current-date');
const selectedMoodEl = document.getElementById('selected-mood');
const moodNote = document.getElementById('mood-note');
const saveBtn = document.getElementById('save-btn');
const backBtn = document.getElementById('back-btn');
const newEntryBtn = document.getElementById('new-entry-btn');
const historyList = document.getElementById('history-list');
const moodChartCtx = document.getElementById('mood-chart').getContext('2d');

// State
let moodEntries = JSON.parse(localStorage.getItem('moodEntries')) || [];
let selectedMood = '';
let moodChart = null;

// Initialize the app
function init() {
    // Set current date
    const today = new Date();
    currentDateEl.textContent = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Check if we should show stats (end of week)
    checkForWeeklyStats();
    
    // Render history
    renderHistory();
    
    // Set up event listeners
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Mood selection
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedMood = e.target.dataset.mood;
            selectedMoodEl.textContent = selectedMood;
            moodSelection.classList.add('hidden');
            noteSection.classList.remove('hidden');
            moodNote.focus();
        });
    });
    
    // Save entry
    saveBtn.addEventListener('click', saveEntry);
    
    // Back button
    backBtn.addEventListener('click', () => {
        noteSection.classList.add('hidden');
        moodSelection.classList.remove('hidden');
    });
    
    // New entry button
    newEntryBtn.addEventListener('click', () => {
        statsSection.classList.add('hidden');
        moodSelection.classList.remove('hidden');
    });
    
    // Allow saving with Enter key
    moodNote.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEntry();
        }
    });
}

// Save mood entry
function saveEntry() {
    if (!moodNote.value.trim()) {
        alert('Please enter a note about your mood.');
        return;
    }
    
    const entry = {
        date: new Date().toISOString(),
        mood: selectedMood,
        note: moodNote.value.trim()
    };
    
    moodEntries.push(entry);
    localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
    
    // Reset form
    moodNote.value = '';
    
    // Show stats if it's the end of the week
    checkForWeeklyStats();
    
    // Update history
    renderHistory();
}

// Check if we should show weekly stats
function checkForWeeklyStats() {
    if (moodEntries.length === 0) return;
    
    const today = new Date();
    const lastEntryDate = new Date(moodEntries[moodEntries.length - 1].date);
    const daysSinceLastEntry = Math.floor((today - lastEntryDate) / (1000 * 60 * 60 * 24));
    
    // Show stats if it's Sunday or if it's been a week since the first entry
    if (today.getDay() === 0 || daysSinceLastEntry >= 7) {
        showWeeklyStats();
    }
}

// Show weekly stats
function showWeeklyStats() {
    // Get entries from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyEntries = moodEntries.filter(entry => {
        return new Date(entry.date) >= oneWeekAgo;
    });
    
    if (weeklyEntries.length === 0) return;
    
    // Prepare data for the chart
    const moodCounts = {
        happy: 0,
        sad: 0,
        angry: 0,
        meh: 0
    };
    
    const moodNotes = [];
    
    weeklyEntries.forEach(entry => {
        moodCounts[entry.mood]++;
        moodNotes.push(entry.note.toLowerCase());
    });
    
    // Render chart
    renderMoodChart(moodCounts);
    
    // Calculate mood distribution
    const totalEntries = weeklyEntries.length;
    const moodStats = [];
    
    for (const [mood, count] of Object.entries(moodCounts)) {
        if (count > 0) {
            const percentage = Math.round((count / totalEntries) * 100);
            moodStats.push(`<p><strong>${mood}:</strong> ${percentage}% (${count} ${count === 1 ? 'day' : 'days'})</p>`);
        }
    }
    
    document.getElementById('mood-stats').innerHTML = moodStats.join('');
    
    // Find common words
    const commonWords = findCommonWords(moodNotes.join(' '));
    const commonWordsHtml = commonWords.map(word => 
        `<span class="tag">${word.word}</span>`
    ).join(' ');
    
    document.getElementById('common-words').innerHTML = commonWordsHtml || '<p>Not enough data to show common words.</p>';
    
    // Generate tips based on mood
    generateTips(moodCounts);
    
    // Show stats section
    moodSelection.classList.add('hidden');
    noteSection.classList.add('hidden');
    statsSection.classList.remove('hidden');
}

// Render mood chart
function renderMoodChart(moodCounts) {
    // Destroy previous chart if it exists
    if (moodChart) {
        moodChart.destroy();
    }
    
    const data = {
        labels: ['Happy', 'Sad', 'Angry', 'Meh'],
        datasets: [{
            data: [moodCounts.happy, moodCounts.sad, moodCounts.angry, moodCounts.meh],
            backgroundColor: [
                '#ffeb3b', // happy
                '#90caf9', // sad
                '#ff8a80', // angry
                '#bdbdbd'  // meh
            ],
            borderWidth: 1
        }]
    };
    
    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    };
    
    moodChart = new Chart(moodChartCtx, config);
}

// Find common words in notes
function findCommonWords(text, limit = 5) {
    // Remove common words and punctuation
    const commonWords = new Set([
        'the', 'and', 'i', 'to', 'of', 'a', 'in', 'was', 'it', 'for', 'on', 'with', 'my', 'that', 'at', 'as', 'not', 'this', 'but', 'have', 'you', 'be', 'is', 'are', 'me', 'so', 'just', 'all', 'had', 'were', 'very', 'they', 'would', 'could', 'about', 'get', 'if', 'has', 'your', 'or', 'an', 'by', 'what', 'there', 'we', 'can', 'out', 'up', 'some', 'into', 'do', 'its', 'only', 'which', 'them', 'other', 'than', 'then', 'these', 'those', 'such', 'from', 'him', 'his', 'her', 'she', 'he', 'their', 'they', 'them', 'our', 'ours', 'yours', 'because', 'when', 'where', 'why', 'how', 'any', 'an', 'like', 'more', 'time', 'no', 'yes', 'well', 'also', 'too', 'here', 'even', 'back', 'much', 'go', 'come', 'went', 'came', 'got', 'get', 'getting', 'got', 'gotten', 'goes', 'gone', 'going', 'come', 'came', 'coming', 'went', 'going', 'gone', 'get', 'got', 'gotten', 'getting', 'go', 'goes', 'going', 'gone', 'went', 'come', 'came', 'coming', 'today', 'day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years', 'time', 'times', 'work', 'home', 'school', 'job', 'feel', 'feeling', 'felt', 'feelings', 'good', 'bad', 'okay', 'ok', 'fine', 'great', 'better', 'best', 'worst', 'worse', 'really', 'very', 'quite', 'pretty', 'so', 'just', 'still', 'now', 'then', 'there', 'here', 'where', 'when', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'ought', 'need', 'dare', 'dared', 'daring', 'used'
    ]);
    
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));
    
    const wordCount = {};
    
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

// Generate tips based on mood data
function generateTips(moodCounts) {
    const tips = [];
    const total = moodCounts.happy + moodCounts.sad + moodCounts.angry + moodCounts.meh;
    
    if (moodCounts.sad > moodCounts.happy) {
        tips.push("Consider practicing gratitude by writing down three things you're thankful for each day.");
    }
    
    if (moodCounts.angry > 0) {
        tips.push("When feeling angry, try deep breathing exercises to help calm your mind.");
    }
    
    if (moodCounts.meh > moodCounts.happy) {
        tips.push("Engaging in physical activity can help boost your mood and energy levels.");
    }
    
    if (moodCounts.happy > 0) {
        tips.push("Great job recognizing what makes you happy! Try to incorporate more of those activities into your week.");
    }
    
    if (tips.length === 0) {
        tips.push("Keep tracking your mood to get personalized tips and insights!");
    }
    
    document.getElementById('tips').innerHTML = tips.map(tip => `<p>• ${tip}</p>`).join('');
}

// Render mood history
function renderHistory() {
    if (moodEntries.length === 0) {
        historyList.innerHTML = '<p>No entries yet. Select a mood to get started!</p>';
        return;
    }
    
    // Group entries by date
    const entriesByDate = {};
    
    moodEntries.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString();
        if (!entriesByDate[date]) {
            entriesByDate[date] = [];
        }
        entriesByDate[date].push(entry);
    });
    
    // Create HTML for each date group
    let html = '';
    
    for (const [date, entries] of Object.entries(entriesByDate)) {
        html += `<div class="date-group">
            <h3>${date}</h3>`;
            
        entries.forEach(entry => {
            const time = new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            html += `
            <div class="entry">
                <div class="entry-header">
                    <span class="entry-time">${time}</span>
                    <span class="entry-mood">${entry.mood} ${getMoodEmoji(entry.mood)}</span>
                </div>
                <p>${entry.note}</p>
            </div>`;
        });
            
        html += `</div>`;
    }
    
    historyList.innerHTML = html;
}

// Get emoji for mood
function getMoodEmoji(mood) {
    const emojis = {
        happy: '😊',
        sad: '😢',
        angry: '😠',
        meh: '😐'
    };
    
    return emojis[mood] || '';
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
