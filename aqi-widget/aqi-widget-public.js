/*jshint esversion: 6 */
(function($) {

    "use strict";

    //At least one widget container on the page is required
    //compact widget container - <div id='aqi-widget-container-compact'>
    //full page widget container - <div id='aqi-widget-container-page'>

    $(document).ready(function() {
        if (typeof aqi_remote_settings !== "undefined") {
            aqiLocalSettings = JSON.parse(JSON.stringify(aqi_remote_settings));
        }

        if (configurationIsValid()) {
            getAQI();
        } else {
            setConfigurationError();
        }
    });

    function getAQI() {
        //Grabs the AQI data from local storage or refreshes it from AirNow
        //AirNow limits 500 calls per key, per hour
        if (localStorage.getItem("aqi_last_retrieved") === null || localStorage.getItem("aqi_last_retrieved") === "") {
            //Nothing is in Local Storage so query for fresh data
            refreshAQI();
        } else {
            //Otherwise we have our data stored locally. If it hasn't been
            //an hour since the last time AQI was retrieved,
            //see if we can grab the information from local storage
            const ONE_HOUR = 60 * 60 * 1000;

            if (((new Date()) - localStorage.getItem("aqi_last_retrieved")) < ONE_HOUR) {
                parseResults(JSON.parse(localStorage.getItem("aqi_last_results")));
            } else {
                //An hour has passed since the last request
                //from this client so query for fresh data
                refreshAQI();
            }
        }
    }

    function refreshAQI() {
        //The CORS proxy URL is important. Without this,
        //we run into an access-control-allow-origin issue.
        //If the current proxy is down, it can be changed within the
        //settings. AirNow has no plans to enable CORS for their API:
        //https://forum.airnowtech.org/t/cross-origin-resource-sharing/306

        showProgress();

        let url = aqiLocalSettings.cors_proxy;
        url += "http://www.airnowapi.org/aq/forecast/zipCode/?format=application/json&";
        url += "zipCode=" + aqiLocalSettings.zip + "&";
        url += "distance=" + aqiLocalSettings.distance + "&";
        url += "API_KEY=" + aqiLocalSettings.key;

        $.ajax({
                url: url,
                type: "get",
                dataType: "json"
            })
            .done(function(results) {
                localStorage.setItem("aqi_last_retrieved", $.now());
                localStorage.setItem("aqi_last_results", JSON.stringify(results, undefined, 2));

                parseResults(results);
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log("error: " + textStatus);
                console.log("incoming text: " + jqXHR.responseText);
                console.log(errorThrown);

                localStorage.removeItem("aqi_last_retrieved");
                localStorage.removeItem("aqi_last_results");

                setUnavailable();
            })
            .always(function() {
                hideProgress();
            });
    }

    function parseResults(results) {
        if (typeof results === "undefined" || results.length === 0) {
            setUnavailable();

            localStorage.removeItem("aqi_last_retrieved");
            localStorage.removeItem("aqi_last_results");

            return;
        }

        //compact widget container - <div id='aqi-widget-container-compact'>
        //full page widget container - <div id='aqi-widget-container-page'>
        if ($("#aqi-widget-container-compact").length) {
            parseCompactWidgetResults(results);
        }

        if ($("#aqi-widget-container-page").length) {
            parsePageWidgetResults(results);
        }
    }

    function parseCompactWidgetResults(results) {
        // Index 0 will be the current day. The payload will contain the forecast
        // for today + x number of additional days. The compact version is only
        // concerned with the current day.
        let theme = aqiLocalSettings.theme;

        let categoryNumberToday = results[0].Category.Number;
        let categoryNameToday = results[0].Category.Name;

        let img = getAQIImage(categoryNumberToday, "compact");
        let aqi = "<br /><span class='aqi_theme_" + theme + "'>";
        aqi += "Current Air Quality: " + categoryNameToday + "</span>";

        let aqiWidget = "<div id='aqi_compact'>" + img + aqi + "</div>";

        //Appends the widget into the parent container
        $("#aqi-widget-container-compact").append(aqiWidget);

        // Configures the tooltip to display the
        // forecast if it's available on the compact widget
        // Thank you: https://atomiks.github.io/tippyjs/
        //    See /public/js/tippy-license.txt
        let forecast = "";

        if (typeof results[0].Discussion !== "undefined") {
            forecast = results[0].Discussion;
        }

        if (aqiLocalSettings.show_forecast === "1" && forecast.length > 0) {
            $("#aqi_compact").append(
                "<span id='aqi_compact_view_more' class='aqi_theme_" + theme + "'> &#9432;</span>"
            );

            let compactForecast = maybeParseActionDayAlert(results);
            compactForecast += forecast.replace(/\r\n/g, "<br>").replace(/[\r\n]/g, "<br>");

            tippy("#aqi_compact_view_more", {
                a11y: true,
                size: "small",
                placement: "left-start",
                animation: "scale",
                animateFill: false,
                theme: "light",
                trigger: "click",
                content: compactForecast
            });
        }
    }

    function parsePageWidgetResults(results) {
        let theme = aqiLocalSettings.theme;
        let categoryNumberToday = results[0].Category.Number;
        let categoryNameToday = results[0].Category.Name;

        let aqi = "<br><span class='aqi_theme_" + theme + "'>";
        aqi += "The current Air Quality for " + aqiLocalSettings.zip;
        aqi += " and surrounding areas is <b>" + categoryNameToday;
        aqi += "</b></span><br>";

        let img = getAQIImage(categoryNumberToday, "page");
        let aqiWidget = "<div class='page-wrapper centered'>";
        let actionDay = maybeParseActionDayAlert(results);

        aqiWidget += actionDay + img + aqi + "<br>";

        aqiWidget += maybeShowForecast(theme, results);
        aqiWidget += maybeShowLegend(theme);

        aqiWidget += "</div>";

        // Appends the widget into the parent container
        $("#aqi-widget-container-page").append(aqiWidget);
    }

    function maybeShowForecast(theme, results) {
        let forecast = "";

        // Index 0 will be the current day. The payload will contain the forecast
        // for 5 days. So, if we want to display the forecast, iterate through
        // the results to get the appropriate values for each day.
        if (aqiLocalSettings.show_forecast === "1") {
            forecast = "<div class='centered aqi_theme_" + theme + "'><b>Forecast</b></div><br />";

            // The discussion node is the same regardless of the index
            // so just display it once above the forecast table. Try our best
            // to format by replacing carriage returns, etc. with html line breaks
            let discussion = "";
            if (typeof results[0].Discussion !== "undefined") {
                discussion = results[0].Discussion.replace(/(?:\r\n|\r|\n)/g, "<br>");
            }

            if (discussion.length > 0) {
                forecast += "<div class='left_aligned aqi_theme_" + theme + "'>" + discussion + "</div><br />";
            }

            // The remaining nodes will have the forecast information
            // Iterate through them and display the date, aqi, and category
            let forecastTable = "<div class='aqi-div-table'>";
            forecastTable += "<div class='aqi-div-table-heading'>";
            forecastTable += "<div class='aqi-div-table-row'>";
            forecastTable += "<div class='aqi-div-table-head aqi_theme_" + theme + "'>Date</div>";
            forecastTable += "<div class='aqi-div-table-head aqi_theme_" + theme + "'>AQI</div>";
            forecastTable += "<div class='aqi-div-table-head aqi_theme_" + theme + "'>Category</div>";
            forecastTable += "</div>"; // end table row
            forecastTable += "</div>"; // end table heading

            forecastTable += "<div class='aqi-div-table-body'>"; // start table body

            results.forEach(function(result) {
                forecastTable += "<div class='aqi-div-table-row'>";
                forecastTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + "'>" + result.DateForecast + "</div>";
                forecastTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + "'>" + getAQIDisplayVal(result) + "</div>";
                forecastTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + "'>" + result.Category.Name + "</div>";
                forecastTable += "</div>";
            });

            forecastTable += "</div>"; // end table body
            forecastTable += "</div><br />"; // end table

            forecast += forecastTable;
        }

        return forecast;
    }

    function maybeShowLegend(theme) {
        let legendTable = "";

        if (aqiLocalSettings.show_legend === "1") {
            legendTable = "<div class='centered aqi_theme_" + theme + "'><b>Legend</b></div><br />";

            legendTable += "<div class='aqi-div-table'>";
            legendTable += "<div class='aqi-div-table-heading'>";
            legendTable += "<div class='aqi-div-table-row'>";
            legendTable += "<div class='aqi-div-table-head aqi_theme_" + theme + " legend'>Category</div>";
            legendTable += "<div class='aqi-div-table-head aqi_theme_" + theme + " legend'>AQI Numerical Value</div>";
            legendTable += "<div class='aqi-div-table-head aqi_theme_" + theme + " legend'>Meaning</div>";
            legendTable += "</div>"; // end table row
            legendTable += "</div>"; // end table heading
            legendTable += "<div class='aqi-div-table-body'>"; // start table body

            legendTable += "<div class='aqi-div-table-row'>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>Good</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>0 - 50</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>";
            legendTable += "Air quality is considered satisfactory, and air pollution poses little or no risk.";
            legendTable += "</div>";
            legendTable += "</div>";

            legendTable += "<div class='aqi-div-table-row'>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>Moderate</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>51 to 100</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>";
            legendTable += "Air quality is acceptable; however, for some pollutants there may be a moderate health ";
            legendTable += "concern for a very small number of people who are unusually sensitive to air pollution.";
            legendTable += "</div>";
            legendTable += "</div>";

            legendTable += "<div class='aqi-div-table-row'>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>Unhealthy for Sensitive Groups</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>101 to 150</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>";
            legendTable += "Members of sensitive groups may experience health effects. The general public is not likely to be affected.";
            legendTable += "</div>";
            legendTable += "</div>";

            legendTable += "<div class='aqi-div-table-row'>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>Unhealthy</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>151 to 200</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>";
            legendTable += "Everyone may begin to experience health effects&#59; ";
            legendTable += "members of sensitive groups may experience more serious health effects.";
            legendTable += "</div>";
            legendTable += "</div>";

            legendTable += "<div class='aqi-div-table-row'>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>Very Unhealthy</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>201 to 300</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>";
            legendTable += "Health alert: everyone may experience more serious health effects.</div>";
            legendTable += "</div>";

            legendTable += "<div class='aqi-div-table-row'>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>Hazardous</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>301 to 500</div>";
            legendTable += "<div class='aqi-div-table-cell aqi_theme_" + theme + " legend'>";
            legendTable += "Health warnings of emergency conditions. The entire population is more likely to be affected.";
            legendTable += "</div>";
            legendTable += "</div>";

            legendTable += "</div>"; // end table body
            legendTable += "</div>"; // end table
        }

        return legendTable;
    }

    function getAQIDisplayVal(payload) {
        // The reported AQI index is not consistent. There's a chance that it
        // is specified as -1, which is suspected to mean that the reporting
        // agency did not provide the information. If the AQI index is missing or is
        // -1, then display Not Provided.
        let aqiDisplayVal = "";

        if (typeof payload.AQI !== "undefined") {
            if (payload.AQI === -1 || payload.AQI === "") {
                aqiDisplayVal = "Not Provided";
            } else {
                aqiDisplayVal = payload.AQI;
            }
        } else {
            aqiDisplayVal = "Not Provided";
        }

        return aqiDisplayVal;
    }

    function getAQIImage(categoryNumberToday, imgType = "compact") {
        let imgTag = "";
        let imgPath = "";

        // depending on the type of widget in the current context,
        // grab the image path specified on the settings
        switch (categoryNumberToday) {
            case 1:
                if (imgType === "page") {
                    imgPath = aqiLocalSettings.aqi_page_1;
                } else {
                    imgPath = aqiLocalSettings.aqi_compact_1;
                }
                break;
            case 2:
                if (imgType === "page") {
                    imgPath = aqiLocalSettings.aqi_page_2;
                } else {
                    imgPath = aqiLocalSettings.aqi_compact_2;
                }
                break;
            case 3:
                if (imgType === "page") {
                    imgPath = aqiLocalSettings.aqi_page_3;
                } else {
                    imgPath = aqiLocalSettings.aqi_compact_3;
                }
                break;

            case 4:
                if (imgType === "page") {
                    imgPath = aqiLocalSettings.aqi_page_4;
                } else {
                    imgPath = aqiLocalSettings.aqi_compact_4;
                }
                break;

            case 5:
                if (imgType === "page") {
                    imgPath = aqiLocalSettings.aqi_page_5;
                } else {
                    imgPath = aqiLocalSettings.aqi_compact_5;
                }
                break;
            case 6: //same as 5 - hopefully we never get to level 6!
                if (imgType === "page") {
                    imgPath = aqiLocalSettings.aqi_page_5;
                } else {
                    imgPath = aqiLocalSettings.aqi_compact_5;
                }
                break;
            default:
        }

        if (imgPath.length > 0) {
            imgTag = "<img src='" + imgPath + "' alt='AQI Widget'>";
        }

        return imgTag;
    }

    function showProgress() {
        // Simple css spinner
        // Thanks to https://stephanwagner.me/only-css-loading-spinner
        if ($("#aqi-widget-container-compact").length) {
            $("#aqi-widget-container-compact").addClass("spinner");
        }

        if ($("#aqi-widget-container-page").length) {
            $("#aqi-widget-container-page").addClass("spinner");
        }
    }

    function hideProgress() {
        if ($("#aqi-widget-container-compact").length) {
            $("#aqi-widget-container-compact").removeClass("spinner");
        }

        if ($("#aqi-widget-container-page").length) {
            $("#aqi-widget-container-page").removeClass("spinner");
        }
    }

    function setUnavailable() {
        // For some reason, the AQI is not available - network - error returned
        if ($("#aqi-widget-container-compact").length) {
            $("#aqi-widget-container-compact").append("<div class='aqi-unavailable'>AQI Currently Unavailable</div>");
        }

        if ($("#aqi-widget-container-page").length) {
            $("#aqi-widget-container-page").append("<div class='aqi-unavailable'>AQI Currently Unavailable</div>");
        }
    }

    function maybeParseActionDayAlert(results) {
        // Text is defined in aqi-widget-settings.js
        if (typeof results[0].ActionDay !== "undefined") {
            if (results[0].ActionDay === true) {
                return actionDayAlert;
            } else {
                return "";
            }
        } else {
            return "";
        }
    }

    function setConfigurationError() {
        // The configuration has issues and must be reviewed
        if ($("#aqi-widget-container-compact").length) {
            $("#aqi-widget-container-compact").append("<div class='aqi-unavailable'>Configuration Error</div>");
        }

        if ($("#aqi-widget-container-page").length) {
            $("#aqi-widget-container-page").append("<div class='aqi-unavailable'>Configuration Error</div>");
        }
    }

    function configurationIsValid() {
        // Without the API key, none of this will work properly
        if (aqiLocalSettings.key === null || aqiLocalSettings.key === "") {
            return false;
        }

        // The reporting zip code is required
        if (null === aqiLocalSettings.zip || aqiLocalSettings.zip === "") {
            return false;
        }

        // At least one of the widget containers is required
        if ($("#aqi-widget-container-compact").length) {
            return true;
        }

        if ($("#aqi-widget-container-page").length) {
            return true;
        }

        // Major issue in configuration if we get here!
        return false;
    }

})(jQuery);
