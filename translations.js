const translations = {
    es: {
        'visit-info': 'Información de la visita',
        'visit-reason': 'Motivo de la visita',
        'general-visit': 'Visita general Museo',
        'temporary-exhibition': 'Exposición temporal',
        'conference': 'Conferencia',
        'literary-presentation': 'Presentación literaria',
        'other': 'Otras',
        'help-improve': '¡AYÚDENOS A MEJORAR!',
        'help-text': 'Estimado visitante, gracias por visitar nuestro Museo. Le agradeceremos enormemente que rellene el siguiente cuestionario para seguir mejorando y lograr una mayor satisfacción de nuestros servicios.',
        'rating-instruction': 'Puntúe del 1 (muy insatisfecho/ en desacuerdo) al 5 (muy satisfecho / muy de acuerdo) los siguientes aspectos:',
        'info-activity': 'La información sobre la actividad por la que nos visita es adecuada',
        'exhibition-interest': 'La exposición permanente le ha parecido interesante (diseño, calidad, interés)',
        'info-adequate': 'La información es adecuada (pantallas, textos, iluminación...)',
        'staff-attention': 'La atención del personal ha sido de su agrado',
        'accessibility': 'La accesibilidad del Museo es adecuada',
        'cleanliness': 'Limpieza y orden de las instalaciones',
        'overall-satisfaction': 'Satisfacción general de su visita',
        'how-meet': '¿Cómo nos conoció?',
        'internet': 'Internet',
        'specialized-guides': 'Guías especializadas',
        'tourist-office': 'Oficina Turismo',
        'press': 'Prensa',
        'future-activities': '¿Qué actividades le gustaría que se programaran?',
        'future-activities-placeholder': 'Escriba sus sugerencias aquí...',
        'observations': 'Observaciones',
        'observations-placeholder': 'Comparta sus comentarios adicionales...',
        'submit': 'Enviar encuesta',
        'thank-you-title': '¡Gracias por su tiempo!',
        'thank-you-text': 'Su opinión es muy valiosa para nosotros y nos ayuda a mejorar continuamente.'
    },
    en: {
        'visit-info': 'Visit Information',
        'visit-reason': 'Reason for the visit',
        'general-visit': 'General Museum visit',
        'temporary-exhibition': 'Temporary exhibition',
        'conference': 'Conference',
        'literary-presentation': 'Literary presentation',
        'other': 'Other',
        'help-improve': 'HELP US TO IMPROVE!',
        'help-text': 'Dear visitor, thank you for visiting our museum. We would be very grateful if you could fill in the following questionnaire to continue to improve and achieve greater satisfaction with our services.',
        'rating-instruction': 'Please rate from 1 (very dissatisfied/disagree) to 5 (very satisfied/strongly agree) the following aspects:',
        'info-activity': 'The information on the activity for which you are visiting us is adequate',
        'exhibition-interest': 'He found the permanent exhibition interesting (design, quality, interest)',
        'info-adequate': 'The information is adequate (screens, texts, lighting, etc.)',
        'staff-attention': 'The attention of the Museum\'s staff has been to their liking',
        'accessibility': 'The accessibility of the Museum is adequate',
        'cleanliness': 'Cleanliness and tidiness of the facilities',
        'overall-satisfaction': 'Overall satisfaction with your visit',
        'how-meet': 'How did you meet us?',
        'internet': 'Internet',
        'specialized-guides': 'Specialised guides',
        'tourist-office': 'Tourist Office',
        'press': 'Press',
        'future-activities': 'What activities would you like to see scheduled?',
        'future-activities-placeholder': 'Write your suggestions here...',
        'observations': 'Observations',
        'observations-placeholder': 'Share your additional comments...',
        'submit': 'Submit survey',
        'thank-you-title': 'Thank you for your time!',
        'thank-you-text': 'Your opinion is very valuable to us and helps us improve continuously.'
    },
    ca: {
        'visit-info': 'Informació de la visita',
        'visit-reason': 'Motiu de la visita',
        'general-visit': 'Visita general Museu',
        'temporary-exhibition': 'Exposició temporal',
        'conference': 'Conferència',
        'literary-presentation': 'Presentació literària',
        'other': 'Altres',
        'help-improve': 'AJUDEU-NOS A MILLORAR!',
        'help-text': 'Estimat visitant, gràcies per visitar el nostre Museu. Us agrairem enormement que ompliu el següent qüestionari per seguir millorant i aconseguir una major satisfacció dels nostres serveis.',
        'rating-instruction': 'Puntueu de l\'1 (molt insatisfet/ en desacord) al 5 (molt satisfet / molt d\'acord) els següents aspectes:',
        'info-activity': 'La informació sobre l\'activitat per la qual ens visiteu és adequada',
        'exhibition-interest': 'L\'exposició permanent li ha semblat interessant (disseny, qualitat, interès)',
        'info-adequate': 'La informació és adequada (pantalles, textos, il·luminació...)',
        'staff-attention': 'L\'atenció del personal ha estat del seu grat',
        'accessibility': 'L\'accessibilitat del Museu és adequada',
        'cleanliness': 'Neteja i ordre de les instal·lacions',
        'overall-satisfaction': 'Satisfacció general de la seva visita',
        'how-meet': 'Com ens vau conèixer?',
        'internet': 'Internet',
        'specialized-guides': 'Guies especialitzades',
        'tourist-office': 'Oficina Turisme',
        'press': 'Premsa',
        'future-activities': 'Quines activitats us agradaria que es programessin?',
        'future-activities-placeholder': 'Escriviu els vostres suggeriments aquí...',
        'observations': 'Observacions',
        'observations-placeholder': 'Compartiu els vostres comentaris addicionals...',
        'submit': 'Enviar enquesta',
        'thank-you-title': 'Gràcies pel vostre temps!',
        'thank-you-text': 'La vostra opinió és molt valuosa per a nosaltres i ens ajuda a millorar contínuament.'
    }
};

function updateLanguage(lang) {
    document.documentElement.lang = lang;
    
    // Update all elements with data-key attribute
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-key-placeholder]').forEach(element => {
        const key = element.getAttribute('data-key-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });
}

// Initialize language switching
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            updateLanguage(lang);
            localStorage.setItem('selectedLanguage', lang);
        });
    });
    
    // Load saved language or default to Spanish
    const savedLang = localStorage.getItem('selectedLanguage') || 'es';
    updateLanguage(savedLang);
});