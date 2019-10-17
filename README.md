## About
Based on a zip code for a reporting area, the Air Quality Widget displays the current air quality.
The forecast is available if configured to be displayed. This widget is provided
by the Mid-Ohio Regional Planning Commission (MORPC) & the U.S. EPA AirNow program.

MORPC is an association of cities, villages, townships, counties and regional
organizations serving Central Ohio. We take pride in bringing communities of
all sizes and interests together to collaborate on best practices and plan for
the future of our growing region. We do this through a variety of programs, services,
projects and initiatives – all with the goal of improving the lives of our residents
and making Central Ohio stand out on the world stage.

The U.S. EPA AirNow program protects public health by providing forecast and
real-time observed air quality information across the United States,
Canada, and Mexico. AirNow receives real-time air quality observations from over
2,000 monitoring stations and collects forecasts for more than 300 cities.

## Prerequisites
Go to https://docs.airnowapi.org/account/request/ and fill out the form to create
an AirNow account. Once submitted, you will receive your API key at the email address
used to sign up. Follow the instructions in the email to activate your account.
Your API key will be used in step #3 below.

## Installation & Configuration
1. Place the aqi-widget folder and all its contents within a location of your
choosing on your web server.
2. Open aqi-widget-settings.js in a text editor. Configuration for the widget is done here.
Be very careful when editing this file.
3. Copy the API key and place it in between the double-quotes after 'key:'
4. The air quality agency responsible for a reporting area assigns one or more
zip codes to be associated with that area. Enter a five digit zip code for your area in
between the double-quotes after 'zip:'.
5. Make note of the values for 'show_forecast:', 'show_legend:', and 'theme:'.
Keep them the same or update them based on your preference.
6. Don't forget to save!

Afterwards, your settings will look something like this:

```
key: "A95AXXXX-XXXX-XXXX-XXXX-730256B9XXXX", // your AirNow API Key
zip: "43215", // the reporting zip code
show_forecast: "1", // 0 for no - 1 for yes
show_legend: "1", // 0 for no - 1 for yes
theme: "light", // light or dark
```
Ignore every other value in that file unless you know what you're doing.

## Using the Widget
Within the HTML file of the page where you want the widget to be displayed,
ensure that the following is included between the HEAD tag or right
before the closing BODY tag:

```
<link rel="stylesheet" href="aqi-widget/aqi-widget-public.css" type="text/css">

<script src="aqi-widget/aqi-widget-settings.js" type="text/javascript"></script>
<script src="aqi-widget/aqi-widget-public.js" type="text/javascript"></script>
<script src="aqi-widget/tippy.all.min.js" type="text/javascript"></script>
```

Make certain that the value for 'src' matches the path of the location of the
aqi-widget folder.

#### HTML Tags to Produce the Output

Place the following HTML where you want the **compact widget** to appear:

```
<div id="aqi-widget-container-compact"></div>
```

Place the following HTML where you want the **full-page widget** to appear:

```
<div id="aqi-widget-container-page"></div>
```

See example.html for an example of using the widget. Important note: You must
have an API key to use the example and it must be configured using the steps above.

## You Should Know
* Due to browser security, in order to receive air quality data, a <a href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing">CORS</a>
proxy service must be used. By default, https://cors-gohio.herokuapp.com/ is configured but there are others available.
It's OK to leave this set at the default value. In the future, if there are issues with getting
data because the service is down, another proxy service can be configured.

* AirNow limits 500 api calls per key, per hour. To help mitigate this limitation,
the first time a user accesses a page where the widget is present, the data is stored
locally on the user's machine and is reused each time the page is accessed until an hour has passed.
After an hour, the data is refreshed.

* Limited support will be provided through Git Hub. Because every environment is different
and you don't want to give access to your system to complete strangers, MORPC is unable to provide installation support.

* Your feedback is appreciated. Please let us know if you have any suggestions for improvements.

## FAQ
To be determined as they're discovered!

