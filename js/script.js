
let unavailablePeriods = [];
let currentDate = new Date();
let selectedArrival = null;
let selectedDeparture = null;

const monthNames = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre'
];

async function loadCalendar() {
    try {
        const response = await fetch('/.netlify/functions/calendar');

        if (!response.ok) {
            throw new Error('Impossible de récupérer le calendrier.');
        }

        unavailablePeriods = await response.json();

        console.log('Dates indisponibles :', unavailablePeriods);

        renderCalendar();

    } catch (error) {
        console.error('Erreur calendrier :', error);
    }
}


function renderCalendar() {

    const calendarDays = document.getElementById('calendarDays');
    const currentMonth = document.getElementById('currentMonth');

    if (!calendarDays || !currentMonth) {
        return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentMonth.textContent =
        `${monthNames[month]} ${year}`;
    calendarDays.innerHTML = '';

    // Premier jour du mois

    const firstDay = new Date(year, month, 1);

    // Nombre de jours dans le mois

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // En JavaScript : dimanche = 0

    // On veut lundi = 0

    let firstDayIndex = firstDay.getDay() - 1;

    if (firstDayIndex < 0) {

        firstDayIndex = 6;

    }

    // Cases vides avant le 1er

    for (let i = 0; i < firstDayIndex; i++) {

        const emptyDay = document.createElement('div');

        emptyDay.classList.add(
            'calendar-day',
            'empty'
        );

        calendarDays.appendChild(emptyDay);

    }

    // Jours du mois

    for (let day = 1; day <= daysInMonth; day++) {

        const date = new Date(year, month, day);
        const dateString = formatDate(date);
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;

        const isUnavailable =
            isDateUnavailable(dateString);

        if (isUnavailable) {

            dayElement.classList.add('unavailable');

        } else {

            dayElement.classList.add('available');
            dayElement.setAttribute(
                'role',
                'button'
            );

            dayElement.setAttribute(
                'tabindex',
                '0'
            );

            dayElement.addEventListener(
                'click',

                () => {
                    selectDate(dateString);
                }
            );

            dayElement.addEventListener(
                'dblclick',

                () => {

                    if (

                        dateString === selectedArrival ||
                        dateString === selectedDeparture

                    ) {

                        selectedArrival = null;
                        selectedDeparture = null;

                        renderCalendar();
                        updateCalendarInstruction();

                    }
                }
            );
        }

        // Date d'arrivée

        if (dateString === selectedArrival) {
            dayElement.classList.add(
                'selected-arrival'
            );

        }

        // Date de départ

        if (dateString === selectedDeparture) {
            dayElement.classList.add(
                'selected-departure'
            );

        }

        // Dates comprises entre arrivée et départ

        if (
            selectedArrival &&
            selectedDeparture &&
            dateString > selectedArrival &&
            dateString < selectedDeparture
        ) {

            dayElement.classList.add(
                'selected-range'
            );
        }

        calendarDays.appendChild(dayElement);
    }
}

function selectDate(dateString) {

    // Aucune arrivée sélectionnée
    if (!selectedArrival) {

        selectedArrival = dateString;

        renderCalendar();
        updateCalendarInstruction();
        updateReservationSummary();
        return;
    }

    // Clic sur la même date que l'arrivée
    // = annulation de l'arrivée
    if (
        dateString === selectedArrival &&
        !selectedDeparture
    ) {

        selectedArrival = null;

        renderCalendar();
        updateCalendarInstruction();
        updateReservationSummary();
        return;
    }

    // Une arrivée est sélectionnée,
    // mais pas encore de départ
    if (!selectedDeparture) {

        // Vérifie que toute la période est disponible
        if (
            !isRangeAvailable(
                selectedArrival,
                dateString
            )
        ) {

            alert(
                'Cette période comprend des dates indisponibles.'
            );

            return;
        }

        // Si la date choisie est avant l'arrivée,
        // elle devient la nouvelle arrivée
        if (dateString < selectedArrival) {

            selectedArrival = dateString;

            renderCalendar();
            updateCalendarInstruction();
            updateReservationSummary();
            return;
        }

        // La date est après l'arrivée
        selectedDeparture = dateString;

        renderCalendar();
        updateCalendarInstruction();
        updateReservationSummary();
        return;
    }

    // Arrivée + départ déjà sélectionnés :
    // un nouveau clic recommence une sélection
    selectedArrival = dateString;
    selectedDeparture = null;

    renderCalendar();
    updateCalendarInstruction();
    updateReservationSummary();
}

function updateCalendarInstruction() {

    const instruction =
        document.getElementById(
            'calendarInstruction'
        );

    if (!instruction) {
        return;
    }

    if (!selectedArrival) {

        instruction.textContent =
            'Sélectionnez votre date d’arrivée';
        return;

    }

    if (!selectedDeparture) {

        instruction.textContent =
            'Sélectionnez votre date de départ';
        return;
    }

    const arrival =
        new Date(selectedArrival);

    const departure =
        new Date(selectedDeparture);

    instruction.textContent =
        `Séjour du ${formatDisplayDate(arrival)} au ${formatDisplayDate(departure)}`;
}

function formatDisplayDate(date) {
    return date.toLocaleDateString(
        'fr-FR',
        {
            day: 'numeric',
            month: 'long'
        }
    );
}

function isRangeAvailable(
    startDate,
    endDate
) {

    const current =
        new Date(startDate);

    const end =
        new Date(endDate);

    while (current < end) {

        const dateString =
            formatDate(current);

        if (
            isDateUnavailable(dateString)

        ) {
            return false;
        }

        current.setDate(
            current.getDate() + 1
        );

    }
    return true;

}

function formatDate(date) {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, '0');

    const day =
        String(
            date.getDate()
        ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function isDateUnavailable(dateString) {

    return unavailablePeriods.some(
        period => {
            return (
                dateString >= period.start &&
                dateString < period.end

            );

        }

    );

}

// Mois précédent

document.getElementById('prevMonth')

    ?.addEventListener('click',

        () => {

            currentDate.setMonth(
                currentDate.getMonth() - 1
            );

            renderCalendar();
        }

    );

// Mois suivant

document

    .getElementById('nextMonth')

    ?.addEventListener(
        'click',
        () => {
            currentDate.setMonth(
                currentDate.getMonth() + 1
            );
            renderCalendar();
        }

    );

// Remplit les dates dans le formulaire de réservation

function fillReservationDates() {

    const arrivalInput =
        document.getElementById('arrivee');

    const departureInput =
        document.getElementById('depart');

    if (
        !arrivalInput ||
        !departureInput

    ) {
        return;
    }

    arrivalInput.value =
        selectedArrival || '';

    departureInput.value =
        selectedDeparture || '';

}

// Ouverture du modal de réservation

document.getElementById('openReservationModal')

    ?.addEventListener(
        'click',
        () => {
            fillReservationDates();
        }
    );

function calculateNights() {

    if (!selectedArrival || !selectedDeparture) {
        return 0;
    }

    const arrival = new Date(selectedArrival);
    const departure = new Date(selectedDeparture);

    const difference =
        departure.getTime() - arrival.getTime();

    return Math.round(
        difference / (1000 * 60 * 60 * 24)
    );
}

function updateReservationSummary() {

    const summary =
        document.getElementById('reservationSummary');

    if (!summary) {
        return;
    }

    if (!selectedArrival || !selectedDeparture) {

        summary.textContent = '';

        return;
    }

    const nights = calculateNights();

    const arrival =
        new Date(selectedArrival);

    const departure =
        new Date(selectedDeparture);

    summary.textContent =
        `Séjour du ${formatDisplayDate(arrival)} au ${formatDisplayDate(departure)} — ${nights} ${nights > 1 ? 'nuits' : 'nuit'}`;
}

loadCalendar();