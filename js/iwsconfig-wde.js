log.setLogLevel(enumloglevel.debug);
$(document).ready(async function () {
    console.log("document ready!");
    //var token = await getCsrfToken();
    saputil.loadScript("js/wdeintegration.js");
    $("body").append('<div id="content" class="softphone_content"></div>');
    saputil.appendHTML(`
		<div id="IWSConnectorToolbar" name="IWSConnectorToolbar" style="display: none"></div>
		<div class="container-wde">
			<div class="header"><img src="img/logo_softphone.bin" />
				<p class="title"></p>
				<p class="version"></p>
			</div>
			<div class="led-msg">
				<div id="led"></div>
				<p></p>
				<div class="btn-logs">
					<input type="button" onclick="toggleExpand()" id="expand" value="Logs"></input>
				</div>
			</div>
			<div class="buttons" style="display: none"><input id="saveLogs" type="checkbox"
					onchange="updateSaveLog()" /><label>Save logs</label><button onclick="download()">Download</button><button
					onclick="clearLog()">Clear</button></div>
			<div class="logs">
				<ul></ul>
			</div>
		</div>
	`);
    iwscore.getConnectorConfig().integrationType = "wde";
    iwscore.createConnection('localhost', 6969, { 'protocol': 'https' });
});
