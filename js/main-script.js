$(document).ready(function(){
    // Init select2 component in the element where user choose a country from dropdown
    $("#countries").select2();

    $(".btn-home").click(function() {
        $(".website-content").load("home.html");
        $("a[class^=btn]").removeClass("active");
        $(this).addClass("active");
    });
    // Trigger click, so content will be cleared and home page will be rendered by default
    $(".btn-home").trigger("click");

    let getAllCountries = function getAllCountries() {
    $.ajax({
        url: "https://calendarific.com/api/v2/countries",
        method: "GET",
        data: {
            "api_key": "371766abb263c5d6d019c12273a3745420702e3b",
        },
        success: function(respond){
            let countries = respond.response.countries;
            let dataTable = "<table id='countries-table' class='stripe hover row-border'><thead> <tr> "+
            " <th> Country </th> <th>ISO code</th> <th> Total holidays </th> "+ 
            " <th> Languages </th> </tr> </thead> </table>";

           $(".website-content").html(dataTable);
           // Init datatable
            $("#countries-table").DataTable({
                data: countries,
                columns: [
                    {data: "country_name"},
                    {data: "iso-3166"},
                    {data: "total_holidays"},
                    {data: "supported_languages"}
                ]
            });
            $("select[name='countries-table_length']").addClass("select-css");
        },
        error: function(respond) {
            $(".website-content").html("<span>Something went wrong.</span>");
        }
    });
}
    // 'All countries' button from the navigation click event
    $(".btn-all-countries").click(function(){
        $(".website-content").html("<div class='lead'>Loading...</div>");
        getAllCountries();
        $("a[class^=btn]").removeClass("active");
        $(this).addClass("active");
    });
    // 'Check-holiday' button from the navigation click event
    $(".btn-check-holiday").click(function() {
        $("a[class^=btn]").removeClass("active");
        $(this).addClass("active");
        $(".website-content").load("check.html");
    });

    // When user wants his country to be detected
    $(document).on("click","#btn-detect-country", function() {;
        $.ajax({
            url: "http://ip-api.com/json",
            method: "GET",
            success: function(respond) {
                if (isCountryDetectionFailed(respond))
                    displayCountryDetectionFailedModal();
                else
                    showCountryHolidays(respond.countryCode, respond.country);
            },
            error: function(jqXHR) {
                displayCountryDetectionFailedModal();
            }
        });
    });

    // When user wants to enter a country
    $(document).on("click","#btn-type-country", function() {
        $(".country-modal-title").html("Enter country");
        $("#country-modal").modal("show");
    });

    // When user has chosen a country and click 'Search' button
    $("#btn-search-country").click(function() {
        $(".country-modal-title").html("Loading...");
        let countryShortISO = $("#countries").val();
        let countryName = $("#countries option:selected").text();
        let chosenYear = $(".year").val();

        // Check if we need to set the default year
        if (isNaN(chosenYear) || chosenYear == null || chosenYear == "" || chosenYear == undefined)
            chosenYear = 2020;
        showCountryHolidays(countryShortISO, countryName, chosenYear);
    });

    // When user clicks on a country row from  'All countries' tab
    $(document).on("click","tr", function() {
        let countryName = $(this).children().eq(0).html().trim();
        // get second child (iso code)
        let countryISO = $(this).children().eq(1).html().trim();

        // Workaround: Since we append this click event on all tr elements, we specify conditions that
        // match only those tr's in the main table. All other tables 
        // (modals,etc.) are excluded, because of the if clause.
        if (countryName != null && countryName != undefined && countryISO != null && 
            countryISO != undefined && isNaN(countryName) && isNaN(countryISO) && countryName != "Month" 
            && countryISO != "Month")
            showCountryHolidays(countryISO, countryName);
    });

    // returns true if passed parameter is empty
    let isCountryDetectionFailed = function isCountryDetectionFailed(respond) {
        return (respond == null || respond == undefined || respond.length <= 0);
    }

    let displayCountryDetectionFailedModal = function displayCountryDetectionFailedModal() {
        $("#detection-failed-modal").modal("show");
    }

    // Process the data and append new row for each record
    let appendNewRowToTable = function appendNewRowToTable(data, index) {
        let info = data[index].description == null ? "" : data[index].description;
        let cols = "<tr><td>"+data[index].date.datetime.day+"</td>";
        cols+= "<td>"+data[index].date.datetime.month+"</td>";
        cols+= "<td>"+data[index].name +"</td>";
        cols+= "<td>"+info+"</td>";
        cols+= "<td>"+data[index].type[0]+"</td></tr>";
        $("#country-holidays").append(cols);
    }

    // Sends a request to the API to make a check based on the passed parameters
    // If everything is OK it process the result by initializing DataTable and populating it with the data.
    // If not it returns an error message to the user.
    let showCountryHolidays = function showCountryHolidays(countryShortISO, countryName, chosenYear = 2020) {
        $.ajax({
            url: "https://calendarific.com/api/v2/holidays",
            method: "GET",
            data: {
                "api_key": "371766abb263c5d6d019c12273a3745420702e3b",
                country: countryShortISO,
                year: chosenYear
            },
            success: function(data) {
                $("#country-label").html(countryName);
                $("#year-label").html(chosenYear);

                if (data.response.length == 0)
                {
                    alert("Sorry, no data for that year.");
                    return;
                }

                // Clear & destroy from past values
                $("#country-holidays").DataTable().clear().destroy();

                for(let i = 0; i<data.response.holidays.length; i++)
                    appendNewRowToTable(data.response.holidays, i);

                // Bug: On some browsers after the first render of the table, 
                // all records are being shown , so we manually trigger 'change' event, to show only 
                // the current minimum (10)
                $("select[name='country-holidays_length']").trigger("change");

                // Init datatable and style the select
                $("#country-holidays").DataTable();
                $("select[name='country-holidays_length']").addClass("select-css");

                $("#country-modal").modal("hide");     
                $("#holiday-modal").modal("show");     
            },
            error: function() {
                alert("Sorry. Something went wrong.")
            }
        });
    }

    // Clear table body when leaving the modal
    $("#holiday-modal").on("hide.bs.modal", function() {
        $("#country-holidays > tbody").html("");
    });
});