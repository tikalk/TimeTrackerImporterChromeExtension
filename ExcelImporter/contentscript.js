/*****************************************


		Excel Importer Main Code


  ****************************************/

var addEvents = function () {
	// $('#generate-table').on('click', transform);
	$('#post-data').on('click', postData);
	//- reorder the calendar and project picker
	var oldForm = jQuery('form[name=timeRecordForm] td[valign=top]');
	// var oldFormRow = $('form[name=mytimeForm]').find('table table > tbody > tr').eq(0),
	var projectPicker = oldForm.find('select');
	var TIE_TOGGLE_KEY = 'tie-toggle-show';
	var storageToggleShow = localStorage.getItem(TIE_TOGGLE_KEY);
	if (storageToggleShow === null) {
		localStorage.setItem(TIE_TOGGLE_KEY, 'true');
		storageToggleShow = true;
	} else {
		storageToggleShow = eval(storageToggleShow);
	}
	var $picker = $('#project-picker');
	$picker.append('<br>');
	$picker.append(projectPicker.eq(0).clone());
	$picker.append('<br>');
	$picker.append(projectPicker.eq(1).clone());
	oldForm.hide();

	var toggleExtension = function() {
		$('#tti').toggle();
		oldForm.toggle();
		storageToggleShow = !storageToggleShow;
		localStorage.setItem(TIE_TOGGLE_KEY, storageToggleShow.toString());
	};
	$('#hide-tti').on('click', toggleExtension);
	// hide the extension if it was toggled
	if (storageToggleShow === false) {
		toggleExtension();
	}
	// var hideTie = JSON.parse(localStorage.getItem('tie-hide'));

	// $('#hide-tti').on('click', function(){
	// 	hideTie = !hideTie;
	// 	localStorage.setItem('tie-hide', JSON.stringify(hideTie));
	// 	$('#tti').toggle();
	// 	oldForm.toggle();
	// });

	// if (hideTie === true) {
	// 	$('#tti').hide();
	// 	oldForm.show();
	// } else {
	// 	hideTie = false;
	// }
	// Adding Angular App
	angular.module('ttiApp', ['ngGrid'])
		.controller('GridCtrl', GridCtrl)
		.controller('GeneratorCtrl', GeneratorCtrl)
		.factory('timeSheet', TimeSheet)
		.factory('csvToJson', function(){
			return function(str, delimiter){
				return CSVToArray(str, delimiter);
			}
		});
	angular.bootstrap(document.getElementById('tti'), ['ttiApp']);
}

var postData = function (ev) {
	ev.preventDefault();
	var days = $('#excel-import-table tbody tr'), posts = [], currentDay, t, c, d,fullYear;
	if (days.length > 0) {
		if (areAllParamsValid()) {
			alert('You have to select 3 items: Month, project and activity');
			return false;
		}

		for (var i = 0; i < days.length; i++) {
			currentDay = $(days[i]);
			if (isValidDay(currentDay)) {
				posts.push(TimeCardFactory(currentDay));
			}
		}
		
		if (posts.length) {
			postToTikal.posts = posts;
			postToTikal.hasPosts = true;
			postToTikal();
		}
	}
}
var areAllParamsValid = function() {
	var month = $('#sheet-month').val() == '0';
	var project = $('#project').val() == '';
	var activity = $('#activity').val == '';
	return month || project || activity;
};

var isValidDay = function(currentDay) {
	var isDayFull = $(currentDay.get(0).childNodes[1]).text() != '';
	var isDateFull = $(currentDay.get(0).childNodes[2]).text() != '';
	return isDateFull && isDayFull;
};
var transform = function (ev) {	
	ev && ev.preventDefault();
	var t = $.trim($('#excel-data').val());
	if (t == '')
		return;
	var a = t.replace(/\t/g, '</td><td>');
	var b = a.replace(/\r/g, '</td></tr>');
	var c = b.replace(/\n/g, '</td></tr><tr><td>');
	var d = '<tr><td>' + c + '</td></tr>';
	var rows = $(d), headers = ['day', 'start', 'end', 'note'];
	var numberofColumns = headers.length;
	var tableHeaders = ['<thead><tr>'];
	for (var i = 0; i < numberofColumns; i++) {
		tableHeaders[tableHeaders.length] = '<th><h4>' + headers[i] + '</h4></th>';
	};
	tableHeaders[tableHeaders.length] = '</tr></thead>';
	d = '<table id="excel-import-table" class="table zebra">' + tableHeaders.join('') + d + '</table>';
	$('#generated-table').html(d);
}

var TimeCardFactory = function(day) {
	var t = {};
	var legend = {
		DAY: 0,
		IN: 1,
		OUT: 2,
		NOTE: 3
	}
	var formatDate = function(date, format){
		var formated = format
			.replace('y', date.year)
			.replace('m', date.month)
			.replace('d', date.day)
		return formated;
	}
	// var c = currentDayEl.find('td');
	t.start = day[legend.IN];
	t.finish = day[legend.OUT];
	var d = (parseInt(day[legend.DAY]) < 10) ? '0' + day[legend.DAY] : day[legend.DAY];
	// format now: 2014-06-29 - yyyy-mm-dd
	var date = {
		month: $('#sheet-month').val(),
		day: d,
		year: $('#sheet-year').val()
	}
	t.date = formatDate(date, 'y-m-d');
	t.note = day[legend.NOTE] || '';
	t.project = $('#project').val();
	t.task = $('#task').val();
	t.date_now = $('#calendar_now_time').text();
	t.btn_submit = 'Submit';
	
	return t;
}

var postToTikal = function () {	
	var p = postToTikal.posts;
	if (p.length > 0)
	{
		$('#ajax-progress').html('submiting day ' + p[0].date + ' ...');
		$.ajax({
			type: 'POST',
			url: 'https://planet.tikalk.com/timetracker/time.php',
			data: p[0],
			success: function(data) {
				var errors = $(data).find('td.error_style ul li');
				$('#ajax-progress').html('Finish submiting day ' + p[0].date + ' ...');
				if (errors.length)
					postToTikal.errors.push({'date': p[0], 'errors': errors});
				postToTikal.posts.shift();
				postToTikal();
			},
			error: function() {
				alert('there was an error in submitting the data.\nplease check your input.')
			}
		});
	}
	else
	{
		if (postToTikal.hasPosts)
		{
			var h = [], successMsg = 'all dates have been submitted successfuly to tikal.<br />Please check the report for the selected month.<br />',
				errorMsg = 'Some dates might have been submitted successfuly to tikal.<br />Please check the report for the selected month.<br />',
				errors = postToTikal.errors;
			if (errors.length) {
				h.push(errorMsg);
				h.push('<div style="color: red">These dates had errors and have not been saved to the database:<br />');
				for (var d = 0; d < errors.length; d++) {
					h.push('<br/>date ' + errors[d].date.date + ' had these errors: ');
					for (var i = 0; i < errors[d].errors.length; i++) {
						h.push($(errors[d].errors[i]).text() + ', ');
					}
				}
				h.push('</div>');
			}
			else {
				h.push(successMsg);
			}
				
			$('#ajax-progress').html(h.join(''));
		}
	}
}
postToTikal.hasPosts = false;
postToTikal.errors = [];


function handleRequest(response) {
		// console.log("from content-scritp", response);
		jQuery('form[name=timeRecordForm]').before(response);
}

chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
        console.log('onrequest called', arguments);
});




// Angular app Code
function GeneratorCtrl ($scope, timeSheet, csvToJson) {
	
	$scope.generate = function () {
		var days = csvToJson($.trim($('#excel-data').val()), '\t');
		timeSheet.clean();
		var currentDay, t, c, d,fullYear;
		if (days.length > 0) {
			for (var i = 0; i < days.length; i++) {
				timeSheet.add(TimeCardFactory(days[i]));
			}
		}
	}
}
function GridCtrl($scope, timeSheet) {
	$scope.timeSheet = timeSheet.all();
	$scope.myData = [];
    $scope.gridOptions = { 
        data: 'myData',
        enableCellSelection: true,
        enableRowSelection: false,
        enableCellEditOnFocus: true,
        columnDefs: [
        	{field: 'date', displayName: 'Date', enableCellEdit: true}, 
            {field:'start', displayName:'In', enableCellEdit: true},
            {field:'finish', displayName:'Out', enableCellEdit: true},
            {field:'note', displayName:'Note', enableCellEdit: true}
        ]
    };
    $scope.$watchCollection('timeSheet', function(newVal, oldVal){
    	// $scope.myData = newVal;
    	console.log("new data", newVal);
    	$scope.myData = newVal;
    	setTimeout(function(){
    		$scope.$digest();
    		console.log('digested...');
    	}, 2000);
    }, true)
}

function TimeSheet(){
	var posts = [];
	var api = {};
	api.all = function(){
		return posts;
	}
	api.clean = function () {
		posts.length = 0;
	}
	api.add = function(tc){
		posts.push(tc);
	}
	return api;
}

function CSVToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
}

jQuery(function(){
	chrome.extension.sendRequest({'action': 'get-html'}, handleRequest);
})