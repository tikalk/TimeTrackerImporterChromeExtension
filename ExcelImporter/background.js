var main = '';
jQuery.get('main.html', function(res){
	main = res;
});
function handleRequest(response) {
        // console.log('form background script', response);
}
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
	if (request.action === 'get-html'){
		sendResponse(main);
	}
  });

chrome.extension.sendRequest({'action': 'get-html'}, handleRequest);