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
            this.timers;
            this.reminders;
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
        if(!this.config.hasOwnProperty('entities_alarm') && !this.config.hasOwnProperty('entities_timer') && !this.config.hasOwnProperty('entities_reminder')) {
            // if there are no alarm, timer, or reminder entities to use, just leave
            return;
        }
        
        let displayStyle;
        if(this.config.hasOwnProperty('display_style') && this.config.display_style == "box") {
            displayStyle = "box";
        }
        else {
            // display style is table by default
            displayStyle = "table";
        }
        // Create Alarms Array
        this.alarms = [];
        if(this.config.hasOwnProperty('entities_alarm')) {
            const entities = this.config.entities_alarm;
            // loop through the entities in the entities_alarm property
            for (let i = 0; i < entities.length; i++) {
                if (this.hass.states[entities[i]] !== undefined) { // undefined is when it can't access the entity
                    const attributes = this.hass.states[entities[i]].attributes;
                    const entity_id = this.hass.states[entities[i]].attributes.friendly_name;
                    if (attributes.hasOwnProperty('sorted_active')) { // list of active alarms
                        const sorted_active = JSON.parse(attributes.sorted_active);
                        for (let j = 0; j < sorted_active.length; j++) { // loop through active alarms
                            const alarm = sorted_active[j][1];
                            if (Date.parse(alarm.date_time) >= Date.now()) { // the alarm is in the future
                                let showSeconds = true;
                                if(this.config.hasOwnProperty('show_alarm_name_seconds') && this.config.show_alarm_name_seconds == false) {
                                    showSeconds = false;
                                }
                                this.alarms.push(new AlexaAlarm(alarm.id, alarm.alarmLabel, entity_id, alarm.date_time, showSeconds)); // convert it to an AlexaAlarm and add it to the array
                            }
                        }
                    }
                }
            }
            this.alarms.sort((a, b) => a.alarmTime - b.alarmTime); // sort alarm array by time
        }
        // Create Reminders Array
        this.reminders = [];
        if(this.config.hasOwnProperty('entities_reminder')) {
            const entities_r = this.config.entities_reminder;
            // loop through the entities in the entities_reminder array
            for (let i = 0; i < entities_r.length; i++) {
                if (this.hass.states[entities_r[i]] !== undefined) { // undefined is when it can't access the entity
                    const attributes = this.hass.states[entities_r[i]].attributes;
                    const entity_id = this.hass.states[entities_r[i]].attributes.friendly_name;
                    if (attributes.hasOwnProperty('sorted_active')) { // list of active reminders
                        const sorted_active = JSON.parse(attributes.sorted_active);
                        for (let j = 0; j < sorted_active.length; j++) { // loop through active reminders
                            const reminder = sorted_active[j][1];
                            if(reminder.alarmTime >= Date.now()) { // the reminder is in the future
                                this.reminders.push(new AlexaReminder(reminder.id, reminder.reminderLabel, entity_id, reminder.alarmTime)); // convert it to an AlexaReminder and add it to the array
                            }
                        }
                    }
                }
            }
            this.reminders.sort((a, b) => a.alarmTime - b.alarmTime); // sort reminder array by time
        }
        // Created Timers Array
        this.timers = [];
        if(this.config.hasOwnProperty('entities_timer')) {
            const entities_t = this.config.entities_timer;
            // loop through the entities in the entities_timer array
            for (let i = 0; i < entities_t.length; i++) {
                if (this.hass.states[entities_t[i]] !== undefined) { // undefined is when it can't access the entity
                    const attributes = this.hass.states[entities_t[i]].attributes;
                    const entity_id = this.hass.states[entities_t[i]].attributes.friendly_name;
                    if (attributes.hasOwnProperty('sorted_active')) { // list of active timers
                        const sorted_active = JSON.parse(attributes.sorted_active);
                        for (let j = 0; j < sorted_active.length; j++) { // loop through active timers
                            const timer = sorted_active[j][1];
                            if (timer.triggerTime >= new Date().getTime()) { // the timer goes off in the future
                                this.timers.push(new AlexaTimer(timer.id, timer.timerLabel, entity_id, timer.triggerTime, timer.originalDurationInMillis)); // convert it to an AlexaTimer and add it to the array
                            }
                        }
                    }
                }
            }
            this.timers.sort((a, b) => a.remainingTime - b.remainingTime); // sort timer array by remaining time
        }
        if(this.alarms.length == 0 && this.timers.length == 0 && this.reminders.length == 0 && this.config.hasOwnProperty('hide_card_on_empty') && this.config.hide_card_on_empty == true) {
            // if there aren't any alarms, timers, or reminders, and we're supposed to hide on empty, hide it.
            if(this.innerHTML != '') {
                this.innerHTML = '';
            }
        }
        else {
            // otherwise there is at least one alarm, timer, or reminder, or else we don't hide on empty.
            // build the card for display.
            this.content = this.querySelector('ha-card');
            let outerBox;
            let table;
            if(this.content == null) { // if it was not displayed before (and didn't exist), create it.
                const haCard = document.createElement('ha-card');
                haCard.classList.add('alexa-alarms-timers');
                const cardContent = document.createElement('div');
                cardContent.classList.add('card-content');
                haCard.appendChild(cardContent);
                this.appendChild(haCard);
                if(displayStyle == "box") {
                    outerBox = document.createElement('div');
                    outerBox.id = "alexa-alarms-timers-outer-box";
                }
                else {
                    table = document.createElement('table');
                    table.setAttribute('border', '0');
                    table.setAttribute('width', '100%');
                }
                if(!this.config.hasOwnProperty('card_title') || this.config.card_title != "") {
                    let h1Text = 'Alexa Timers and Alarms';
                    if(this.config.hasOwnProperty('card_title')) {
                        h1Text = this.config.card_title;
                    }
                    haCard.setAttribute("header", h1Text);
                }
                if(displayStyle == "box") {
                    cardContent.append(outerBox);
                }
                else {
                    cardContent.append(table);
                }
            }
            if(displayStyle == "box") {
                outerBox = this.querySelector('#alexa-alarms-timers-outer-box');
            }
            else {
                table = this.querySelector('table');
            }
            this.content = this.querySelector('ha-card > div');

            // Loop through alarms
            for (let i = 0; i < this.alarms.length; i++) {
                let name = this.alarms[i].name; // alarm gets name built from time of sounding on construction
                let timeLeft = "";
                if (this.alarms[i].days > 0) {
                    timeLeft = this.alarms[i].days + "days, ";
                }
                timeLeft += this.alarms[i].hours + ":" + addLeadingZero(this.alarms[i].minutes) + ":" + addLeadingZero(this.alarms[i].seconds);
                if(this.config.hasOwnProperty('show_empty_hours') && this.config.show_empty_hours == false) {
                    // if we weren't supposed to show empty hours, replace timeLeft with empty hours removed
                    if(this.alarms[i].hours == 0 && this.alarms[i].days == 0) {
                        timeLeft = addLeadingZero(this.alarms[i].minutes) + ":" + addLeadingZero(this.alarms[i].seconds);
                    }
                }

                let nameTextContent = name;
                if(!this.config.hasOwnProperty('show_device_name') || this.config.show_device_name == true) {
                    nameTextContent = name + " Alarm on " + this.alarms[i].device;
                }

                let timeLeftTextContent = timeLeft;
                if(!this.config.hasOwnProperty('remaining_time_bold') || this.config.remaining_time_bold == true) {
                    timeLeftTextContent = "<strong>" + timeLeft + "</strong>";
                }

                if(displayStyle == "box") {
                    let currentAlarmBox = this.querySelector("#alexa-alarms-timers-id-" + this.alarms[i].id);
                    if(currentAlarmBox == null) {
                        // if it doesn't already exist, create it
                        const alarmBox = document.createElement("div");
                        alarmBox.id = "alexa-alarms-timers-id-" + this.alarms[i].id;
                        alarmBox.classList.add("alexa-alarms-timers-alarm-box");
                        let nameBox = document.createElement("div");
                        nameBox.classList.add('alexa-alarms-timers-name');
                        let nameText = document.createTextNode(name);
                        nameBox.appendChild(nameText);
                        alarmBox.appendChild(nameBox);
                        let timeLeftBox = document.createElement('div');
                        timeLeftBox.classList.add('alexa-alarms-timers-time');
                        let timeLeftText = document.createTextNode(timeLeftTextContent);
                        timeLeftBox.appendChild(timeLeftText);
                        alarmBox.appendChild(timeLeftBox);
                        if(this.config.hasOwnProperty("show_cancel_button") && this.config.show_cancel_button == true && this.config.hasOwnProperty("cancel_entity")) {
                            // build cancel button if desired
                            let xBox = document.createElement('div');
                            xBox.classList.add('alexa-alarms-timers-x');
                            let a = document.createElement('a');
                            let aContent = document.createElement('ha-icon');
                            aContent.setAttribute("icon", "mdi:close-circle-outline");
                            a.appendChild(aContent);
                            a.classList.add('timerCancelButton');
                            a.href = '#';
                            xBox.appendChild(a);
                            alarmBox.appendChild(xTd);
                            let id = this.alarms[i].id;
                            a.addEventListener('click', (e) => {
                                cancelTimerAlarmReminder(this, id, "alarm");
                                e.preventDefault();
                            });
                        }
    
                        // figure out how many rows are currently in the box so we can stick this new row in the right place
                        const currentAlarmBoxCount = outerBox.querySelectorAll(".alexa-alarms-timers-alarm-box").length;
                        if(i >= currentAlarmBoxCount) {
                            outerBox.appendChild(alarmBox);
                        }
                        else {
                            outerBox.insertBefore(alarmBox, outerBox.querySelectorAll(".alexa-alarms-timers-alarm-box")[i]);
                        }
                        currentAlarmBox = alarmBox;
                    }
                    const currentAlarmNameBox = currentAlarmBox.querySelector('.alexa-alarms-timers-name');
                    if(currentAlarmNameBox.innerHTML != nameTextContent) {
                        // if the name has changed, update that
                        currentAlarmNameBox.innerHTML = nameTextContent;
                        const currentAlarmCancelButton = currentAlarmBox.querySelector('a');
                        if(currentAlarmCancelButton != null) {
                            currentAlarmCancelButton.removeEventListener
                        }
                    }
    
                    const currentAlarmTimeLeftBox = currentAlarmBox.querySelector('.alexa-alarms-timers-time');
                    if(currentAlarmTimeLeftBox.innerHTML != timeLeftTextContent) {
                        // if the time left has changed, update that
                        currentAlarmTimeLeftBox.innerHTML = timeLeftTextContent;
                    }
                }
                else {
                    // if displayStyle == table (default)
                    let currentAlarmTr = this.querySelector("#alexa-alarms-timers-id-" + this.alarms[i].id);
                    if(currentAlarmTr == null) {
                        // if it doesn't already exist, create it
                        const tr = document.createElement('tr');
                        tr.id = "alexa-alarms-timers-id-" + this.alarms[i].id;
                        let nameTd = document.createElement('td');
                        nameTd.classList.add('alexa-alarms-timers-name');
                        let nameTdText = document.createTextNode(name);
                        nameTd.appendChild(nameTdText);
                        tr.appendChild(nameTd);
                        let timeLeftTd = document.createElement('td');
                        timeLeftTd.classList.add('alexa-alarms-timers-time');
                        let timeLeftTdText = document.createTextNode(timeLeftTextContent);
                        timeLeftTd.appendChild(timeLeftTdText);
                        tr.appendChild(timeLeftTd);
                        if(this.config.hasOwnProperty("show_cancel_button") && this.config.show_cancel_button == true && this.config.hasOwnProperty("cancel_entity")) {
                            // build cancel button if desired
                            let xTd = document.createElement('td');
                            xTd.classList.add('alexa-alarms-timers-x');
                            let a = document.createElement('a');
                            let aContent = document.createElement('ha-icon');
                            aContent.setAttribute("icon", "mdi:close-circle-outline");
                            a.appendChild(aContent);
                            a.classList.add('timerCancelButton');
                            a.href = '#';
                            xTd.appendChild(a);
                            tr.appendChild(xTd);
                            let id = this.alarms[i].id;
                            a.addEventListener('click', (e) => {
                              cancelTimerAlarmReminder(this, id, "alarm");
                              e.preventDefault();
                            });
                        }
    
                        // figure out how many rows are currently in the table so we can stick this new row in the right place
                        const currentTrCount = table.getElementsByTagName("tr").length;
                        if(i >= currentTrCount) {
                            table.appendChild(tr);
                        }
                        else {
                            table.insertBefore(tr, table.getElementsByTagName("tr")[i]);
                        }
                        currentAlarmTr = tr;
                    }
                    const currentAlarmNameTd = currentAlarmTr.querySelector('.alexa-alarms-timers-name');
                    if(currentAlarmNameTd.innerHTML != nameTextContent) {
                        // if the name has changed, update that
                        currentAlarmNameTd.innerHTML = nameTextContent;
                        const currentAlarmCancelButton = currentAlarmTr.querySelector('a');
                        if(currentAlarmCancelButton != null) {
                            currentAlarmCancelButton.removeEventListener
                        }
                    }
    
                    const currentAlarmTimeLeftTd = currentAlarmTr.querySelector('.alexa-alarms-timers-time');
                    if(currentAlarmTimeLeftTd.innerHTML != timeLeftTextContent) {
                        // if the time left has changed, update that
                        currentAlarmTimeLeftTd.innerHTML = timeLeftTextContent;
                    }
                }
            }
            // Loop through timers
            for (let i = 0; i < this.timers.length; i++) {
                let name = this.timers[i].label;
                if (name === null) {
                    // if it doesn't have a name, build one based on full duration
                    name = getNameFromDuration(this.timers[i].originalDurationInMillis);
                }
                let timeLeft = this.timers[i].hours + ":" + addLeadingZero(this.timers[i].minutes) + ":" + addLeadingZero(this.timers[i].seconds);
                if(this.config.hasOwnProperty('show_empty_hours') && this.config.show_empty_hours == false) {
                    if(this.timers[i].hours == 0) {
                        timeLeft = addLeadingZero(this.timers[i].minutes) + ":" + addLeadingZero(this.timers[i].seconds);
                    }
                }

                let nameTextContent = name;
                if(!this.config.hasOwnProperty('show_device_name') || this.config.show_device_name == true) {
                    nameTextContent = name + " on " + this.timers[i].device;
                }

                let timeLeftTextContent = timeLeft;
                if(!this.config.hasOwnProperty('remaining_time_bold') || this.config.remaining_time_bold == true) {
                    timeLeftTextContent = "<strong>" + timeLeft + "</strong>";
                }
                
                if(displayStyle == "box") {
                    let currentTimerBox = this.querySelector("#alexa-alarms-timers-id-" + this.timers[i].id);
                    if(currentTimerBox == null) {
                        // if it doesn't already exist, create it
                        const timerBox = document.createElement('div');
                        timerBox.id = "alexa-alarms-timers-id-" + this.timers[i].id;
                        timerBox.classList.add("alexa-alarms-timers-alarm-box");
                        let nameBox = document.createElement('div');
                        nameBox.classList.add('alexa-alarms-timers-name');
                        let nameText = document.createTextNode(nameTextContent);
                        nameBox.appendChild(nameText);
                        timerBox.appendChild(nameBox);
                        let timeLeftBox = document.createElement('div');
                        timeLeftBox.classList.add('alexa-alarms-timers-time');
                        let timeLeftText = document.createTextNode(timeLeftTextContent);
                        timeLeftBox.appendChild(timeLeftText);
                        timerBox.appendChild(timeLeftBox);
                        if(this.config.hasOwnProperty("show_cancel_button") && this.config.show_cancel_button == true && this.config.hasOwnProperty("cancel_entity")) {
                            // build cancel button if desired
                            let xBox = document.createElement('div');
                            xBox.classList.add('alexa-alarms-timers-x');
                            let a = document.createElement('a');
                            let aContent = document.createElement('ha-icon');
                            aContent.setAttribute("icon", "mdi:close-circle-outline");
                            a.appendChild(aContent);
                            a.classList.add('timerCancelButton');
                            a.href = '#';
                            xBox.appendChild(a);
                            timerBox.appendChild(xBox);
                            let id = this.timers[i].id;
                            a.addEventListener('click', (e) => {
                            cancelTimerAlarmReminder(this, id, "timer");
                            e.preventDefault();
                            });
                        }
    
                        // figure out how many rows are currently in the box so we can stick this new row in the right place
                        const currentTimerCount = outerBox.querySelectorAll(".alexa-alarms-timers-alarm-box").length;
                        if((i + this.alarms.length) >= currentTimerCount) {
                            outerBox.appendChild(timerBox);
                        }
                        else {
                            outerBox.insertBefore(timerBox, outerBox.querySelectorAll(".alexa-alarms-timers-alarm-box")[i + this.alarms.length]);
                        }
                        currentTimerBox = timerBox;
                    }
    
                    const currentTimerNameBox = currentTimerBox.querySelector('.alexa-alarms-timers-name');
                    if(currentTimerNameBox.innerHTML != nameTextContent) {
                        // if the name has changed, update that
                        currentTimerNameBox.innerHTML = nameTextContent;
                    }
    
                    const currentTimerTimeLeftBox = currentTimerBox.querySelector('.alexa-alarms-timers-time');
                    if(currentTimerTimeLeftBox.innerHTML != timeLeftTextContent) {
                        // if the time left has changed, update that
                        currentTimerTimeLeftBox.innerHTML = timeLeftTextContent;
                    }
                }
                else { // if displayStyle == table (default)
                    let currentTimerTr = this.querySelector("#alexa-alarms-timers-id-" + this.timers[i].id);
                    if(currentTimerTr == null) {
                        // if it doesn't already exist, create it
                        const tr = document.createElement('tr');
                        tr.id = "alexa-alarms-timers-id-" + this.timers[i].id;
                        let nameTd = document.createElement('td');
                        nameTd.classList.add('alexa-alarms-timers-name');
                        let nameTdText = document.createTextNode(nameTextContent);
                        nameTd.appendChild(nameTdText);
                        tr.appendChild(nameTd);
                        let timeLeftTd = document.createElement('td');
                        timeLeftTd.classList.add('alexa-alarms-timers-time');
                        let timeLeftTdText = document.createTextNode(timeLeftTextContent);
                        timeLeftTd.appendChild(timeLeftTdText);
                        tr.appendChild(timeLeftTd);
                        if(this.config.hasOwnProperty("show_cancel_button") && this.config.show_cancel_button == true && this.config.hasOwnProperty("cancel_entity")) {
                            // build cancel button if desired
                            let xTd = document.createElement('td');
                            xTd.classList.add('alexa-alarms-timers-x');
                            let a = document.createElement('a');
                            let aContent = document.createElement('ha-icon');
                            aContent.setAttribute("icon", "mdi:close-circle-outline");
                            a.appendChild(aContent);
                            a.classList.add('timerCancelButton');
                            a.href = '#';
                            xTd.appendChild(a);
                            tr.appendChild(xTd);
                            let id = this.timers[i].id;
                            a.addEventListener('click', (e) => {
                            cancelTimerAlarmReminder(this, id, "timer");
                            e.preventDefault();
                            });
                        }
    
                        // figure out how many rows are currently in the table so we can stick this new row in the right place
                        const currentTrCount = table.getElementsByTagName("tr").length;
                        if((i + this.alarms.length) >= currentTrCount) {
                            table.appendChild(tr);
                        }
                        else {
                            table.insertBefore(tr, table.getElementsByTagName("tr")[i + this.alarms.length]);
                        }
                        currentTimerTr = tr;
                    }
    
                    const currentTimerNameTd = currentTimerTr.querySelector('.alexa-alarms-timers-name');
                    if(currentTimerNameTd.innerHTML != nameTextContent) {
                        // if the name has changed, update that
                        currentTimerNameTd.innerHTML = nameTextContent;
                    }
    
                    const currentTimerTimeLeftTd = currentTimerTr.querySelector('.alexa-alarms-timers-time');
                    if(currentTimerTimeLeftTd.innerHTML != timeLeftTextContent) {
                        // if the name has changed, update that
                        currentTimerTimeLeftTd.innerHTML = timeLeftTextContent;
                    }
                }
            }
            // Loop through reminders
            for (let i = 0; i < this.reminders.length; i++) {
                let name = "Reminder: " + this.reminders[i].name; // reminders always have a name
                let timeLeft = "";
                if (this.reminders[i].days > 0) {
                    timeLeft = this.reminders[i].days + " days, ";
                }
                timeLeft += this.reminders[i].hours + ":" + addLeadingZero(this.reminders[i].minutes) + ":" + addLeadingZero(this.reminders[i].seconds);
                if(this.config.hasOwnProperty('show_empty_hours') && this.config.show_empty_hours == false) {
                    // if we weren't supposed to show empty hours, replace timeLeft with empty hours removed
                    if(this.reminders[i].hours == 0 && this.reminders[i].days == 0) {
                        timeLeft = addLeadingZero(this.reminders[i].minutes) + ":" + addLeadingZero(this.reminders[i].seconds);
                    }
                }

                let nameTextContent = name;
                if(!this.config.hasOwnProperty('show_device_name') || this.config.show_device_name == true) {
                    nameTextContent = name + " on " + this.reminders[i].device;
                }

                let timeLeftTextContent = timeLeft;
                if(!this.config.hasOwnProperty('remaining_time_bold') || this.config.remaining_time_bold == true) {
                    timeLeftTextContent = "<strong>" + timeLeft + "</strong>";
                }
                
                if(displayStyle == "box") {
                    let currentReminderBox = this.querySelector("#alexa-alarms-timers-id-" + this.reminders[i].id);
                    if(currentReminderBox == null) {
                        // if it doesn't already exist, create it
                        const reminderBox = document.createElement('div');
                        reminderBox.id = "alexa-alarms-timers-id-" + this.reminders[i].id;
                        reminderBox.classList.add("alexa-alarms-timers-reminders-box");
                        let nameBox = document.createElement('div');
                        nameBox.classList.add('alexa-alarms-timers-name');
                        let nameText = document.createTextNode(nameTextContent);
                        nameBox.appendChild(nameText);
                        reminderBox.appendChild(nameBox);
                        let timeLeftBox = document.createElement('div');
                        timeLeftBox.classList.add('alexa-alarms-timers-time');
                        let timeLeftText = document.createTextNode(timeLeftTextContent);
                        timeLeftBox.appendChild(timeLeftText);
                        reminderBox.appendChild(timeLeftBox);
                        if(this.config.hasOwnProperty("show_cancel_button") && this.config.show_cancel_button == true && this.config.hasOwnProperty("cancel_entity")) {
                            // build cancel button if desired
                            let xBox = document.createElement('div');
                            xBox.classList.add('alexa-alarms-timers-x');
                            let a = document.createElement('a');
                            let aContent = document.createElement('ha-icon');
                            aContent.setAttribute("icon", "mdi:close-circle-outline");
                            a.appendChild(aContent);
                            a.classList.add('timerCancelButton');
                            a.href = '#';
                            xBox.appendChild(a);
                            reminderBox.appendChild(xBox);
                            let id = this.reminders[i].id;
                            a.addEventListener('click', (e) => {
                                cancelTimerAlarmReminder(this, id, "reminder");
                                e.preventDefault();
                            });
                        }
    
                        // figure out how many rows are currently in the box so we can stick this new row in the right place
                        const currentReminderCount = outerBox.querySelectorAll(".alexa-alarms-timers-alarm-box").length;
                        if((i + this.alarms.length + this.timers.length) >= currentReminderCount) {
                            outerBox.appendChild(reminderBox);
                        }
                        else {
                            outerBox.insertBefore(reminderBox, outerBox.querySelectorAll(".alexa-alarms-timers-alarm-box")[i + this.alarms.length + this.timers.length]);
                        }
                        currentReminderBox = reminderBox;
                    }
    
                    const currentReminderNameBox = currentReminderBox.querySelector('.alexa-alarms-timers-name');
                    if(currentReminderNameBox.innerHTML != nameTextContent) {
                        // if the name has changed, update that
                        currentReminderNameBox.innerHTML = nameTextContent;
                    }
    
                    const currentReminderTimeLeftBox = currentReminderBox.querySelector('.alexa-alarms-timers-time');
                    if(currentReminderTimeLeftBox.innerHTML != timeLeftTextContent) {
                        // if the time left has changed, update that
                        currentReminderTimeLeftBox.innerHTML = timeLeftTextContent;
                    }
                }
                else { // if displayStyle == table (default)
                    let currentReminderTr = this.querySelector("#alexa-alarms-timers-id-" + this.reminders[i].id);
                    if(currentReminderTr == null) {
                        // if it doesn't already exist, create it
                        const tr = document.createElement('tr');
                        tr.id = "alexa-alarms-timers-id-" + this.reminders[i].id;
                        let nameTd = document.createElement('td');
                        nameTd.classList.add('alexa-alarms-timers-name');
                        let nameTdText = document.createTextNode(nameTextContent);
                        nameTd.appendChild(nameTdText);
                        tr.appendChild(nameTd);
                        let timeLeftTd = document.createElement('td');
                        timeLeftTd.classList.add('alexa-alarms-timers-time');
                        let timeLeftTdText = document.createTextNode(timeLeftTextContent);
                        timeLeftTd.appendChild(timeLeftTdText);
                        tr.appendChild(timeLeftTd);
                        if(this.config.hasOwnProperty("show_cancel_button") && this.config.show_cancel_button == true && this.config.hasOwnProperty("cancel_entity")) {
                            // build cancel button if desired
                            let xTd = document.createElement('td');
                            xTd.classList.add('alexa-alarms-timers-x');
                            let a = document.createElement('a');
                            let aContent = document.createElement('ha-icon');
                            aContent.setAttribute("icon", "mdi:close-circle-outline");
                            a.appendChild(aContent);
                            a.classList.add('timerCancelButton');
                            a.href = '#';
                            xTd.appendChild(a);
                            tr.appendChild(xTd);
                            let id = this.reminders[i].id;
                            a.addEventListener('click', (e) => {
                                cancelTimerAlarmReminder(this, id, "reminder");
                                e.preventDefault();
                            });
                        }
    
                        // figure out how many rows are currently in the table so we can stick this new row in the right place
                        const currentTrCount = table.getElementsByTagName("tr").length;
                        if((i + this.alarms.length + this.timers.length) >= currentTrCount) {
                            table.appendChild(tr);
                        }
                        else {
                            table.insertBefore(tr, table.getElementsByTagName("tr")[i + this.alarms.length + this.timers.length]);
                        }
                        currentReminderTr = tr;
                    }
    
                    const currentReminderNameTd = currentReminderTr.querySelector('.alexa-alarms-timers-name');
                    if(currentReminderNameTd.innerHTML != nameTextContent) {
                        // if the name has changed, update that
                        currentReminderNameTd.innerHTML = nameTextContent;
                    }
    
                    const currentReminderTimeLeftTd = currentReminderTr.querySelector('.alexa-alarms-timers-time');
                    if(currentReminderTimeLeftTd.innerHTML != timeLeftTextContent) {
                        // if the name has changed, update that
                        currentReminderTimeLeftTd.innerHTML = timeLeftTextContent;
                    }
                }
            }

            // Remove old alarms and timers
            if(displayStyle == "box") {
                for(let i = outerBox.querySelectorAll(".alexa-alarms-timers-alarm-box").length - 1; i >= 0; i--) {
                    const element = outerBox.querySelectorAll(".alexa-alarms-timers-alarm-box")[i];
                    if(!this.alarms.some((alarm) => "alexa-alarms-timers-id-" + alarm.id == element.id) && !this.timers.some((timer) => "alexa-alarms-timers-id-" + timer.id == element.id) && !this.reminders.some((reminder) => "alexa-alarms-timers-id-" + reminder.id == element.id)) {
                        // this timer/alarm/reminder is no longer active
                        element.remove();
                    }
                }
            }
            else {
                for(let i = table.getElementsByTagName("tr").length - 1; i >= 0; i--) {
                    const tr = table.getElementsByTagName("tr")[i];
                    if(!this.alarms.some((alarm) => "alexa-alarms-timers-id-" + alarm.id == tr.id) && !this.timers.some((timer) => "alexa-alarms-timers-id-" + timer.id == tr.id) && !this.reminders.some((reminder) => "alexa-alarms-timers-id-" + reminder.id == tr.id)) {
                        // this timer or alarm is no longer active
                        tr.remove();
                    }
                }
            }
        }
    }
}

class AlexaAlarm {
    constructor(id, label, device, date_time, showSeconds) {
        this.id = id;
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
    constructor(id, label, device, triggerTime, originalDurationInMillis) {
        this.id = id;
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

class AlexaReminder {
    constructor(id, label, device, alarmTime) {
        console.log("creating AlexaReminder");
        this.id = id;
        this.name = label;
        this.device = device.substring(0, device.indexOf("next"));
        this.alarmTime = alarmTime;
        this.remainingTime = this.alarmTime - Date.now();
        this.seconds = Math.floor(this.remainingTime / 1000);
        this.minutes = Math.floor(this.seconds / 60);
        this.hours = Math.floor(this.minutes / 60);
        this.days = Math.floor(this.hours / 24);
        this.seconds = this.seconds % 60;
        this.minutes = this.minutes % 60;
        this.hours = this.hours % 24;
        console.log("this.name = " + this.name);
        console.log("this.remainingTime = " + this.remainingTime);
        console.log("this.alarmTime = " + this.alarmTime);
        console.log("Date.now() = " + Date.now());
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

function cancelTimerAlarmReminder(card, id, isTimerOrAlarmOrReminder) {
    const entity_id = card.config.cancel_entity;
    let timerName = "";
    if(isTimerOrAlarmOrReminder == "timer" && card.timers.find((timer) => timer.id == id).label === null) {
        const currentTimer = card.timers.find((timer) => timer.id == id);
        const filteredTimers = card.timers.filter((timer) => currentTimer.originalDurationInMillis == timer.originalDurationInMillis);
        timerName = getNameFromDuration(currentTimer.originalDurationInMillis);
        if(filteredTimers.length > 1) {
            let ordinalName = "the " + getOrdinal(filteredTimers.indexOf(currentTimer) + 1) + " one";
            let media_content_id = "cancel " + timerName.toLowerCase();
            card.hass.callService("media_player", "play_media", {
                'entity_id': entity_id,
                'media_content_id': media_content_id,
                'media_content_type': "custom"
            });
            setTimeout(() => {
                card.hass.callService("media_player", "play_media", {
                    'entity_id': entity_id,
                    'media_content_id': ordinalName,
                    'media_content_type': "custom"
                });
            }, 2000);
        }
        else {
            let media_content_id = "cancel " + timerName.toLowerCase();
            card.hass.callService("media_player", "play_media", {
                'entity_id': entity_id,
                'media_content_id': media_content_id,
                'media_content_type': "custom"
            });
        }
    }
    else if(isTimerOrAlarmOrReminder == "timer") { // it's a timer with a name
        timerName = card.timers.find((timer) => timer.id == id).label + " timer";
        let media_content_id = "cancel " + timerName.toLowerCase();
        card.hass.callService("media_player", "play_media", {
            'entity_id': entity_id,
            'media_content_id': media_content_id,
            'media_content_type': "custom"
        });
    }
    else if(isTimerOrAlarmOrReminder == "reminder") {
        let reminderName = "reminder to " + card.reminders.find((reminder) => reminder.id == id).label;
        let media_content_id = "cancel " + reminderName.toLowerCase()();
        card.hass.callService("media_player", "play_media", {
            'entity_id': entity_id,
            'media_content_id': media_content_id,
            'media_content_type': "custom"
        });
    }
    else { // it's an alarm
        let alarmName = getNameFromTime(card.alarms.find((alarm) => alarm.id == id).alarmTime);
        let media_content_id = "cancel the alarm for " + alarmName;
        card.hass.callService("media_player", "play_media", {
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
