function doGet(e) {
  try {
    // EASY EMAIL CONFIGURATION - Change these values for your museum
    const EMAIL_CONFIG = {
      //primaryEmail: 'museum@finestrat.org',           // Main museum email
      //alertEmail: 'manager@finestrat.org',            // Manager email for alerts
	  primaryEmail: 'viadirecta@duck.com',           // Main museum email
      alertEmail: 'jnatxo@gmail.com',            // Manager email for alerts
      lowRatingThreshold: 3,                          // Send alerts for ratings below this (1-5 scale)
      criticalRatingThreshold: 2,                     // Critical alert threshold
      museumName: 'Museu de Finestrat',              // Your museum name
      sendEmailOnEverySubmission: true,               // Send email for all submissions
      sendAlertsOnly: false                          // If true, only send emails for low ratings
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
        const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // UPDATE THIS
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
      subject = `🚨 CRITICAL: ${config.museumName} Survey - Low Satisfaction Alert`;
      priority = 'high';
    } else if (hasLowRatings) {
      subject = `⚠️ ALERT: ${config.museumName} Survey - Below Expected Rating`;
      priority = 'normal';
    } else {
      subject = `📊 ${config.museumName} Survey - New Response`;
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
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  // Create rating visualization
  const ratingHTML = Object.entries(ratings)
    .map(([key, value]) => {
      if (value === 0) return '';

      const label = getRatingLabel(key);
      const color = getRatingColor(value, config.lowRatingThreshold);
      const stars = '★'.repeat(value) + '☆'.repeat(5 - value);
      const alert = value <= config.lowRatingThreshold ? ' 🚨' : '';

      return `
        <tr>
          <td style="padding: 8px; font-weight: bold;">${label}:</td>
          <td style="padding: 8px; color: ${color}; font-weight: bold;">
            ${stars} (${value}/5)${alert}
          </td>
        </tr>
      `;
    })
    .filter(html => html)
    .join('');

  // Overall satisfaction highlight
  const overallColor = getRatingColor(ratings.overallSatisfaction, config.lowRatingThreshold);
  const overallAlert = ratings.overallSatisfaction <= config.lowRatingThreshold ?
    '<div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 10px 0;"><strong>⚠️ ATTENTION NEEDED: Overall satisfaction is below expected level!</strong></div>' : '';

  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2c3e50; color: white; padding: 20px; text-align: center;">
          <h1>📋 ${config.museumName}</h1>
          <h2>New Survey Response</h2>
          <p style="margin: 0; font-size: 14px;">${timestamp}</p>
        </div>

        ${overallAlert}

        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">📊 Rating Summary</h3>
          <div style="text-align: center; margin: 20px 0;">
            <div style="font-size: 48px; color: ${getRatingColor(averageRating, config.lowRatingThreshold)};">
              ${averageRating.toFixed(1)}/5.0
            </div>
            <div style="font-size: 18px; color: #666;">Average Rating</div>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            ${ratingHTML}
          </table>
        </div>

        <div style="background: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
          <h3>👥 Visit Information</h3>
          <p><strong>Visit Types:</strong> ${params.visitTypes || 'Not specified'}</p>
          <p><strong>How they found us:</strong> ${params.howFound || 'Not specified'}</p>
          <p><strong>Future Activities Interest:</strong> ${params.futureActivities || 'Not specified'}</p>
          <p><strong>Language:</strong> ${params.language || 'es'}</p>

          ${params.observations ? `
            <div style="background: #f0f7ff; border-left: 4px solid #2196F3; padding: 15px; margin: 10px 0;">
              <strong>💬 Visitor Comments:</strong><br>
              <em>"${params.observations}"</em>
            </div>
          ` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${sheetUrl}"
             style="background: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            📊 View Full Data in Google Sheets
          </a>
        </div>

        <div style="background: #eceff1; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated notification from ${config.museumName} survey system.</p>
          <p>Response recorded at: ${timestamp}</p>
        </div>
      </body>
    </html>
  `;
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
}