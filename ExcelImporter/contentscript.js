/*****************************************


		Excel Importer Main Code


  ****************************************/

var addEvents = function () {
	$('#generate-table').on('click', transform);
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

	var $ext = $('#tti');
	var toggle = function(show) {
		if (show) {
			$ext.show();
			oldForm.hide();
		} else {
			$ext.hide();
			oldForm.show();
		}
		storageToggleShow = show;
		localStorage.setItem(TIE_TOGGLE_KEY, storageToggleShow.toString());
	};
	$('#hide-tti').on('click', function(){
		toggle(!storageToggleShow);
	});
	// hide the extension if it was toggled
	toggle(storageToggleShow);
};

var postData = function (ev) {
	ev.preventDefault();
	var days = $('#excel-import-table tbody tr'), posts = [], currentDay, t, c, d,fullYear;
	if (days.length > 0) {
		if (isValidProjectSetup()) {
			alert('You have to select 3 items: Month, Project and Activity');
			return false;
		}
		for (var i = 0; i < days.length; i++) {
			currentDay = $(days[i]);
			if (isValidDay(currentDay)){
				posts.push(TimeCardFactory(currentDay));
			}
		}
		
		if (posts.length) {
			postToTikal.posts = posts;
			postToTikal.hasPosts = true;
			postToTikal();
		}
	}
};

var isValidProjectSetup = function() {
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
	ev.preventDefault();
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

var TimeCardFactory = function(currentDayEl) {
	var t = {};
	var formatDate = function(date, format){
		var formated = format
			.replace('y', date.year)
			.replace('m', date.month)
			.replace('d', date.day)
		return formated;
	}
	var c = currentDayEl.find('td');
	t.start = c.eq(1).text();
	t.finish = c.eq(2).text();
	var d = (parseInt(c.eq(0).text()) < 10) ? '0' + c.eq(0).text() : c.eq(0).text();
	// format now: 2014-06-29 - yyyy-mm-dd
	var date = {
		month: $('#sheet-month').val(),
		day: d,
		year: $('#sheet-year').val()
	}
	t.date = formatDate(date, 'y-m-d');
	t.note = c.length > 3 ? c.eq(3).text() : '';
	t.project = $('#project').val();
	t.task = $('#task').val();
	t.date_now = $('#calendar_now_time').text();
	t.btn_submit = 'Submit';
	
	return t;
}

var postToTikal = function (){	
	var p = postToTikal.posts;
	if (p.length > 0) {
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
	} else {
		parseErrors();
	}
}
postToTikal.parseErrors = function() {
	if (!postToTikal.hasPosts) return;
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

jQuery(function(){
	chrome.extension.sendRequest({'action': 'get-html'}, handleRequest);
})
