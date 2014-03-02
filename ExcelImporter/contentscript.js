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
	var $picker = $('#project-picker');
	$picker.append('<br>');
	$picker.append(projectPicker.eq(0).clone());
	$picker.append('<br>');
	$picker.append(projectPicker.eq(1).clone());
	oldForm.hide();
	var hideTie = JSON.parse(localStorage.getItem('tie-hide'));

	$('#hide-tti').on('click', function(){
		hideTie = !hideTie;
		localStorage.setItem('tie-hide', JSON.stringify(hideTie));
		$('#tti').toggle();
		oldForm.toggle();
	});

	if (hideTie === true) {
		$('#tti').hide();
		oldForm.show();
	} else {
		hideTie = false;
	}
}

var postData = function (ev) {
	ev.preventDefault();
	var days = $('#excel-import-table tbody tr'), posts = [], currentDay, t, c, d,fullYear;
	if (days.length > 0)
	{
		if ($('#sheet-month').val() == '0' ||
			$('#project').val() == '' || $('#activity').val == ''
			)
		{
			alert('You have to select 3 items: Month, project and activity');
			return false;
		}
		for (var i = 0; i < days.length; i++)
		{
			currentDay = $(days[i]);
			if ($(currentDay.get(0).childNodes[1]).text() != ''
				&& $(currentDay.get(0).childNodes[2]).text() != ''
			)
			{
				t = new TimeCard(), c = currentDay.find('td');
				t.start = c.eq(1).text();
				t.finish = c.eq(2).text();
				d = (parseInt(c.eq(0).text()) < 10) ? '0' + c.eq(0).text() : c.eq(0).text();
				t.date = $('#sheet-year').val() + '-' + $('#sheet-month').val() + '-' + d;
				t.note = c.length > 3 ? c.eq(3).text() : '';
				t.project = $('#project').val();
				t.task = $('#task').val();
				posts.push(t);
			}
		}
		
		if (posts.length) {
			postToTikal.posts = posts;
			postToTikal.hasPosts = true;
			postToTikal();
		}
	}
}

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
	for (var i = 0; i < numberofColumns; i++)
	{
		tableHeaders[tableHeaders.length] = '<th><h4>' + headers[i] + '</h4></th>';
	};
	tableHeaders[tableHeaders.length] = '</tr></thead>';
	d = '<table id="excel-import-table" class="table zebra">' + tableHeaders.join('') + d + '</table>';
	$('#generated-table').html(d);
}

var TimeCard = function() {
	return {
		project: '',
		task: '',
		start: '',
		finish: '',
		note: '',
		date:'',
		date_now: $('#calendar_now_time').text(),
		btn_submit:'Submit'
	}
}

var postToTikal = function ()
{	
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

jQuery(function(){
	chrome.extension.sendRequest({'action': 'get-html'}, handleRequest);
})