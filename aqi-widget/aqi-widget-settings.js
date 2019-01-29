// ********************************************************************** //
// Review the README for more information on configuration settings.
// This widget is designed to be used as a Wordpress plugin or as a
// standalone widget. For the Wordpress plugin, the settings are derived from
// the plugin's settings within the admin area.

// If this is being used as a Wordpress plugin, there's nothing to change here.
// Otherwise, local settings need to be defined below.

// It's important that each value is surround by double quotes
// ********************************************************************** //

let aqiLocalSettings = {
    key: "", // your AirNow API Key
    zip: "43215", // the reporting zip code
    show_forecast: "1", // 0 for no - 1 for yes
    show_legend: "1", // 0 for no - 1 for yes
    theme: "light", // light or dark
    // **********************************************************************//
    // *********** DO NOT CHANGE ANYTHING BELOW THIS SECTION ****************//
    // *************** UNLESS YOU KNOW WHAT YOU'RE DOING ********************//
    // **********************************************************************//
    distance: "100", // the surrounding distance from the zip code
    cors_proxy: "https://cors.io/?", //CORS proxy URL
    // Compact widget image paths
    aqi_compact_1: "aqi-widget/img/aqi_compact_1.png",
    aqi_compact_2: "aqi-widget/img/aqi_compact_2.png",
    aqi_compact_3: "aqi-widget/img/aqi_compact_3.png",
    aqi_compact_4: "aqi-widget/img/aqi_compact_4.png",
    aqi_compact_5: "aqi-widget/img/aqi_compact_5.png",
    // Full page widget image paths
    aqi_page_1: "aqi-widget/img/aqi_page_1.png",
    aqi_page_2: "aqi-widget/img/aqi_page_2.png",
    aqi_page_3: "aqi-widget/img/aqi_page_3.png",
    aqi_page_4: "aqi-widget/img/aqi_page_4.png",
    aqi_page_5: "aqi-widget/img/aqi_page_5.png"
};

// Display text for Action Day alerts
let actionDayAlert = `<div class="aqi-alert">An Air Quality Alert has been issued.
Children, older adults and people with asthma and other respiratory diseases should
avoid long periods of activity outdoors. Others can help reduce air
pollution by driving less, refueling only after sun down,
and not using gas-powered lawn equipment.</div><hr>`;

// **********************************************************************//
// To obtain an AirNow API Key, create an account here:
// https://docs.airnowapi.org/account/request/
// None of this works without the API key!
// **********************************************************************//