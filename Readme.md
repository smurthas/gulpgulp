# Fitbit Water Logger Button!

This is a compilation of components for making a button that logs water
consumption to the Fitbit API.

It has an Arduino sketch that works on an ESP 8266 (just put in your own wifi
creds) and a server that acts as a proxy to the Fitbit API, since I haven't yet
dared to implement OAuth 1.0 on a microprocessor.

### Some Todos-ish:

* Ideally, don't use a proxy at all
* Maybe a mobile app for entering wifi creds on first boot/reset (including
 broadcasting an AP during that phase).
* Commit a circuit diagram
* Maybe a photo for fun?
* Feedback on success or failure -- vibration, LED, push notification, etc
* Feedback on how much water has been consumed
* Feedback on battery SOC

