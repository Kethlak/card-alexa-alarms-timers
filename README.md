# card-alexa-alarms-timers
Card for Alexa Timers and Alarms

Originally created by @Kethlak.
Thanks to @jdeath who converted this to a HACS repository and added some changes. History of the project can be found in this thread: https://community.home-assistant.io/t/show-all-active-alexa-timers

# Installation
These instructions were written with Home Assistant 2023.10.5 and HassOS 11.0, and assume you have HACS and the Alexa Media Player integration installed.
Go to HACS > Frontend. Click the three dots in the upper right corner of the screen. Select "Custom Repositories". Under "Repository" enter `Kethlak/card-alexa-alarms-timers`. For the Category, select "Lovelace".
You may see "Alexa Timer and Alarm Card" show up as a new repository. If so, click this. If not, click the button in the lower left of the screen labeled "Explore & Download Repositories" and search for "Alexa Timer and Alarm Card", and click on the result.
Click the "Download" button in the lower left of the screen.

# Not using Lovelace in Storage Mode
If, when you are downloading the repository to HACS, you get a message about "you are not using Lovelace in storage mode you need to manually add the resource with these settings", you should go to your configuration.yaml file and add the following code under "frontend":
```
frontend:
  extra_module_url:
    - /hacsfiles/card-alexa-alarms-timers/card-alexa-alarms-timers.js
```

# Card Setup and Configuration
Within the .yaml file for your dashboard, the card looks like this:

```
- type: custom:card-alexa-alarms-timers
  entities_alarm:
    - sensor.livingroom_next_alarm
    - sensor.kitchen_next_alarm
  entities_timer:
    - sensor.livingroom_next_timer
    - sensor.kitchen_next_timer
  entities_reminder:
    - sensor.livingroom_next_reminder
    - sensor.kitchen_next_reminder
  # the following are optional parameters:
  remaining_time_bold: true
  show_cancel_button: false
  cancel_entity: media_player.livingroom
  hide_card_on_empty: false
  card_title: "Alexa Timers and Alarms"
  show_device_name: true
  show_empty_hours: true
  show_alarm_name_seconds: true
  display_style: "table"
```

Add as many _next_alarm, _next_timer, and _next_reminder entries as you want in the entities_alarm, entities_timer, and entities_reminder categories.

# Optional Parameters
- `remaining_time_bold` defaults to true, and toggles whether the remaining time column is displayed in bold.
- `show_cancel_button` and `cancel_entity` are included for the use case of wanting to be able to cancel timers, alarms, and reminders with an "X" icon. `show_cancel_button` is false by default. `cancel_entity` refers to the device which the cancel command is sent to. For more details, see "Canceling Timers/Alarms/Reminders" below.
- `hide_card_on_empty` defaults to false, and is included for my original use case of not wanting to display an empty timer box on my wall display.
- `card_title` defaults to "Alexa Timers and Alarms". If set to an empty string, no title will be displayed.
- `show_device_name` defaults to true, and toggles whether to display the name of the device the timer or alarm is set on. For example, if you have a timer named "Cake" set on a device named "Kitchen Echo", if this is true it will display the name as "Cake on Kitchen Echo", and if false it will just display the name as "Cake".
- `show_empty_hours` defaults to true, and toggles whether, if the time remaining is less than one hour, it should display a '0' in the hours position of the time or nothing. For a timer with 40 minutes remaining, this shows "0:40:00" if true and "40:00" if false.
- `show_alarm_name_seconds` defaults to true, and toggles whether to show the remaining seconds in the name of an alarm. For an unnamed alarm set for 3:00 PM, if true this will display the first part of the name as "3:00:00 PM Alarm" and if false this will display the first part of the name as "3:00 PM Alarm".
- `display_style` defaults to "table", which is the original layout. The other option is "box".

# Styling
This can be styled using card-mod. The card can be accessed at ha-card.alexa-alarms-timers. An example configuration is below. The `transition: none !important` line prevents the text from pulsing in size.
```
card-mod-card: |
  ha-card.alexa-timers *, ha-card.alexa-alarms *, ha-card.alexa-alarms-timers * {
    font-size: 60px;
    line-height: 80px;
    transition: none !important;
    border: 0 none;
  }
```
Additionally, most elements within the timers have classes. In the original table layout, most things can be referred to by tag name, where each timer or alarm is a `tr` element, and the `td` containing the name has the class `alexa-alarms-timers-name`, the one containing the remaining time has the class `alexa-alarms-timers-time`, and the one containing the cancel button, if there is one, has the class `alexa-alarms-timers-x`. In the box layout, the whole group of items is in a `div` with the id `alexa-alarms-timers-outer-box`, each timer/alarm is a `div` with the class `alexa-alarms-timers-alarm-box`, the name is a `div` with the class `alexa-alarms-timers-name`, the remaining time is in a `div` with the class `alexa-alarms-timers-time`, and the cancel button, if there is one, is in a `div` with the class `alexa-alarms-timers-x`.

# Styling Box Layout
An example card-mod style for the new box layout that places timers and alarms side by side is below.
```
  card-mod-card: |
    ha-card.alexa-timers *, ha-card.alexa-alarms *, ha-card.alexa-alarms-timers * {
      font-size: 60px;
      line-height: 80px;
      transition: none !important;
      border: 0 none;
    }
    #alexa-alarms-timers-outer-box {
        display: flex;
        gap: 10px;
    }
```

# Canceling Timers/Alarms/Reminders
This... works okay with named timers. It works sometimes with unnamed timers. I found that if I had a 2 hour unnamed timer, it refused to cancel it and claimed I had no timer named "2 hour" even though the code isn't claiming it's named anything. This whole part is clunky and I don't recommend it, but someone asked me to do it and I hope it works for them.
I haven't tested it with reminders. I can't remember if I tested it with alarms.
