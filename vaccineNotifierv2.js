require('dotenv').config()
const moment = require('moment');
const cron = require('node-cron');
const axios = require('axios');
const notifier = require('./notifier');
/**
Step 1) Enable application access on your gmail with steps given here:
 https://support.google.com/accounts/answer/185833?p=InvalidSecondFactor&visit_id=637554658548216477-2576856839&rd=1

Step 2) Enter the details in the file .env, present in the same folder

Step 3) On your terminal run: npm i && pm2 start vaccineNotifierv2.js

To close the app, run: pm2 stop vaccineNotifierv2.js && pm2 delete vaccineNotifierv2.js
 */


const EMAIL = process.env.EMAIL
const AGE = process.env.AGE

async function main(){
    try {
        cron.schedule('* * * * *', async () => {
             await checkAvailability();
        });
    } catch (e) {
        console.log('an error occured: ' + JSON.stringify(e, null, 2));
        throw e;
    }
}

async function checkAvailability() {

    let datesArray = await fetchNext10Days();
    datesArray.forEach(date => {
        getSlotsForDate(date);
    })
}

function getSlotsForDate(DATE) {
	//All pincodes including Bangalore Urban as well as Rural. This already moved to environment file as well 
	//var pinCode = ['560001','560002','560003','560004','560005','560006','560007','560008','560009','560010','560011','560012','560013','560014','560015','560016','560017','560018','560019','560020','560021','560022','560023','560024','560025','560026','560027','560029','560030','560032','560033','560034','560035','560036','560037','560038','560039','560040','560041','560042','560043','560045','560046','560047','560048','560049','560050','560051','560053','560054','560055','560056','560057','560058','560059','560060','560061','560062','560063','560064','560065','560066','560067','560068','560070','560071','560072','560073','560074','560075','560076','560077','560078','560079','560080','560082','560083','560084','560085','560086','560087','560090','560091','560092','560093','560094','560095','560096','560097','560098','560099','560100','560102','560103','560104','560105','560300','562106','562107','562120','562125','562130','562149','562157'];
	var pinCode = process.env.PINCODE.split(",");
	for (var i = 0; i < pinCode.length; i++) {
		//console.log('Pincode = '+ pinCode[i]);
		let config = {
			method: 'get',
			url: 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=' + pinCode[i] + '&date=' + DATE,
			headers: {
				'accept': 'application/json',
				'Accept-Language': 'hi_IN'
			}
		};	
		//console.log('Pincode = '+ pinCode[i]);
		axios(config)
        .then(function (slots) {
            let sessions = slots.data.sessions;
            let validSlots = sessions.filter(slot => slot.min_age_limit <= AGE &&  slot.available_capacity > 0)
            console.log({date:DATE, validSlots: validSlots.length})
            if(validSlots.length > 0) {
                notifyMe(validSlots);
            }
        })
        .catch(function (error) {
            console.log(error);
        });

		
	}

}

async function

notifyMe(validSlots){
    let slotDetails = JSON.stringify(validSlots, null, '\t');
    notifier.sendEmail(EMAIL, 'VACCINE AVAILABLE', slotDetails, (err, result) => {
        if(err) {
            console.error({err});
        }
    })
};

async function fetchNext10Days(){
    let dates = [];
    let today = moment();
    for(let i = 0 ; i < 10 ; i ++ ){
        let dateString = today.format('DD-MM-YYYY')
        dates.push(dateString);
        today.add(1, 'day');
    }
    return dates;
}


main()
    .then(() => {console.log('Vaccine availability checker started.');});
