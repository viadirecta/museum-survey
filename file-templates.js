// File Templates for Museum Survey Generator
// This file contains template strings for all museum survey files

const FILE_TEMPLATES = {

    // Enhanced Google Apps Script with email notifications
    appsScript: `function doGet(e) {
  try {
    // EASY EMAIL CONFIGURATION - Change these values for your museum
    const EMAIL_CONFIG = {
      primaryEmail: '{{PRIMARY_EMAIL}}',                    // Main museum email
      alertEmail: '{{ALERT_EMAIL}}',                        // Manager email for alerts
      lowRatingThreshold: {{LOW_RATING_THRESHOLD}},         // Send alerts for ratings below this (1-5 scale)
      criticalRatingThreshold: {{CRITICAL_RATING_THRESHOLD}}, // Critical alert threshold
      museumName: '{{MUSEUM_NAME}}',                        // Your museum name
      sendEmailOnEverySubmission: {{SEND_EMAIL_ON_EVERY_SUBMISSION}}, // Send email for all submissions
      sendAlertsOnly: {{SEND_ALERTS_ONLY}}                 // If true, only send emails for low ratings
    };

    const response = {
      message: "Apps Script is working",
      parametersReceived: e.parameter || {},
      parameterCount: e.parameter ? Object.keys(e.parameter).length : 0,
      hasVisitTypes: !!(e.parameter && e.parameter.visitTypes)
    };

    // If we have parameters, try to save to sheet and send email
    if (e.parameter && Object.keys(e.parameter).length > 0) {
      try {
        const SHEET_ID = '{{GOOGLE_SHEET_ID}}'; // UPDATE THIS
        const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();

        // Add headers if sheet is empty
        if (sheet.getLastRow() === 0) {
          sheet.appendRow([
            'Timestamp', 'Visit Types', 'Info Activity', 'Exhibition Interest',
            'Info Adequate', 'Staff Attention', 'Accessibility', 'Cleanliness',
            'Overall Satisfaction', 'How Found Us', 'Future Activities', 'Observations', 'Language'
          ]);
        }

        // Add the data
        const rowData = [
          new Date(),
          e.parameter.visitTypes || '',
          e.parameter.infoActivity || '',
          e.parameter.exhibitionInterest || '',
          e.parameter.infoAdequate || '',
          e.parameter.staffAttention || '',
          e.parameter.accessibility || '',
          e.parameter.cleanliness || '',
          e.parameter.overallSatisfaction || '',
          e.parameter.howFound || '',
          e.parameter.futureActivities || '',
          e.parameter.observations || '',
          e.parameter.language || 'es'
        ];

        sheet.appendRow(rowData);

        // Send email notification with visual alerts
        sendSurveyNotification(e.parameter, EMAIL_CONFIG, SHEET_ID);

        response.success = true;
        response.message = "Data saved successfully and email sent";
        response.dataSaved = true;

      } catch (error) {
        response.success = false;
        response.error = error.toString();
        response.dataSaved = false;
      }
    } else {
      response.success = false;
      response.message = "No parameters received";
      response.dataSaved = false;
    }

    return ContentService
      .createTextOutput(JSON.stringify(response, null, 2))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: "Apps Script error"
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendSurveyNotification(params, config, sheetId) {
  try {
    // Extract ratings (convert to numbers)
    const ratings = {
      infoActivity: parseInt(params.infoActivity) || 0,
      exhibitionInterest: parseInt(params.exhibitionInterest) || 0,
      infoAdequate: parseInt(params.infoAdequate) || 0,
      staffAttention: parseInt(params.staffAttention) || 0,
      accessibility: parseInt(params.accessibility) || 0,
      cleanliness: parseInt(params.cleanliness) || 0,
      overallSatisfaction: parseInt(params.overallSatisfaction) || 0
    };

    // Calculate average rating
    const ratingValues = Object.values(ratings).filter(r => r > 0);
    const averageRating = ratingValues.length > 0 ?
      (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) : 0;

    // Determine alert level
    const hasLowRatings = ratingValues.some(r => r <= config.lowRatingThreshold);
    const hasCriticalRatings = ratingValues.some(r => r <= config.criticalRatingThreshold);

    // Skip email if only sending alerts and no low ratings
    if (config.sendAlertsOnly && !hasLowRatings) {
      return;
    }

    // Determine email subject and priority
    let subject, priority;
    if (hasCriticalRatings) {
      subject = \`🚨 CRITICAL: \${config.museumName} Survey - Low Satisfaction Alert\`;
      priority = 'high';
    } else if (hasLowRatings) {
      subject = \`⚠️ ALERT: \${config.museumName} Survey - Below Expected Rating\`;
      priority = 'normal';
    } else {
      subject = \`📊 \${config.museumName} Survey - New Response\`;
      priority = 'normal';
    }

    // Create visual email content
    const emailBody = createVisualEmailBody(params, ratings, averageRating, config, sheetId);

    // Determine recipients
    const recipients = hasLowRatings ?
      [config.primaryEmail, config.alertEmail].join(',') :
      config.primaryEmail;

    // Send email
    GmailApp.sendEmail(
      recipients,
      subject,
      '', // Plain text (empty since we're using HTML)
      {
        htmlBody: emailBody,
        attachments: []
      }
    );

  } catch (error) {
    console.error('Email sending failed:', error);
  }
}

function createVisualEmailBody(params, ratings, averageRating, config, sheetId) {
  const timestamp = new Date().toLocaleString('es-ES');
  const sheetUrl = \`https://docs.google.com/spreadsheets/d/\${sheetId}/edit\`;

  // Create rating visualization
  const ratingHTML = Object.entries(ratings)
    .map(([key, value]) => {
      if (value === 0) return '';

      const label = getRatingLabel(key);
      const color = getRatingColor(value, config.lowRatingThreshold);
      const stars = '★'.repeat(value) + '☆'.repeat(5 - value);
      const alert = value <= config.lowRatingThreshold ? ' 🚨' : '';

      return \`
        <tr>
          <td style="padding: 8px; font-weight: bold;">\${label}:</td>
          <td style="padding: 8px; color: \${color}; font-weight: bold;">
            \${stars} (\${value}/5)\${alert}
          </td>
        </tr>
      \`;
    })
    .filter(html => html)
    .join('');

  // Overall satisfaction highlight
  const overallColor = getRatingColor(ratings.overallSatisfaction, config.lowRatingThreshold);
  const overallAlert = ratings.overallSatisfaction <= config.lowRatingThreshold ?
    '<div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 10px 0;"><strong>⚠️ ATTENTION NEEDED: Overall satisfaction is below expected level!</strong></div>' : '';

  return \`
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2c3e50; color: white; padding: 20px; text-align: center;">
          <h1>📋 \${config.museumName}</h1>
          <h2>New Survey Response</h2>
          <p style="margin: 0; font-size: 14px;">\${timestamp}</p>
        </div>

        \${overallAlert}

        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">📊 Rating Summary</h3>
          <div style="text-align: center; margin: 20px 0;">
            <div style="font-size: 48px; color: \${getRatingColor(averageRating, config.lowRatingThreshold)};">
              \${averageRating.toFixed(1)}/5.0
            </div>
            <div style="font-size: 18px; color: #666;">Average Rating</div>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            \${ratingHTML}
          </table>
        </div>

        <div style="background: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
          <h3>👥 Visit Information</h3>
          <p><strong>Visit Types:</strong> \${params.visitTypes || 'Not specified'}</p>
          <p><strong>How they found us:</strong> \${params.howFound || 'Not specified'}</p>
          <p><strong>Future Activities Interest:</strong> \${params.futureActivities || 'Not specified'}</p>
          <p><strong>Language:</strong> \${params.language || 'es'}</p>

          \${params.observations ? \`
            <div style="background: #f0f7ff; border-left: 4px solid #2196F3; padding: 15px; margin: 10px 0;">
              <strong>💬 Visitor Comments:</strong><br>
              <em>"\${params.observations}"</em>
            </div>
          \` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="\${sheetUrl}"
             style="background: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            📊 View Full Data in Google Sheets
          </a>
        </div>

        <div style="background: #eceff1; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated notification from \${config.museumName} survey system.</p>
          <p>Response recorded at: \${timestamp}</p>
        </div>
      </body>
    </html>
  \`;
}

function getRatingLabel(key) {
  const labels = {
    'infoActivity': 'Information Activity',
    'exhibitionInterest': 'Exhibition Interest',
    'infoAdequate': 'Information Adequate',
    'staffAttention': 'Staff Attention',
    'accessibility': 'Accessibility',
    'cleanliness': 'Cleanliness',
    'overallSatisfaction': 'Overall Satisfaction'
  };
  return labels[key] || key;
}

function getRatingColor(rating, threshold) {
  if (rating <= threshold - 1) return '#f44336'; // Red for critical
  if (rating <= threshold) return '#ff9800';      // Orange for low
  if (rating <= threshold + 1) return '#ffc107';  // Yellow for medium
  return '#4caf50';                               // Green for good
}`,

    // Manifest.json template
    manifest: `{
    "name": "{{MUSEUM_NAME}} Survey",
    "short_name": "{{MUSEUM_SHORT_NAME}} Survey",
    "description": "Digital survey form for {{MUSEUM_NAME}} visitors",
    "start_url": "./",
    "display": "standalone",
    "background_color": "#667eea",
    "theme_color": "#2c3e50",
    "orientation": "portrait",
    "scope": "./",
    "lang": "{{DEFAULT_LANGUAGE}}",
    "icons": [
        {
            "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232c3e50'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='40' font-weight='bold' text-anchor='middle' fill='white'%3EM%3C/text%3E%3C/svg%3E",
            "sizes": "192x192",
            "type": "image/svg+xml"
        },
        {
            "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232c3e50'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='40' font-weight='bold' text-anchor='middle' fill='white'%3EM%3C/text%3E%3C/svg%3E",
            "sizes": "512x512",
            "type": "image/svg+xml"
        }
    ],
    "categories": ["education", "productivity"],
    "screenshots": [
        {
            "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 800'%3E%3Crect width='400' height='800' fill='%23667eea'/%3E%3Crect x='20' y='100' width='360' height='600' rx='20' fill='white'/%3E%3Ctext x='200' y='150' font-family='Arial' font-size='18' font-weight='bold' text-anchor='middle' fill='%232c3e50'%3E{{MUSEUM_SHORT_NAME}} Survey%3C/text%3E%3C/svg%3E",
            "sizes": "400x800",
            "type": "image/svg+xml",
            "form_factor": "narrow"
        }
    ]
}`,

    // JavaScript configuration template
    scriptConfig: `    // GOOGLE APPS SCRIPT CONFIGURATION
    APPS_SCRIPT_CONFIG = {
        webAppUrl: '{{APPS_SCRIPT_URL}}', // Replace with your working Apps Script URL
        sheetId: '{{GOOGLE_SHEET_ID}}'
    };`,

    // HTML museum info section template
    museumInfoSection: `            <div class="museum-logo">
                <img src="{{LOGO_FILENAME}}" alt="{{MUSEUM_NAME}}" class="logo-img">
                <div class="museum-info">
                    <h1>{{MUSEUM_NAME_UPPER}}</h1>
                    <p>{{MUSEUM_ADDRESS}}<br>
                    {{MUSEUM_CONTACT}}</p>
                </div>
            </div>`,

    // Deployment instructions template
    deploymentInstructions: `# {{MUSEUM_NAME}} Survey - Deployment Instructions

## 🚀 Your Survey is Ready!

### What's Included:
- ✅ Customized survey with your museum branding
- ✅ {{LOGO_FILENAME}} - Your museum logo
- ✅ Google Apps Script with email notifications
- ✅ Supports languages: {{SUPPORTED_LANGUAGES}}
- ✅ Email alerts for ratings below {{LOW_RATING_THRESHOLD}}/5

### 📧 Email Configuration:
- **Primary Email:** {{PRIMARY_EMAIL}}
- **Alert Email:** {{ALERT_EMAIL}} (receives low rating alerts)
- **Email Frequency:** {{EMAIL_FREQUENCY}}

### 🔧 Google Setup Required:

#### 1. Create Google Sheet:
1. Go to [sheets.google.com](https://sheets.google.com)
2. Create new sheet: "{{MUSEUM_NAME}} Survey Responses"
3. **Copy your Sheet ID:** {{GOOGLE_SHEET_ID}}

#### 2. Update Apps Script:
1. Go to [script.google.com](https://script.google.com)
2. Create new project: "{{MUSEUM_NAME}} Survey Handler"
3. Copy and paste the code from \`apps-script.js\`
4. **Verify the Sheet ID is correct:** {{GOOGLE_SHEET_ID}}
5. Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone
   - **Copy the Web App URL:** {{APPS_SCRIPT_URL}}

### 🌐 Deploy Your Survey:

#### Option 1: Netlify (Recommended)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop this folder to deploy
3. Your survey will be live instantly!

#### Option 2: GitHub Pages
1. Upload all files to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Access at: \`https://yourusername.github.io/repository-name\`

### ✅ Testing Checklist:
- [ ] Submit test survey with low ratings (1-2 stars)
- [ ] Check email notifications arrive
- [ ] Verify data appears in Google Sheets
- [ ] Test on mobile devices
- [ ] Test language switching

### 📊 Managing Responses:
- **View Data:** Open your Google Sheet
- **Create Charts:** Select data → Insert → Chart
- **Export Data:** File → Download → CSV/PDF
- **Real-time Updates:** Data appears instantly after submission

### 🆘 Support:
If something isn't working:
1. Check that Apps Script Web App URL is correct in \`script.js\`
2. Verify Google Sheet ID matches in both Apps Script and \`script.js\`
3. Ensure Apps Script is deployed with "Anyone" access
4. Test Apps Script directly: \`{{APPS_SCRIPT_URL}}?visitTypes=test&infoActivity=5\`

---

**Total setup time: ~15 minutes | Cost: $0 | Maintenance: Minimal**

Your museum survey system is ready to collect visitor feedback and send instant email alerts!`

};

// Function to replace template placeholders
function replaceTemplatePlaceholders(template, config) {
    let result = template;

    // Replace all placeholders with actual values
    const replacements = {
        '{{MUSEUM_NAME}}': config.museumName,
        '{{MUSEUM_NAME_UPPER}}': config.museumName.toUpperCase(),
        '{{MUSEUM_SHORT_NAME}}': config.museumName.replace(/^(Museu de |Museo de |Museum of |)/i, ''),
        '{{MUSEUM_ADDRESS}}': config.museumAddress,
        '{{MUSEUM_CONTACT}}': config.museumContact,
        '{{LOGO_FILENAME}}': config.logoFileName,
        '{{GOOGLE_SHEET_ID}}': config.googleSheetId,
        '{{APPS_SCRIPT_URL}}': config.appsScriptUrl,
        '{{PRIMARY_EMAIL}}': config.primaryEmail,
        '{{ALERT_EMAIL}}': config.alertEmail,
        '{{LOW_RATING_THRESHOLD}}': config.lowRatingThreshold,
        '{{CRITICAL_RATING_THRESHOLD}}': config.criticalRatingThreshold,
        '{{SEND_EMAIL_ON_EVERY_SUBMISSION}}': config.sendEmailOnEverySubmission,
        '{{SEND_ALERTS_ONLY}}': config.sendAlertsOnly,
        '{{DEFAULT_LANGUAGE}}': config.defaultLanguage,
        '{{SUPPORTED_LANGUAGES}}': config.supportedLanguages,
        '{{EMAIL_FREQUENCY}}': config.emailFrequency
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '');
    });

    return result;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FILE_TEMPLATES, replaceTemplatePlaceholders };
}