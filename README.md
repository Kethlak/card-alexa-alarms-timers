# card-alexa-alarms-timers
Card for Alexa Timers and Alarms

Originally created by @Kethlak.
Thanks to @jdeath who converted this to a HACS repository and added some changes. History of the project can be found in this thread: https://community.home-assistant.io/t/show-all-active-alexa-timers

# Installation
These instructions were written with Home Assistant 2023.10.5 and HassOS 11.0, and assume you have HACS and the Alexa Media Player integration installed.
Go to HACS > Frontend. Click the three dots in the upper right corner of the screen. Select "Custom Repositories". Under "Repository" enter `jdeath/card-alexa-alarms-timers`. For the Category, select "Lovelace".
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
  # the following are optional parameters:
  remaining_time_bold: true
  show_cancel_button: false
  cancel_entity: media_player.livingroom
  hide_card_on_empty: false
  card_title: "Alexa Timers and Alarms"
  show_device_name: true
  show_empty_hours: true
  show_alarm_name_seconds: true
```

Add as many _next_timer and _next_alarms as you want in the entities_alarm and entities_timer categories.

# Optional Parameters
- `remaining_time_bold` defaults to true, and toggles whether the remaining time column is displayed in bold.
- `show_cancel_button` and `cancel_entity` are included for the use case of wanting to be able to cancel timers and alarms with an "X" icon. `show_cancel_button` is false by default. `cancel_entity` refers to the device which the cancel command is sent to. For more details, see "Canceling Timers/Alarms" below.
- `hide_card_on_empty` defaults to false, and is included for my original use case of not wanting to display an empty timer box on my wall display.
- `card_title` defaults to "Alexa Timers and Alarms". If set to an empty string, no title will be displayed.
- `show_device_name` defaults to true, and toggles whether to display the name of the device the timer or alarm is set on. For example, if you have a timer named "Cake" set on a device named "Kitchen Echo", if this is true it will display the name as "Cake on Kitchen Echo", and if false it will just display the name as "Cake".
- `show_empty_hours` defaults to true, and toggles whether, if the time remaining is less than one hour, it should display a '0' in the hours position of the time or nothing. For a timer with 40 minutes remaining, this shows "0:40:00" if true and "40:00" if false.
- `show_alarm_name_seconds` defaults to true, and toggles whether to show the remaining seconds in the name of an alarm. For an unnamed alarm set for 3:00 PM, if true this will display the first part of the name as "3:00:00 PM Alarm" and if false this will display the first part of the name as "3:00 PM Alarm".

# Styling
This can be styled using card-mod. The card can be accessed at ha-card.alexa-alarms-timers. An example configuration is below. The `transition: none !important` line prevents the text from pulsing in size.
```
card_mod:
  style: |
    ha-card.alexa-alarms-timers * {
      font-size: 34px;
      line-height: 46px;
      transition: none !important;
      --mdc-icon-size: 47px;
      --card-mod-icon-color: var(--accent-color);
    }
```

# Canceling Timers/Alarms
I had a bit of difficulty getting Alexa to cancel timers with no name that have the same duration. Currently what happens is if you try to cancel an unnamed timer that has the same duration as another one, it first tells the cancel entity to cancel the timer based on its length, as in “cancel 1 hour timer” and then waits 2 seconds and tells it “the nth one” based on remaining duration. So if you have 3 1 hour timers and click on the ‘X’ after the second one in the list, it first sends the command “cancel 1 hour timer” and waits 2 seconds and sends the command “the 2nd one”. I find that this works, although you still hear the device starting to say “You have two one hour timers…” but it gets cut off partway through and says it cancelled the timer. If I try to send it faster the device can’t handle it, and I haven’t been able to figure out how to phrase it as a single command without the initial context for the device. So it works, but it sounds funny. Also, if you have more than 10 unnamed timers with the same duration, it probably won't work for the 11th and greater timers, but that seems like a highly unusual use case.
