// Survey form functionality
class MuseumSurvey {
    constructor() {
        this.ratings = {};
        this.init();
    }

    init() {
        this.setupStarRatings();
        this.setupFormSubmission();
        this.addFormInteractions();
    }

    setupStarRatings() {
        document.querySelectorAll('.star-rating').forEach(ratingGroup => {
            const stars = ratingGroup.querySelectorAll('i');
            const question = ratingGroup.getAttribute('data-question');
            
            stars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    const value = parseInt(star.getAttribute('data-value'));
                    this.setRating(question, value, ratingGroup);
                });
                
                star.addEventListener('mouseenter', () => {
                    this.previewRating(ratingGroup, index + 1);
                });
            });
            
            ratingGroup.addEventListener('mouseleave', () => {
                this.resetRatingPreview(ratingGroup, question);
            });
        });
    }

    setRating(question, value, ratingGroup) {
        this.ratings[question] = value;
        const stars = ratingGroup.querySelectorAll('i');
        
        stars.forEach((star, index) => {
            if (index < value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    previewRating(ratingGroup, value) {
        const stars = ratingGroup.querySelectorAll('i');
        stars.forEach((star, index) => {
            if (index < value) {
                star.style.color = '#f39c12';
            } else {
                star.style.color = '#ddd';
            }
        });
    }

    resetRatingPreview(ratingGroup, question) {
        const currentRating = this.ratings[question] || 0;
        const stars = ratingGroup.querySelectorAll('i');
        
        stars.forEach((star, index) => {
            if (index < currentRating) {
                star.style.color = '#f39c12';
            } else {
                star.style.color = '#ddd';
            }
        });
    }

    addFormInteractions() {
        // Add smooth scrolling for form sections
        document.querySelectorAll('.section').forEach((section, index) => {
            section.style.animationDelay = `${index * 0.1}s`;
        });

        // Add hover effects for form elements
        document.querySelectorAll('.checkbox-item, .rating-item').forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    collectFormData() {
        const formData = new FormData(document.getElementById('surveyForm'));
        const data = {
            timestamp: new Date().toISOString(),
            language: document.documentElement.lang || 'es',
            visitTypes: formData.getAll('visitType'),
            howFound: formData.getAll('howFound'),
            futureActivities: formData.get('futureActivities') || '',
            observations: formData.get('observations') || '',
            ratings: this.ratings
        };
        
        return data;
    }

    // GOOGLE APPS SCRIPT CONFIGURATION
    APPS_SCRIPT_CONFIG = {
        webAppUrl: 'https://script.google.com/macros/s/AKfycbzGl4FZdb9qCzTvPAFpa70XD1b4Ty2V4NxqiSD3kcCgL4Nh7HJFHLtzvIF33jm4OykBTA/exec', // Replace with your working Apps Script URL
        sheetId: '1B60DryosMAg9RTZXcbIxRxXIWFFPVGZSFw1icMm4DM8'
    };

    async submitToAppsScript(data) {
        try {
            console.log('Submitting to Google Apps Script...');

            // Prepare clean data for Apps Script
            const payload = {
                timestamp: data.timestamp,
                language: data.language,
                visitTypes: data.visitTypes,
                howFound: data.howFound,
                futureActivities: data.futureActivities || '',
                observations: data.observations || '',
                ratings: data.ratings
            };

            console.log('Payload being sent:', payload);

            // Send data via GET request with URL parameters (no CORS issues)
            const params = new URLSearchParams();
            params.append('visitTypes', (payload.visitTypes || []).join(','));
            params.append('infoActivity', payload.ratings['info-activity'] || '');
            params.append('exhibitionInterest', payload.ratings['exhibition-interest'] || '');
            params.append('infoAdequate', payload.ratings['info-adequate'] || '');
            params.append('staffAttention', payload.ratings['staff-attention'] || '');
            params.append('accessibility', payload.ratings['accessibility'] || '');
            params.append('cleanliness', payload.ratings['cleanliness'] || '');
            params.append('overallSatisfaction', payload.ratings['overall-satisfaction'] || '');
            params.append('howFound', (payload.howFound || []).join(','));
            params.append('futureActivities', payload.futureActivities || '');
            params.append('observations', payload.observations || '');
            params.append('language', payload.language || 'es');

            const url = `${this.APPS_SCRIPT_CONFIG.webAppUrl}?${params.toString()}`;
            console.log('GET URL:', url);

            const response = await fetch(url, {
                method: 'GET'
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error text:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
            }

            const responseText = await response.text();
            console.log('Apps Script response text:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
                console.log('Apps Script response parsed:', result);
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                console.log('Raw response:', responseText);
                throw new Error(`Invalid JSON response: ${responseText}`);
            }

            if (result && result.success) {
                // Keep local backup
                this.saveToLocalStorageBackup(data);
                return { success: true, message: 'Survey submitted successfully' };
            } else {
                throw new Error(result ? (result.error || 'Unknown error') : 'No response data');
            }

        } catch (error) {
            console.error('Error submitting to Apps Script:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);

            // Fallback: Save locally
            this.saveToLocalStorageBackup(data);

            // Show user-friendly error
            this.showSubmissionError();
            throw error;
        }
    }

    saveToLocalStorageBackup(data) {
        // Light backup without CSV download
        const existingData = JSON.parse(localStorage.getItem('museumSurveyBackup') || '[]');
        existingData.push(data);
        localStorage.setItem('museumSurveyBackup', JSON.stringify(existingData));
        console.log('Survey backed up locally');
    }

    showSubmissionError() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: #e74c3c; color: white; 
            padding: 15px; border-radius: 8px; 
            font-size: 14px; z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        const lang = document.documentElement.lang || 'es';
        const text = {
            es: 'Error al preparar el envío. Su respuesta se guardó localmente como respaldo.',
            en: 'Error preparing submission. Your response was saved locally as backup.',
            ca: 'Error al preparar l\'enviament. La vostra resposta s\'ha guardat localment com a còpia de seguretat.'
        };
        
        message.textContent = text[lang] || text.es;
        document.body.appendChild(message);
        
        // Remove message after 8 seconds (longer for error)
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 8000);
    }

    showSuccessMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: #27ae60; color: white; 
            padding: 15px; border-radius: 8px; 
            font-size: 14px; z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        const lang = document.documentElement.lang || 'es';
        const text = {
            es: '✅ Encuesta enviada correctamente. ¡Gracias!',
            en: '✅ Survey sent successfully. Thank you!',
            ca: '✅ Enquesta enviada correctament. Gràcies!'
        };
        
        message.textContent = text[lang] || text.es;
        document.body.appendChild(message);
        
        // Remove message after 4 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 4000);
    }


    // Legacy function - no longer used with n8n integration
    // Kept for backward compatibility if needed

    createSingleResponseCSV(data) {
        const headers = [
            'Timestamp', 'Language', 'Visit Types', 'How Found', 'Future Activities', 'Observations',
            'Info Activity Rating', 'Exhibition Interest Rating', 'Info Adequate Rating',
            'Staff Attention Rating', 'Accessibility Rating', 'Cleanliness Rating',
            'Overall Satisfaction Rating'
        ];

        // Format the single response data properly
        const row = [
            `"${new Date(data.timestamp).toLocaleString()}"`, // Human readable timestamp
            `"${data.language}"`,
            `"${data.visitTypes.join(', ')}"`, // Clean comma separation
            `"${data.howFound.join(', ')}"`, // Clean comma separation
            `"${(data.futureActivities || '').replace(/"/g, '""')}"`, // Handle empty values
            `"${(data.observations || '').replace(/"/g, '""')}"`, // Handle empty values
            data.ratings['info-activity'] || 0,
            data.ratings['exhibition-interest'] || 0,
            data.ratings['info-adequate'] || 0,
            data.ratings['staff-attention'] || 0,
            data.ratings['accessibility'] || 0,
            data.ratings['cleanliness'] || 0,
            data.ratings['overall-satisfaction'] || 0
        ];

        const csvContent = headers.join(',') + '\n' + row.join(',');

        // Create downloadable CSV for this single response
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `museum-survey-${new Date().toISOString().slice(0,16).replace(/:/g,'-')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    createCSVExport(allData) {
        // This function exports ALL historical data (for manual backup)
        const headers = [
            'Timestamp', 'Language', 'Visit Types', 'How Found', 'Future Activities', 'Observations',
            'Info Activity Rating', 'Exhibition Interest Rating', 'Info Adequate Rating',
            'Staff Attention Rating', 'Accessibility Rating', 'Cleanliness Rating',
            'Overall Satisfaction Rating'
        ];

        const csvContent = [
            headers.join(','),
            ...allData.map(data => [
                `"${new Date(data.timestamp).toLocaleString()}"`, // Human readable timestamp
                `"${data.language}"`,
                `"${data.visitTypes.join(', ')}"`, // Clean comma separation
                `"${data.howFound.join(', ')}"`, // Clean comma separation
                `"${(data.futureActivities || '').replace(/"/g, '""')}"`, // Handle empty values
                `"${(data.observations || '').replace(/"/g, '""')}"`, // Handle empty values
                data.ratings['info-activity'] || 0,
                data.ratings['exhibition-interest'] || 0,
                data.ratings['info-adequate'] || 0,
                data.ratings['staff-attention'] || 0,
                data.ratings['accessibility'] || 0,
                data.ratings['cleanliness'] || 0,
                data.ratings['overall-satisfaction'] || 0
            ].join(','))
        ].join('\n');

        // Create downloadable CSV for all data
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `museum-survey-all-data-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    setupFormSubmission() {
        const form = document.getElementById('surveyForm');
        const submitBtn = form.querySelector('.submit-btn');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Add loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            try {
                const data = this.collectFormData();
                
                // Validate required ratings
                if (Object.keys(this.ratings).length === 0) {
                    alert('Por favor, califique al menos un aspecto del museo / Please rate at least one aspect of the museum');
                    return;
                }
                
                await this.submitToAppsScript(data);
                this.showSuccessMessage();
                this.showThankYouMessage();
                
            } catch (error) {
                console.error('Submission error:', error);
                alert('Error al enviar la encuesta. Se ha guardado localmente. / Error submitting survey. Saved locally.');
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }

    showThankYouMessage() {
        document.querySelector('.survey-form').style.display = 'none';
        document.getElementById('thankYouMessage').classList.remove('hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Reset form after 5 seconds for next user
        setTimeout(() => {
            this.resetForm();
        }, 5000);
    }

    resetForm() {
        // Reset form
        document.getElementById('surveyForm').reset();
        
        // Reset ratings
        this.ratings = {};
        document.querySelectorAll('.star-rating i').forEach(star => {
            star.classList.remove('active');
            star.style.color = '#ddd';
        });
        
        // Show form again
        document.querySelector('.survey-form').style.display = 'block';
        document.getElementById('thankYouMessage').classList.add('hidden');
    }
}

// Global function to export backup survey data (for manual use if needed)
window.exportBackupSurveyData = function() {
    const backupData = JSON.parse(localStorage.getItem('museumSurveyBackup') || '[]');
    if (backupData.length === 0) {
        alert('No backup survey data found. Data is being sent to n8n workflow.');
        return;
    }
    
    const survey = new MuseumSurvey();
    survey.createCSVExport(backupData);
    console.log(`Exported ${backupData.length} backup survey responses`);
};

// Debug function to check Apps Script integration status
window.checkSurveyStatus = function() {
    const survey = new MuseumSurvey();
    const backupCount = JSON.parse(localStorage.getItem('museumSurveyBackup') || '[]').length;
    console.log(`Survey integration status:
    - Using Google Apps Script: ${survey.APPS_SCRIPT_CONFIG.webAppUrl}
    - Google Sheet ID: ${survey.APPS_SCRIPT_CONFIG.sheetId}
    - Method: Direct POST to Apps Script
    - Backup responses stored: ${backupCount}
    - All submissions go to Google Sheets via Apps Script
    - Backups are kept locally as fallback`);
};

// Test function to check if Apps Script endpoint is working
window.testAppsScript = async function() {
    const survey = new MuseumSurvey();
    try {
        console.log('Testing Apps Script endpoint...');
        const response = await fetch(survey.APPS_SCRIPT_CONFIG.webAppUrl, {
            method: 'GET'
        });
        console.log('GET Response status:', response.status);
        const text = await response.text();
        console.log('GET Response text:', text);
    } catch (error) {
        console.error('GET Test failed:', error);
    }
};

// Initialize the survey when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new MuseumSurvey();
    
    // Add some nice animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Add PWA-like behavior for offline usage (disabled for now)
    // if ('serviceWorker' in navigator) {
    //     window.addEventListener('load', () => {
    //         navigator.serviceWorker.register('./sw.js')
    //             .then(registration => {
    //                 console.log('SW registered: ', registration);
    //             })
    //             .catch(registrationError => {
    //                 console.log('SW registration failed: ', registrationError);
    //             });
    //     });
    // }
});