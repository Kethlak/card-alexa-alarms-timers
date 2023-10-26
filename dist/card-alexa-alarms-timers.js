class CardAlexaAlarmsTimers extends HTMLElement {
    // Whenever the state changes, a new `hass` object is set. Use this to
    // update your content.
    set hass(hass) {
        // Initialize the content if it's not there yet.
        this.hassStored = hass;

        if (!this.initialized) {
            // we only want to run this once
            this.initialized = true;
            this.alarms;
            this.interval = window.setInterval(this.draw.bind(this), 1000);
            this.draw();
        }

    }

    get hass() {
        return this.hassStored;
    }

    // The user supplied configuration. Throw an exception and Lovelace will
    // render an error card.
    setConfig(config) {
        this.config = config;
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return 3;
    }
    draw() {
        // Alarms
        const entities = this.config.entities_alarm;

        this.alarms = [];
        for (let i = 0; i < entities.length; i++) {
            if (this.hass.states[entities[i]] !== undefined) {
                const attributes = this.hass.states[entities[i]].attributes;
                const entity_id = this.hass.states[entities[i]].attributes.friendly_name;
                if (attributes.hasOwnProperty('sorted_active')) {
                    const sorted_active = JSON.parse(attributes.sorted_active);
                    for (let j = 0; j < sorted_active.length; j++) {
                        const alarm = sorted_active[j][1];
                        if (Date.parse(alarm.date_time) >= Date.now()) {
                            let showSeconds = true;
                            console.log('does show_alarm_name_seconds exist? ' + this.config.hasOwnProperty('show_alarm_name_seconds'));
                            console.log('what is show_alarm_name_seconds?');
                            console.log(this.config.show_alarm_name_seconds);
                            if(this.config.hasOwnProperty('show_alarm_name_seconds') && this.config.show_alarm_name_seconds == false) {
                                showSeconds = false;
                            }
                            this.alarms.push(new AlexaAlarm(alarm.alarmLabel, entity_id, alarm.date_time, showSeconds));
                        }
                    }
                }
            }
        }
        this.alarms.sort((a, b) => a.alarmTime - b.alarmTime);

        // Timers
        const entities_t = this.config.entities_timer;
        this.timers = [];
        for (let i = 0; i < entities_t.length; i++) {
            if (this.hass.states[entities_t[i]] !== undefined) {
                const attributes = this.hass.states[entities_t[i]].attributes;
                const entity_id = this.hass.states[entities_t[i]].attributes.friendly_name;
                if (attributes.hasOwnProperty('sorted_active')) {
                    const sorted_active = JSON.parse(attributes.sorted_active);
                    for (let j = 0; j < sorted_active.length; j++) {
                        const timer = sorted_active[j][1];
                        if (timer.triggerTime >= new Date().getTime()) {
                            this.timers.push(new AlexaTimer(timer.timerLabel, entity_id, timer.triggerTime, timer.originalDurationInMillis));
                        }
                    }
                }
            }
        }
        this.timers.sort((a, b) => a.remainingTime - b.remainingTime);

        this.innerHTML = '';
        this.content = null;

        if (this.alarms.length > 0 || this.timers.length > 0 || (!this.config.hasOwnProperty('hide_card_on_empty') || this.config.hide_card_on_empty == false)) {
            const haCard = document.createElement('ha-card');
            haCard.classList.add('alexa-alarms-timers');
            const cardContent = document.createElement('div');
            cardContent.classList.add('card-content');
            haCard.appendChild(cardContent);
            this.appendChild(haCard);
            this.content = cardContent;

            const table = document.createElement('table');
            table.setAttribute('border', '0');
            table.setAttribute('width', '100%');
            if(!this.config.hasOwnProperty('card_title') || this.config.card_title != "") {
                let h1Text = 'Alexa Timers and Alarms';
                if(this.config.hasOwnProperty('card_title')) {
                    h1Text = this.config.card_title;
                }
                haCard.setAttribute("header", h1Text);
            }
            // Alarms
            for (let i = 0; i < this.alarms.length; i++) {
                let name = this.alarms[i].name;
                let timeLeft = "";
                if (this.alarms[i].days > 0) {
                    timeLeft = this.alarms[i].days + "days, ";
                }
                timeLeft += this.alarms[i].hours + ":" + addLeadingZero(this.alarms[i].minutes) + ":" + addLeadingZero(this.alarms[i].seconds);
                if(this.config.hasOwnProperty('show_empty_hours') && this.config.show_empty_hours == false) {
                    if(this.timers[i].hours == 0 && this.alarms[i].days == 0) {
                        timeLeft = addLeadingZero(this.timers[i].minutes) + ":" + addLeadingZero(this.timers[i].seconds);
                    }
                }
                const tr = document.createElement('tr');
                let nameTd = document.createElement('td');
                let nameTdText = document.createTextNode(name);
                if(!this.config.hasOwnProperty('show_device_name') || this.config.show_device_name == true) {
                    nameTdText = document.createTextNode(name + " Alarm on " + this.alarms[i].device);
                }
                nameTd.appendChild(nameTdText);
                tr.appendChild(nameTd);
                let timeLeftTd = document.createElement('td');
                let timeLeftTdText = document.createTextNode(timeLeft);
                if(!this.config.hasOwnProperty('remaining_time_bold') || this.config.remaining_time_bold == true) {
                    let timeLeftTdTextInner = document.createTextNode(timeLeft);
                    timeLeftTdText = document.createElement('strong');
                    timeLeftTdText.appendChild(timeLeftTdTextInner);
                }
                timeLeftTd.appendChild(timeLeftTdText);
                tr.appendChild(timeLeftTd);
                if(this.config.hasOwnProperty("show_cancel_button") && this.config.show_cancel_button == true && this.config.hasOwnProperty("cancel_entity")) {
                    let xTd = document.createElement('td');
                    let a = document.createElement('a');
                    let aContent = document.createElement('ha-icon');
                    aContent.setAttribute("icon", "mdi:close-circle-outline");
                    a.appendChild(aContent);
                    a.classList.add('timerCancelButton');
                    a.href = '#';
                    xTd.appendChild(a);
                    tr.appendChild(xTd);
                    a.addEventListener('click', (e) => {
                      cancelTimerAlarm(this.hass, this.config.cancel_entity, i, this.alarms, "alarm");
                      e.preventDefault();
                    });
                }
                table.appendChild(tr);
            }
            // Timers
            for (let i = 0; i < this.timers.length; i++) {
                let name = this.timers[i].label;
                if (name === null) {
                    name = getNameFromDuration(this.timers[i].originalDurationInMillis);
                }
                let timeLeft = this.timers[i].hours + ":" + addLeadingZero(this.timers[i].minutes) + ":" + addLeadingZero(this.timers[i].seconds);
                if(this.config.hasOwnProperty('show_empty_hours') && this.config.show_empty_hours == false) {
                    if(this.timers[i].hours == 0) {
                        timeLeft = addLeadingZero(this.timers[i].minutes) + ":" + addLeadingZero(this.timers[i].seconds);
                    }
                }
                const tr = document.createElement('tr');
                let nameTd = document.createElement('td');
                let nameTdText = document.createTextNode(name);
                if(!this.config.hasOwnProperty('show_device_name') || this.config.show_device_name == true) {
                    nameTdText = document.createTextNode(name + " on " + this.timers[i].device);
                }
                nameTd.appendChild(nameTdText);
                tr.appendChild(nameTd);
                let timeLeftTd = document.createElement('td');
                let timeLeftTdText = document.createTextNode(timeLeft);
                if(!this.config.hasOwnProperty('remaining_time_bold') || this.config.remaining_time_bold == true) {
                    timeLeftTdText = document.createElement('strong');
                    let timeLeftTdTextInner = document.createTextNode(timeLeft);
                    timeLeftTdText.appendChild(timeLeftTdTextInner);
                }
                timeLeftTd.appendChild(timeLeftTdText);
                tr.appendChild(timeLeftTd);
                if(this.config.hasOwnProperty("show_cancel_button") && this.config.show_cancel_button == true && this.config.hasOwnProperty("cancel_entity")) {
                    let xTd = document.createElement('td');
                    let a = document.createElement('a');
                    let aContent = document.createElement('ha-icon');
                    aContent.setAttribute("icon", "mdi:close-circle-outline");
                    a.appendChild(aContent);
                    a.classList.add('timerCancelButton');
                    a.href = '#';
                    xTd.appendChild(a);
                    tr.appendChild(xTd);
                    a.addEventListener('click', (e) => {
                      cancelTimerAlarm(this.hass, this.config.cancel_entity, i, this.timers, "timer");
                      e.preventDefault();
                    });
                }
                table.appendChild(tr);
            }
            cardContent.append(table);
        }
    }
}

class AlexaAlarm {
    constructor(label, device, date_time, showSeconds) {
        this.name = label;
        if (this.name == null) {
            this.name = getNameFromTime(date_time, showSeconds);
        }
        this.device = device.substring(0, device.indexOf("next"));
        this.alarmTime = date_time;
        this.remainingTime = Date.parse(date_time) - Date.now();
        this.seconds = Math.floor(this.remainingTime / 1000);
        this.minutes = Math.floor(this.seconds / 60);
        this.hours = Math.floor(this.minutes / 60);
        this.days = Math.floor(this.hours / 24);
        this.seconds = this.seconds % 60;
        this.minutes = this.minutes % 60;
        this.hours = this.hours % 24;
    }
}

class AlexaTimer {
    constructor(label, device, triggerTime, originalDurationInMillis) {
        this.label = label;
        this.device = device.substring(0, device.indexOf("next"));
        this.triggerTime = triggerTime;
        this.remainingTime = this.triggerTime - (new Date().getTime());
        this.seconds = Math.floor(this.remainingTime / 1000);
        this.minutes = Math.floor(this.seconds / 60);
        this.hours = Math.floor(this.minutes / 60);
        this.seconds = this.seconds % 60;
        this.minutes = this.minutes % 60;
        this.originalDurationInMillis = originalDurationInMillis;
    }
}

function addLeadingZero(num) {
    if (num < 10) {
        return "0" + num;
    }
    else {
        return num.toString();
    }
}

function getNameFromTime(alarmTime, showSeconds) {
    console.log('getNameFromTime, alarmTime=' + alarmTime, ', showSeconds=' + showSeconds);
    let alarmDateTime = new Date(alarmTime);
    let today = new Date(Date.now());
    let isAlarmToday = false;
    if (alarmDateTime.getFullYear() == today.getFullYear() && alarmDateTime.getDate() == today.getDate() && alarmDateTime.getMonth() == today.getMonth()) {
        isAlarmToday = true;
    }
    let name = "";
    if (isAlarmToday) {
        name = "";
    }
    else {
        name = getMonthNameFromNumber(alarmDateTime.getMonth()) + " " + alarmDateTime.getDate() + " at ";
    }
    if(showSeconds) {
        name += alarmDateTime.toLocaleTimeString();
    }
    else {
        name += alarmDateTime.toLocaleTimeString(
            'en-US',
            {
                hour: 'numeric',
                minute: '2-digit'
            }
        )
    }
    return name;
}

function getMonthNameFromNumber(monthNum) {
    switch (monthNum) {
        case 0:
            return "January";
        case 1:
            return "February";
        case 2:
            return "March";
        case 3:
            return "April";
        case 4:
            return "May";
        case 5:
            return "June";
        case 6:
            return "July";
        case 7:
            return "August";
        case 8:
            return "September";
        case 9:
            return "October";
        case 10:
            return "November";
        case 11:
            return "December";
        default:
            return null;
    }
}

function getNameFromDuration(millis) {
    let seconds = Math.floor(millis / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    seconds = seconds % 60;
    minutes = minutes % 60;
    let name = "";
    if (hours > 0) {
        name += hours + " Hour";
        if (minutes > 0 || seconds > 0) {
            name += ", ";
        }
        else {
            name += " ";
        }
    }
    if (minutes > 0) {
        name += minutes + " Minute";
        if (seconds > 0) {
            name += ", ";
        }
        else {
            name += " ";
        }
    }
    if (seconds > 0) {
        name += seconds + " Second ";
    }
    name += " Timer";
    return name;
}

function cancelTimerAlarm(hass, entity_id, alarm_id, alarms, isTimerOrAlarm) {
    let timerName = "";
    if(isTimerOrAlarm == "timer" && alarms[alarm_id].label === null) {
        const filteredAlarms = alarms.filter((alarm) => alarm.originalDurationInMillis == alarms[alarm_id].originalDurationInMillis);
        timerName = getNameFromDuration(alarms[alarm_id].originalDurationInMillis);
        if(filteredAlarms.length > 1) {
            let ordinalName = "the " + getOrdinal(filteredAlarms.indexOf(alarms[alarm_id]) + 1) + " one";
            let media_content_id = "cancel " + timerName.toLowerCase();
            hass.callService("media_player", "play_media", {
                'entity_id': entity_id,
                'media_content_id': media_content_id,
                'media_content_type': "custom"
            });
            setTimeout(() => {
                hass.callService("media_player", "play_media", {
                    'entity_id': entity_id,
                    'media_content_id': ordinalName,
                    'media_content_type': "custom"
                });
            }, 2000);
        }
        else {
            let media_content_id = "cancel " + timerName.toLowerCase();
            hass.callService("media_player", "play_media", {
                'entity_id': entity_id,
                'media_content_id': media_content_id,
                'media_content_type': "custom"
            });
        }
    }
    else if(isTimerOrAlarm == "timer") {
        timerName = alarms[alarm_id].label + " timer";
        let media_content_id = "cancel " + timerName.toLowerCase();
        hass.callService("media_player", "play_media", {
            'entity_id': entity_id,
            'media_content_id': media_content_id,
            'media_content_type': "custom"
        });
    }
    else {
        timerName = getNameFromTime(alarms[alarm_id].alarmTime);
        let media_content_id = "cancel the alarm for " + timerName;
        hass.callService("media_player", "play_media", {
            'entity_id': entity_id,
            'media_content_id': media_content_id,
            'media_content_type': "custom"
        });
    }
}

function getOrdinal(num) {
    switch(num) {
        case 1:
            return "1st";
        case 2:
            return "2nd";
        case 3:
            return "3rd";
        case 4:
            return "4th";
        case 5:
            return "5th";
        case 6:
            return "6th";
        case 7:
            return "7th";
        case 8:
            return "8th";
        case 9:
            return "9th";
        case 10:
            return "10th";
        default:
            return num;
    }
}

customElements.define('card-alexa-alarms-timers', CardAlexaAlarmsTimers);
