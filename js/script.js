async function loadUnavailableDates() {
    try {
        const response = await fetch('/.netlify/functions/calendar');

        if (!response.ok) {
            throw new Error('Impossible de récupérer le calendrier.');
        }

        const unavailableDates = await response.json();

        console.log('Dates indisponibles :', unavailableDates);

    } catch (error) {
        console.error('Erreur calendrier :', error);
    }
}

loadUnavailableDates();