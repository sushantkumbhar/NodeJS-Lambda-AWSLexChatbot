'use strict';
   
function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
} 

function confirmIntent(sessionAttributes, intentName, slots, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ConfirmIntent',
            intentName,
            slots,
            message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

// --------------- Events -----------------------
 
function dispatch(intentRequest, callback) {

	const intentName = intentRequest.currentIntent.name;
	console.log(`Received request for userId*****=${intentRequest.userId}, intent=${intentName}`);
	var http = require('http');
	var extServerOptionsGet;
	var reqGet;
	const sessionAttributes = intentRequest.sessionAttributes || {};
	if (intentName === 'Warranty') {
    const CheckWarranty = intentRequest.currentIntent.slots.CheckWarranty;
    const CheckESN = intentRequest.currentIntent.slots.CheckESN;
	const MobileNumber = intentRequest.currentIntent.slots.MobileNumber;
    const ESNNumber = intentRequest.currentIntent.slots.ESNNumber;
	const FileClaim = intentRequest.currentIntent.slots.FileClaim;
	const BuyDevice = intentRequest.currentIntent.slots.BuyDevice;
	if (CheckWarranty && !CheckESN) {
		if(CheckWarranty.toUpperCase()=='YES' || CheckWarranty.toUpperCase()=='YEAH' || CheckWarranty.toUpperCase()=='OK' || CheckWarranty.toUpperCase()=='SURE' || CheckWarranty.toUpperCase()=='YUP') {
			callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
			intentRequest.currentIntent.slots, 'CheckESN', { 'contentType': 'PlainText', 'content': `Do you have your IMEI number with you?`}));
			return;
		}
		else {
			callback(close(sessionAttributes, 'Fulfilled',
			{'contentType': 'PlainText', 'content': `Is there any other way, I can assist you today?`}));
		}		
	}
	else if (CheckWarranty && CheckESN && !ESNNumber && !MobileNumber) {
		if(CheckESN.toUpperCase()=='YES' || CheckESN.toUpperCase()=='YEAH' || CheckESN.toUpperCase()=='OK' || CheckESN.toUpperCase()=='SURE' || CheckESN.toUpperCase()=='YUP') {
			callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
			intentRequest.currentIntent.slots, 'ESNNumber', { 'contentType': 'PlainText', 'content': 'Please provide your device IMEI number. To know your IMEI number you can type *#06# on your phone keypad'}));
			return;
		}
		else {
			callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
			intentRequest.currentIntent.slots, 'MobileNumber', { 'contentType': 'PlainText', 'content': 'Please provide your mobile number'}));
		}		
	}
	else if (CheckWarranty && CheckESN && !ESNNumber && MobileNumber) 
	{	
		var extServerOptionsGet1 = {
			host: 'Host',
			port: '8082',
			path: `/checkiseligible?BrandName=Telcel&Min=${MobileNumber}`,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		};
		console.log(extServerOptionsGet1);
		var reqGet1 = http.request(extServerOptionsGet1, function (res1) {
			res1.on('data', function (d1) {
				var ResponseGet1 = JSON.parse(d1.toString());
				console.log(ResponseGet1);
			//to be updated
			
			var MobNum=ResponseGet1.result;
		if(ResponseGet1.outputString=='success') {
			if(isNaN(MobNum)) {
				var MbNumReason;
				if(MobNum=='MIN Not DIGINOVA') {
					MbNumReason=' The Mobile number could not be found';
				}
				else if(MobNum=='MIN HOTLINED') {
					MbNumReason=' The Mobile number has been hotlined due to inactivity/non-payment';
				}
				else if(MobNum=='MIN Inactive') {
					MbNumReason=' The Mobile number is not yet activated';
				}
				else if(MobNum=='MIN Unused') {
					MbNumReason=' The Mobile number is not assigned to any user';
				}
				else {
					MbNumReason=' The Mobile number belongs to another user';
				}
				callback(close(sessionAttributes, 'Fulfilled',
				{'contentType': 'PlainText', 'content': `I am sorry.${MbNumReason}. To better assist you, please reach our call center at 1-855-789-4268 between 8 AM to midnight (EST) any day of the week.      
				Is there any other way, I can assist you today?`}));
			}
			else {
				intentRequest.currentIntent.slots.ESNNumber=MobNum;
				//callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
				//return;
				var extServerOptionsGet2 = {
					host: 'Host',
					port: '8082',
					path: `/checkiseligible?BrandName=Telcel&Esn=${MobNum}`,
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json'
				}
			};
			console.log(extServerOptionsGet2);
			var reqGet2 = http.request(extServerOptionsGet2, function (res2) {
			res2.on('data', function (d2) {
				var ResponseGet2 = JSON.parse(d2.toString());
				console.log(ResponseGet2);		
			var ESNNumberStatus2=ResponseGet2.result;
			if(ResponseGet2.outputString=='SUCCESS') {
				if(ESNNumberStatus2=='WARRANTY') {
				callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
				intentRequest.currentIntent.slots, 'FileClaim', { 'contentType': 'PlainText', 'content': `Your device with IMEI ${MobNum} is covered under warranty. Do you want to file a claim?`}));
				return;
			}
			else if(ESNNumberStatus2=='IMEI Warranty Expired') {
				callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
				intentRequest.currentIntent.slots, 'BuyDevice', { 'contentType': 'PlainText', 'content': `Your derive with IMEI ${MobNum} is not covered under warranty. Do you want to buy a replacement device?`}));
				return;
			}
			else {
				var ESNReason2;
				if(ESNNumberStatus2=='IMEI Not DIGINOVA') {
					ESNReason2=' The IMEI number could not be found';
				}
				else if(ESNNumberStatus2=='IMEI HOTLINED') {
					ESNReason2=' The IMEI number has been marked as lost';
				}
				else if(ESNNumberStatus2=='IMEI UNSOLD') {
					ESNReason2=' The IMEI number has still not been sold';
				}
				else {
					ESNReason2=' The IMEI number belongs to another user';
				}
				callback(close(sessionAttributes, 'Fulfilled',
				{'contentType': 'PlainText', 'content': `I am sorry.${ESNReason2}. To better assist you, please reach our call center at 1-855-789-4268 between 8 AM to midnight (EST) any day of the week.      
				Is there any other way, I can assist you today?`}));
			}
		}
		else {
			callback(close(sessionAttributes, 'Fulfilled',
			{'contentType': 'PlainText', 'content': `I am sorry. I cannot find a device with IMEI number ${MobNum}. To better assist you, please reach our call center at 1-855-789-4268 between 8 AM to midnight (EST) any day of the week.      
			Is there any other way, I can assist you today?`}));
		}
		});
		});
	    reqGet2.end();
		reqGet2.on('error', function (e1) {
			console.error(e1);
		});	
		}
		}
		else {
			callback(close(sessionAttributes, 'Fulfilled',
			{'contentType': 'PlainText', 'content': `I am sorry. I cannot find the mobile number ${MobileNumber}. To better assist you, please reach our call center at 1-855-789-4268 between 8 AM to midnight (EST) any day of the week.      
			Is there any other way, I can assist you today?`}));
		}
		});
		});
	    reqGet1.end();
		reqGet1.on('error', function (e) {
			console.error(e);
		});
	}
	else if (CheckWarranty && CheckESN && ESNNumber && !BuyDevice && !FileClaim) {
		//Call Service
		if(isNaN(ESNNumber))
		{
			callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
			intentRequest.currentIntent.slots, 'ESNNumber', { 'contentType': 'PlainText', 'content': `Your IMEI number ${ESNNumber} is not a valid IMEI number. It should be a 8 or 12 digit number. Please enter a valid IMEI number`}));
			return;
		}
		else if(ESNNumber.length==8 || ESNNumber.length==12)
		{	
		extServerOptionsGet = {
			host: 'Host',
			port: '8082',
			path: `/checkiseligible?BrandName=Telcel&Esn=${ESNNumber}`,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		};
		console.log(extServerOptionsGet);
		reqGet = http.request(extServerOptionsGet, function (res) {
			res.on('data', function (d) {
				var ResponseGet = JSON.parse(d.toString());
				console.log(ResponseGet);		
			var ESNNumberStatus=ResponseGet.result;
		if(ResponseGet.outputString=='SUCCESS') {
			if(ESNNumberStatus=='WARRANTY') {
				callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
				intentRequest.currentIntent.slots, 'FileClaim', { 'contentType': 'PlainText', 'content': `Your device with IMEI ${ESNNumber} is covered under warranty. Do you want to file a claim?`}));
				return;
			}
			else if(ESNNumberStatus=='IMEI Warranty Expired') {
				callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
				intentRequest.currentIntent.slots, 'BuyDevice', { 'contentType': 'PlainText', 'content': `Your device with IMEI ${ESNNumber} is not covered under warranty. Do you want to buy a replacement device?`}));
				return;
			}
			else {
				var ESNReason;
				if(ESNNumberStatus=='IMEI Not DIGINOVA') {
					ESNReason=' The IMEI number could not be found';
				}
				else if(ESNNumberStatus=='IMEI HOTLINED') {
					ESNReason=' The IMEI number has been marked as lost';
				}
				else if(ESNNumberStatus=='IMEI UNSOLD') {
					ESNReason=' The IMEI number has still not been sold';
				}
				else {
					ESNReason=' The IMEI number belongs to another user';
				}
				callback(close(sessionAttributes, 'Fulfilled',
				{'contentType': 'PlainText', 'content': `I am sorry.${ESNReason}. To better assist you, please reach our call center at 1-855-789-4268 between 8 AM to midnight (EST) any day of the week.      
				Is there any other way, I can assist you today?`}));
			}
		}
		else {
			callback(close(sessionAttributes, 'Fulfilled',
			{'contentType': 'PlainText', 'content': `I am sorry. I cannot find a device with IMEI number ${ESNNumber}. To better assist you, please reach our call center at 1-855-789-4268 between 8 AM to midnight (EST) any day of the week.      
			Is there any other way, I can assist you today?`}));
		}
		});
		});
	    reqGet.end();
		reqGet.on('error', function (e) {
			console.error(e);
		});
		}
		else
		{
			var ESNlen=ESNNumber.length;
			callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
			intentRequest.currentIntent.slots, 'ESNNumber', { 'contentType': 'PlainText', 'content': `Your IMEI number ${ESNNumber} is not a valid IMEI number. It should be a 8 or 12 digit number. Please enter a valid IMEI number`}));
			return;
		}
	}
	else if (CheckWarranty && CheckESN && ESNNumber && FileClaim && !BuyDevice) {
		if(FileClaim.toUpperCase()=='YES' || FileClaim.toUpperCase()=='YEAH' || FileClaim.toUpperCase()=='OK' || FileClaim.toUpperCase()=='SURE' || FileClaim.toUpperCase()=='YUP') {
			callback(close(sessionAttributes, 'Fulfilled',
			{'contentType': 'PlainText', 'content': `Click "https://www.rtelecom.net/page/26/warranty.html" to file a claim.\r\n. Is there any other way, I can assist you today?`}));
		}
		else {
			callback(close(sessionAttributes, 'Fulfilled',
			{'contentType': 'PlainText', 'content': `Is there any other way, I can assist you today?`}));
		}		
	}
	else if (CheckWarranty && CheckESN && ESNNumber && !FileClaim && BuyDevice) {
		if(BuyDevice.toUpperCase()=='YES' || BuyDevice.toUpperCase()=='YEAH' || BuyDevice.toUpperCase()=='OK' || BuyDevice.toUpperCase()=='SURE' || BuyDevice.toUpperCase()=='YUP') {
			callback(close(sessionAttributes, 'Fulfilled',
			{'contentType': 'PlainText', 'content': `Click "https://store.google.com" to buy a new device.\r\n. Is there any other way, I can assist you today?`}));
		}
		else {
			callback(close(sessionAttributes, 'Fulfilled',
			{'contentType': 'PlainText', 'content': `Is there any other way, I can assist you today?`}));
		}	
	}
	else {
		callback(close(sessionAttributes, 'Fulfilled',
		{'contentType': 'PlainText', 'content': `Is there any other way, I can assist you today?`}));
	}
}
else if (intentName === 'ServicePlan_VerifyAutoRefill') 
{
	const MobileNumber = intentRequest.currentIntent.slots.MobileNumber;
	var extServerOptionsGet = {
			host: 'Host',
			port: '8082',
			path: `/checkiseligible?BrandName=Telcel&Min=${MobileNumber}`,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		};
		console.log(extServerOptionsGet);
		var reqGet = http.request(extServerOptionsGet, function (res) {
			res.on('data', function (d) {
			var ResponseGet = JSON.parse(d.toString());
			console.log(ResponseGet);
			var MobNum=ResponseGet.result;
			if(ResponseGet.outputString=='success') {
			if(isNaN(MobNum)) {
				var MbNumReason;
				if(MobNum=='MIN Not DIGINOVA') {
					MbNumReason=' The Mobile number could not be found';
				}
				else if(MobNum=='MIN HOTLINED') {
					MbNumReason=' The Mobile number has been hotlined due to inactivity/non-payment';
				}
				else if(MobNum=='MIN Inactive') {
					MbNumReason=' The Mobile number is not yet activated';
				}
				else if(MobNum=='MIN Unused') {
					MbNumReason=' The Mobile number is not assigned to any user';
				}
				else {
					MbNumReason=' The Mobile number belongs to another user';
				}
				callback(close(sessionAttributes, 'Fulfilled',
				{'contentType': 'PlainText', 'content': `I am sorry.${MbNumReason}. To better assist you, please reach our call center at 1-855-789-4268 between 8 AM to midnight (EST) any day of the week.      
				Is there any other way, I can assist you today?`}));
			}
		else 
		{
		//Auto Refill check Call needs to be updated
		if (MobNum=='1234567890')
	{callback(close(sessionAttributes, 'Fulfilled',
	{'contentType': 'PlainText', 'content': `I am Sorry, you are currently not enrolled for Auto-Refill with your current plan. Is there any other way, I can assist you today?`}));
}	
else
	{callback(close(sessionAttributes, 'Fulfilled',
	{'contentType': 'PlainText', 'content': `I could see that you are enrolled for Auto-Refill with your current plan. Your Current Service Plan will be refilled automatically. Is there any other way, I can assist you today?`}));
}
}
}
});
		});
		reqGet.end();
		reqGet.on('error', function (e) {
			console.error(e);
		});

}
else if (intentName === 'ServicePlan_StopAutoRefill') 
{
	const MobileNumber = intentRequest.currentIntent.slots.MobileNumber;
	const CheckDeEnroll = intentRequest.currentIntent.slots.CheckDeEnroll;
	if (MobileNumber && !CheckDeEnroll)
	{
	var extServerOptionsGet = {
			host: 'Host',
			port: '8082',
			path: `/checkiseligible?BrandName=Telcel&Min=${MobileNumber}`,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		};
		console.log(extServerOptionsGet);
		var reqGet = http.request(extServerOptionsGet, function (res) {
			res.on('data', function (d) {
			var ResponseGet = JSON.parse(d.toString());
			console.log(ResponseGet);
			var MobNum=ResponseGet.result;
			if(ResponseGet.outputString=='success') {
			if(isNaN(MobNum)) {
				var MbNumReason;
				if(MobNum=='MIN Not DIGINOVA') {
					MbNumReason=' The Mobile number could not be found';
				}
				else if(MobNum=='MIN HOTLINED') {
					MbNumReason=' The Mobile number has been hotlined due to inactivity/non-payment';
				}
				else if(MobNum=='MIN Inactive') {
					MbNumReason=' The Mobile number is not yet activated';
				}
				else if(MobNum=='MIN Unused') {
					MbNumReason=' The Mobile number is not assigned to any user';
				}
				else {
					MbNumReason=' The Mobile number belongs to another user';
				}
				callback(close(sessionAttributes, 'Fulfilled',
				{'contentType': 'PlainText', 'content': `I am sorry.${MbNumReason}. To better assist you, please reach our call center at 1-855-789-4268 between 8 AM to midnight (EST) any day of the week.      
				Is there any other way, I can assist you today?`}));
			}
		else 
		{
		//Auto Refill check Call needs to be updated
		if (MobNum=='1234567890')
	{callback(close(sessionAttributes, 'Fulfilled',
	{'contentType': 'PlainText', 'content': `I am Sorry, you are currently not enrolled for Auto-Refill with your current plan. Is there any other way, I can assist you today?`}));
}	
else
	{callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
			intentRequest.currentIntent.slots, 'CheckDeEnroll', { 'contentType': 'PlainText', 'content': `Your Current Service Plan is set to refill automatically. Are you sure to Cancel your auto-enrollment now?`}));
			return;
}
}
}
});
		});
		reqGet.end();
		reqGet.on('error', function (e) {
			console.error(e);
		});
}
else if (MobileNumber && CheckDeEnroll)
{
if(CheckDeEnroll.toUpperCase()=='YES' || CheckDeEnroll.toUpperCase()=='YEAH' || CheckDeEnroll.toUpperCase()=='OK' || CheckDeEnroll.toUpperCase()=='SURE' || CheckDeEnroll.toUpperCase()=='YUP') {
		//De Enroll Auto Refill Call needs to be updated
			callback(close(sessionAttributes, 'Fulfilled',
			{'contentType': 'PlainText', 'content': `Auto-refill for your plan has been successfully cancelled. Your transaction id is.`}));
		}
		else {
			callback(close(sessionAttributes, 'Fulfilled',
			{'contentType': 'PlainText', 'content': `Is there any other way, I can assist you today?`}));
		}
}
else {
	callback(close(sessionAttributes, 'Fulfilled',
		{'contentType': 'PlainText', 'content': `Is there any other way, I can assist you today?`}));
	}
}
else if (intentName === 'ServicePlan_CheckBalance') 
{
	const MobileNumber = intentRequest.currentIntent.slots.MobileNumber;
	var extServerOptionsGet = {
			host: 'Host',
			port: '8082',
			path: `/checkiseligible?BrandName=Telcel&Min=${MobileNumber}`,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		};
		console.log(extServerOptionsGet);
		var reqGet = http.request(extServerOptionsGet, function (res) {
			res.on('data', function (d) {
			var ResponseGet = JSON.parse(d.toString());
			console.log(ResponseGet);
			var MobNum=ResponseGet.result;
			if(ResponseGet.outputString=='success') {
			if(isNaN(MobNum)) {
				var MbNumReason;
				if(MobNum=='MIN Not DIGINOVA') {
					MbNumReason=' The Mobile number could not be found';
				}
				else if(MobNum=='MIN HOTLINED') {
					MbNumReason=' The Mobile number has been hotlined due to inactivity/non-payment';
				}
				else if(MobNum=='MIN Inactive') {
					MbNumReason=' The Mobile number is not yet activated';
				}
				else if(MobNum=='MIN Unused') {
					MbNumReason=' The Mobile number is not assigned to any user';
				}
				else {
					MbNumReason=' The Mobile number belongs to another user';
				}
				callback(close(sessionAttributes, 'Fulfilled',
				{'contentType': 'PlainText', 'content': `I am sorry.${MbNumReason}. To better assist you, please reach our call center at 1-855-789-4268 between 8 AM to midnight (EST) any day of the week.      
				Is there any other way, I can assist you today?`}));
			}
		else 
		{
		//Auto Refill check Call needs to be updated	
	callback(close(sessionAttributes, 'Fulfilled',
	{'contentType': 'PlainText', 'content': `Your current balance for Plan on this is: \r\n.VOICE : \r\n.TEXT: \r\n.DATA: \r\n.It is due to expire of. \r\n.Is there any other way, I can assist you today?`}));
}
}
});
		});
		reqGet.end();
		reqGet.on('error', function (e) {
			console.error(e);
		});

}

else if (intentName === 'Help') {
	callback(close(sessionAttributes, 'Fulfilled',
	{'contentType': 'PlainText', 'content': `Please type either 'Warranty' ,'Service ', 'Shop', ‘Calling card ' or 'Others’ to assist you.`}));
}
else {
	callback(close(sessionAttributes, 'Fulfilled',
	{'contentType': 'PlainText', 'content': `Thank you for your time. Have a wonderful day !!!`}));
}
}


//---------------END Fullfillment-------------------
 
// --------------- Main handler -----------------------
 
// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        dispatch(event,
            (response) => {
                callback(null, response);
            });
    } catch (err) {
        callback(err);
    }
};