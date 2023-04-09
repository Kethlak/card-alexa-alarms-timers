# card-alexa-alarms-timers
Card for Alexa Timers and Alarms

Code copied from @Kethlak from Home Assistant Forum. Thanks to her for making an alarm version. Details can be found in this thread: https://community.home-assistant.io/t/show-all-active-alexa-timers

This version:
1. Adds HACS repository as a Lovelace repository
1. Combines both Alarms and Timers in a single card
1. Has some locale changes and bolds the time remaining (because I like it that way)

# Setup

Add this repo to your hacs repository as a lovelace

Card setup:
```
type: custom:card-alexa-alarms-timers
title: Test
entities_alarm:
  - sensor.livingroom_next_alarm
  - sensor.kitchen_next_alarm
entities_timer:
  - sensor.livingroom_next_timer
  - sensor.kitchen_next_timer
```

Add as many _next_timer and _next_alarms in th respective catagories
