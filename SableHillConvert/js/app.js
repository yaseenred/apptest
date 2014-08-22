var TIMEOUT = 15000;
var databag = Array();
var has_more_offline_content = false;
var apphist = new Array();

function GetServer()
{
	//return "http://dev1.local/mobile/";
	return "http://sablehills.syncip.co.za/mobile/";
}

function GoBack()
{
	element = apphist.pop();
	if(element)
	{
		$("#prevaction").val("");
		LoadContent(element);
	}
}

function IsBlackBerryOS6()
{
    return false;
}

function OpenBrowserURL(url)
{
	navigator.app.loadUrl(url, { openExternal:true } ); 
	return false;
}

function ShowMessage(title, message)
{
    $( ".selector" ).loader( "hide" );
    $.mobile.changePage("#msgdlg", { transition: "none"} );             
    $("#msgcontent").html(message);
    $("#msgtitle").html(title);      
}

function ShowBackButton()
{
   $("#backbutton").show();
}

function HideBackButton()
{
   $("#backbutton").show();
}

function ScrollTop()
{
	$.mobile.silentScroll(0);
}

function SetupNavPanels(data)
{   
   $("#navpanelleft").panel("close");
   $("#navpanelright").panel("close");
   
   if(data.navpanelleft != null)
   {
	   $("#navpanelleft").html(data.navpanelleft);
	   $("#navpanelleft").trigger('create');
	   $("#btnnavpanelleft").show();
   }
   else
   {
	   $("#btnnavpanelleft").hide();
   }  
   
   if(data.navpanelright != null)
   {
	   $("#navpanelright").html(data.navpanelright);
	   $("#navpanelright").trigger('create');
	   $("#btnnavpanelright").show();
   }
   else
   {
	   $("#btnnavpanelright").hide();
   }
}

function ToObject(arr) {
  var rv = {};
  for (var i = 0; i < arr.length; ++i)
    rv[i] = arr[i];
  return rv;
}

function GetDatabag()
{
	var i = 0, //i is standing for int
    databagobj = {}, //o is standing for object
    sKey; //s is standing for string
	while ((sKey = window.localStorage.key(i))) 
	{
		if(sKey.indexOf('response_') < 0)
			databagobj[sKey] = window.localStorage.getItem(sKey);
		i++;
	}	
	databag = databagobj;
	return databag;
}

function SetDatabag(data)
{
   if(data.databag != null)
   {
        databag = data.databag;  
		for (var name in databag) {
			if(databag[name] == null)
				window.localStorage.removeItem(name);
			else
				window.localStorage.setItem(name,databag[name]);
		}
   }      
}

function LoadOfflineVersion(action)
{
	$.mobile.loading('hide'); 
	data = window.localStorage.getItem('response_' + action);
	if(data != null)
	{
		LoadContentCallback(JSON.parse(data));
	}
	else
		ShowMessage('Network Error','<p>The network seem to be unavailable and there are no local cache available. </p><p>Please check your internet connectivity or try again later.</p>')          
}

function SaveOfflineVersion(action,data)
{
	window.localStorage.setItem('response_' + action,JSON.stringify(data))
}

function SaveFormContentOffline(action,formid,postdata)
{	
	timestamp = new Date().getTime();
	key = 'form_' + formid + '_' + action + '_' + timestamp;
	window.localStorage.setItem(key,postdata);
	$.mobile.loading('hide');
}

function SyncOfflineFormContent()
{
	var i = 0, //i is standing for int
    sKey; //s is standing for string
	while ((sKey = window.localStorage.key(i))) 
	{		
		if(sKey.indexOf('form_') > -1)
		{
			postdata = window.localStorage.getItem(sKey);
			parts = sKey.split('_');
			formid = parts[1];
			actionid = parts[2];
			
			if((postdata != null) && (postdata != ''))
				postdata += '&offlinedatakey=' + sKey;
			else
				postdata += 'offlinedatakey=' + sKey;						
			
			SubmitOfflineFormContent(formid,actionid,postdata);
			has_more_offline_content = true;
			return;
		}
		i++;
	}
	has_more_offline_content = false;	
}

function LoadContentCallback(data)
{	   
   $.mobile.loading('hide');       
   
   SetDatabag(data);      
   
   if(data.redirect != null)
   {
	  LoadContent(data.redirect);
	  if(data.messagetitle != null)
	   ShowMessage(data.messagetitle,data.message);  
	  return;
   }

   SaveOfflineVersion($('#currentaction').val(),data);         
   
   SetupNavPanels(data);
   
   $("#content").html(data.html);
   $("#contenttitle").html(data.title);      
   $("#content").trigger('create');  
   $('#table-column-toggle').table("refresh");   
   
   if(data.back)
      $("#backbutton").show();
   else
      $("#backbutton").hide();     
   if(data.backjs != null)
	  $("#backbutton").attr("onclick",data.backjs);    
   
   if(data.messagetitle != null)
	   ShowMessage(data.messagetitle,data.message);   
   
   $.mobile.silentScroll(0);  

   if(navigator.onLine)
      SyncOfflineFormContent();
}

function LoadContent(action)
{           
   if((action != $("#prevaction").val()) && ($("#prevaction").val() != ""))
      apphist.push($("#prevaction").val());	
   $("#prevaction").val(action);
   $("#currentaction").val(action); 
   
   var postdata = 'databag=' + JSON.stringify(databag);
   
   var server = GetServer() + action;   
   $.mobile.loading( 'show', { theme: "a"});
   $.ajax({
	  type: "POST",
	  data: postdata,
	  url: server,      
	  cache: false,
	  dataType: 'jsonp',
	  jsonp: 'callback',
	  jsonpCallback: 'LoadContentCallback',
	  timeout: TIMEOUT,
	  success: function() {			  
	  },
	  error   : function (jqXHR, textStatus, errorThrown) {
		 LoadOfflineVersion(action);			 
	  }

   });   
}

function SubmitFormContent(action,formid,allowoffline)
{      
   if((action != $("#prevaction").val()) && ($("#prevaction").val() != ""))
      apphist.push($("#prevaction").val());	
   $("#prevaction").val(action);
   
   var server = GetServer() + action;   
   var postdata = 'databag=' + JSON.stringify(databag) + "&" + $("#" + formid).serialize();
   
   $.mobile.loading( 'show', { theme: "a" });
   $.ajax({
      type: "POST",
      url: server,         
      cache: false,
      dataType: 'jsonp',
      jsonp: 'callback',
      jsonpCallback: 'LoadContentCallback',
      timeout: TIMEOUT,
      data: postdata,
      success: function() {    		 
      },
      error   : function (jqXHR, textStatus, errorThrown) {
		alert(textStatus);
		  if(allowoffline)
			 SaveFormContentOffline(action,formid,postdata); 
		  else
		     ShowMessage('Network Error','<p>The network seem to be unavailable. </p><p>Please check your internet connectivity or try again later.</p>')          
      }

   });   
}

function SubmitOfflineFormContentCallback(data)
{	
	if(data.offlinedatakey != null)
		window.localStorage.removeItem(data.offlinedatakey);
	
   if(data.messagetitle != null)
	   alert(data.message);   	
	
	if(has_more_offline_content)
	{
		if(navigator.onLine)
			SyncOfflineFormContent();
	}
}

function SubmitOfflineFormContent(action,formid,postdata)
{   	
   var server = GetServer() + 'offline/' + action;   
      
   $.ajax({
      type: "POST",
      url: server,         
      cache: false,
      dataType: 'jsonp',
      jsonp: 'callback',
      jsonpCallback: 'SubmitOfflineFormContentCallback',
      timeout: TIMEOUT,
      data: postdata,
      success: function() {    		 
      },
      error   : function (jqXHR, textStatus, errorThrown) {		  
      }
   });   
}

function ValidEmail(email) {
    return true;
	// TEMP
	
    var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    if (!filter.test(email)) 
		return false;	
	else
		return true;
}

function Logout()
{	
	window.localStorage.removeItem('userid',null);
	window.localStorage.clear(); 	
	databag = [];	
	LoadContent('signin');
}