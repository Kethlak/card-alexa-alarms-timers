class CardAlexaAlarmsTimers extends HTMLElement {
  // Whenever the state changes, a new `hass` object is set. Use this to
  // update your content.
  set hass(hass) {
    // Initialize the content if it's not there yet.
    this.hassStored = hass;

    if(!this.initialized) {
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
    for(let i = 0; i < entities.length; i++) {
        if(this.hass.states[entities[i]] !== undefined) {
            const attributes = this.hass.states[entities[i]].attributes;
			const entity_id = this.hass.states[entities[i]].attributes.friendly_name;
            if(attributes.hasOwnProperty('sorted_active')) {
                const sorted_active = JSON.parse(attributes.sorted_active);
                for(let j = 0; j < sorted_active.length; j++) {
                    const alarm = sorted_active[j][1];
                    if(Date.parse(alarm.date_time) >= Date.now()) {
                        this.alarms.push(new AlexaAlarm(alarm.alarmLabel, entity_id, alarm.date_time));
                    }
                }
            }
        }
    }
    this.alarms.sort((a,b) => a.alarmTime - b.alarmTime);

	// Timers
	const entities_t = this.config.entities_timer;
	this.timers = [];
    for(let i = 0; i < entities_t.length; i++) {
        if(this.hass.states[entities_t[i]] !== undefined) {
            const attributes = this.hass.states[entities_t[i]].attributes;
			const entity_id = this.hass.states[entities_t[i]].attributes.friendly_name;
            if(attributes.hasOwnProperty('sorted_active')) {
                const sorted_active = JSON.parse(attributes.sorted_active);
                for(let j = 0; j < sorted_active.length; j++) {
                    const timer = sorted_active[j][1];
                    if (timer.triggerTime >= new Date().getTime()) {
                        this.timers.push(new AlexaTimer(timer.timerLabel,entity_id, timer.triggerTime, timer.originalDurationInMillis));
                    }
                }
            }
        }
    }
    this.timers.sort((a,b) => a.remainingTime - b.remainingTime);
	
  if (this.alarms.length === 0 && this.timers.length === 0) {
        this.innerHTML = '';
        this.content = null;
    }
    
    if(this.alarms.length > 0 || this.timers.length > 0) {
      this.innerHTML = `
        <ha-card class="alexa-alarms-timers">
          <div class="card-content"></div>
        </ha-card>
      `;
      this.content = this.querySelector('div');
      
      let table = "<table border='0' width='100%'>";
      // Alarms
	  for(let i = 0; i < this.alarms.length; i++) {
          let name = this.alarms[i].name;
          if(name === null) {
              name = getNameFromDuration(this.alarms[i].originalDurationInMillis);
          }
          let timeLeft = "";
          if(this.alarms[i].days > 0) {
            timeLeft = this.alarms[i].days + "days, ";
          }
          timeLeft += this.alarms[i].hours + ":" + addLeadingZero(this.alarms[i].minutes) + ":" + addLeadingZero(this.alarms[i].seconds);
          table += "<tr>";
		  table += "<td>" + name + " Alarm on " + this.alarms[i].device + "</td>";
          table += "<td><b>" + timeLeft + "</b></td>";
          table += "</tr>";
      }
	  // Timers
	  for(let i = 0; i < this.timers.length; i++) {
          let name = this.timers[i].label;
          if(name === null) {
              name = getNameFromDuration(this.timers[i].originalDurationInMillis);
		  }
          let timeLeft = this.timers[i].hours + ":" + addLeadingZero(this.timers[i].minutes) + ":" + addLeadingZero(this.timers[i].seconds);
          table += "<tr>";
		  table += "<td>" + name + " on " + this.timers[i].device + "</td>";
          table += "<td><b>" + timeLeft + "</b></td>";
          table += "</tr>";
      }
	  
      table += "</table>";
      this.content.innerHTML = table;
    }
  }
}

class AlexaAlarm {
    constructor(label, device,date_time) {
        this.name = label;
        if(this.name == null) {
            this.name = getNameFromTime(date_time);
        }
		this.device = device.substring( 0, device.indexOf( "next" ) );
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
		this.device = device.substring( 0, device.indexOf( "next" ) );
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
    if(num < 10) {
        return "0" + num;
    }
    else {
        return num.toString();
    }
}

function getNameFromTime(alarmTime) {
    let alarmDateTime = new Date(alarmTime);
    let today = new Date(Date.now());
    let isAlarmToday = false;
    if(alarmDateTime.getFullYear() == today.getFullYear() && alarmDateTime.getDate() == today.getDate() && alarmDateTime.getMonth() == today.getMonth()) {
        isAlarmToday = true;
    }
    let name = "";
    if(isAlarmToday) {
        name = "";
    }
    else {
        name = getMonthNameFromNumber(alarmDateTime.getMonth()) + " " + alarmDateTime.getDate() + " at ";
    }
    name += alarmDateTime.toLocaleTimeString()
	//name += addLeadingZero(alarmDateTime.getHours()) + ":" + addLeadingZero(alarmDateTime.getMinutes());
    return name;
}

function getMonthNameFromNumber(monthNum) {
    switch(monthNum) {
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
    if(hours > 0) {
        name += hours + " Hour";
        if(minutes > 0 || seconds > 0) {
            name += ", ";
        }
        else {
            name += " ";
        }
    }
    if(minutes > 0) {
        name += minutes + " Minute";
        if(seconds > 0) {
            name += ", ";
        }
        else {
            name += " ";
        }
    }
    if(seconds > 0) {
        name += seconds + " Second ";
    }
    name += " Timer";
    return name;
}































customElements.define('card-alexa-alarms-timers', CardAlexaAlarmsTimers);
