var s = document.createElement('script');
s.onload = function()
{
	createTextHolder();
}
s.setAttribute('src', 'https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js');

var start = function(){
	document.body.appendChild(s);
}

var createTextHolder = function ()
{
	var t = [];
	t.push('<style>ol.import-steps li {font-size: 1.3em} li h2 {font-size: 1em;} form[name=mytimeForm]{position: absolute;left: 567px;top: 126px;}#activity{margin-left: 64px;}form[name=mytimeForm] + table { {position: fixed;bottom: 0; right: 0;width: 42%; background: white; box-shadow: 0 0 15px 2px lightgray;}</style>');
	t.push('<div style="padding: 10px 20px;">');
	t.push('<ol class="import-steps">');
		t.push('<li>Select Year and Month of your timesheet');
			t.push('<div id="cal-picker">');
			t.push('<span>Year:</span><select style="padding: 4px;" name="sheet-year" id="sheet-year"> <optgroup label="Pick A Year"><option value="2012" selected>2012</option> <option value="2013">2013</option> <option value="2014">2014</option> <option value="2015">2015</option><option value="2016">2016</option> </optgroup> </select>');
			t.push('</div>');
			t.push('<div><span>Month:</span>');
			t.push('<select style="padding: 4px;" name="sheet-month" id="sheet-month"><option value="0">Pick A month</option> <option value="01">January</option> <option value="02">February</option> <option value="03">March</option> <option value="04">April</option> <option value="05">May</option> <option value="06">June</option> <option value="07">July</option> <option value="08">August</option> <option value="09">September</option> <option value="10">October</option> <option value="11">November</option> <option value="12">December</option> </select>');
			t.push('</div>');
		t.push('</li>');
		t.push('<li>Copy & Paste your excel sheet data to this box');
			t.push('<h2 style="color: red">NEW: a 4th column - "note" will be parsed now</h2>')
			t.push('<textarea id="excel-data" cols="100" rows="10"></textarea>');
		t.push('</li>');
		t.push('<li>Click ');
			t.push('<button id="generate-table">Generate Table</button>');
			t.push('<h2>Only the first 4 columns will be parsed:</h2><h4>day number, start time, end time</h4>');
			t.push('<p>* time format: 18:40 (hh:mm)<br />* day number format: 8 or 27 (d)</p>');
			t.push('<h2>Your time sheet which will be posted to tikal is:</h2><div id="generated-table">no data yet...please paste your sheet on the textarea above</div>');
		t.push('</li>');
		t.push('<li id="project-picker">Pick a Project and an Activity from below (by the calendar) - these will be applied to all dates</li>');
		t.push('<li>After you generated the data and checked it - Click the "Submit Data to Tikal" button<br />');
			t.push('<button id="post-data">Submit Data to Tikal</button>');
		t.push('</li>');
		t.push('<div id="ajax-progress" style="color: blue; font-weight: bold"></div>');
		t.push('<script type="text/javascript">addEvents()</script>');
		t.push('</div>');
	t.push('<ol>');
	$('body > table').eq(3).after(t.join(''));
}

var addEvents = function ()
{
	$('#generate-table').on('click', transform);
	$('#post-data').on('click', postData);
	//- reorder the calendar and project picker
	var oldFormRow = $('form[name=mytimeForm]').find('table table > tbody > tr').eq(0),
		projectPicker = oldFormRow.find('td').eq(0).detach().find('table > tbody > tr');
	$('#project-picker').append(projectPicker.eq(0).detach());
	$('#project-picker').append(projectPicker.eq(1).find('select').detach());
	// $('form[name=mytimeForm]').remove();
}

var postData = function ()
{
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
				t.date = $('#sheet-month').val() + '/' + d + '/' + $('#sheet-year').val();
				t.note = c.length > 3 ? c.eq(3).text() : '';
				t.project = $('#project').val();
				t.activity = $('#activity').val();
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

var transform = function ()
{
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
	d = '<style>#excel-import-table {border: 1px solid #ccc; border-collapse: collapse;} \
	#excel-import-table td {border: 1px solid #ccc;padding: 4px 8px;} \
	#excel-import-table th h4 {padding: 0;margin: 0;} \
	#excel-import-table th {background: #000; color: #fff; \
	}</style>\
	<table id="excel-import-table">' + tableHeaders.join('') + d + '</table>';
	$('#generated-table').html(d);
}

var TimeCard = function()
{
	return {
		project: '',
		activity: '',
		start: '',
		finish: '',
		note: '',
		billable:'1',
		date:'',
		date_now: $('#calendar_now_time').text(),
		btmytime:'submit'
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
			url: 'https://planet.tikalk.com/timetracker/mytime.php',
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
/* delete all posts





var posts = [], monthRows = $('div.CalendarCommonCell').parents('table').eq(0).next().find('table tbody tr'), dates = [], currentRow, dateLink;
//console.log(monthRows);
for (var i = 2; i < monthRows.length; i++) {
	currentRow = monthRows.eq(i).find('td');
	if (currentRow) {
		for (var j = 0; j < currentRow.length; j++) {
			dateLink = currentRow.eq(j).find('a').attr('href');
			if (dateLink)
				dates.push(dateLink);
		}
	}
}
function collectTasksToDelete() {
	for (var i = 0; i < dates.length; i++) {
		if (dates[i]) {
		$.get('https://planet.tikalk.com/timetracker/mytime.php' + dates[i],
			function (data) {
				var links = $(data).find('.tableHeader').parent().parent().find('a[href]'), link;
				link = links.eq(1).attr('href');
				console.log('link: ' + link)
				posts.push(link);
			});
		}
	}
	deleteAllPosts()
	console.log('posts:' + posts);
}
var results = [];
function deleteAllPosts() {
	for (var i = 0; i < 5; i++) {
		if (posts[i]) {
		$.post('https://planet.tikalk.com/timetracker/' + posts[i],
			function (data) {
				results.push(data);
			});
		}
	}
}
console.log('dates: ' + dates);
collectTasksToDelete();






*/