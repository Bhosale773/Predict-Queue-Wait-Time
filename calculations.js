var Patient               = require("./models/patient");
var RegPatient            = require("./models/regPatient");
var AlgoData              = require("./models/algoData");
var Appointment          = require("./models/appointment");
var timespan              = require("timespan");

var currentUserStatus = {};

function calculate(patient, patientStatus){
    var algoData;

    AlgoData.findOne({},function(err, foundOne){
        if(err){
            console.log(err);
        }else{
            algoData = foundOne;
        }

        if(patientStatus!=null){
            currentUserStatus.name = patientStatus.name;
            currentUserStatus.token = patientStatus.token;
            currentUserStatus.registrationTime = patientStatus.stage1.date;
            currentUserStatus.consultationInTime = patientStatus.stage2.inTime.date;
            currentUserStatus.consultationOutTime = patientStatus.stage2.outTime.date;
            currentUserStatus.billingInTime = patientStatus.stage3.activeDate;
            currentUserStatus.billingOutTime = patientStatus.stage3.date;
            currentUserStatus.medicineInTime = patientStatus.stage4.activeDate;
            currentUserStatus.medicineOutTime = patientStatus.stage4.date;
            currentUserStatus.consultAhead = 0;
            currentUserStatus.mediAhead = 0;
            currentUserStatus.billAhead = 0;
            currentUserStatus.consultAvg = 0;
            currentUserStatus.billAvg = 0;
            currentUserStatus.mediAvg = 0;
    
            var wait=0;
            var count=0;
            RegPatient.find({
                "stage1.isInQueue" : true,
                "stage1.date" : {$ne : null},
                "stage2.outTime.isGone" : false,
                "_id" : {$lt : patientStatus._id},
            },function(err,foundOne){
                if(err){
                    console.log(err);
                }
                else{
                    for(var i=0; i<foundOne.length; i++){
                        if(foundOne[i]!=null){
                            console.log(algoData.consultAvg[foundOne[i].reason]);
                            console.log(wait);
                            wait = wait + algoData.consultAvg[foundOne[i].reason];
                            count++;
                        }
                    }
                    var day = new Date(Date.now());
                    var today = new Date(day.getFullYear(),day.getMonth(),day.getDate());
                    var apts;
                    Appointment.find({"onlyDate" : today},function(err,foundApts){
                        if(err){
                            console.log(err);
                        }
                        else{
                            apts = foundApts;
                        }
        
                        apts.sort(function compare(a,b){
                            return (a._id-b._id);
                        });

                        var sDt = Math.round(Date.now()/1000);
                        var eDt = sDt+wait;
                        var aptWait = 0;
                        var aptCount = 0;
                        console.log(apts);
                        for(var i=0;i<apts.length;i++)
                        {
                            var start = apts[i].date.getTime();
                            start = Math.round(start/1000);
                            var end = start+30*60;
                            console.log(start,end,sDt,eDt);
                            if((start>=sDt && start<=eDt) || (end>=sDt && end<=eDt) || (start<=sDt && end>=eDt)){
                                aptWait = aptWait + algoData.consultAvg[apts[i].type];
                                aptCount++;
                            }
                        }

                        RegPatient.findOne({
                            "stage2.isActive" : true,
                            "stage1.isInQueue":true,
                            "stage2.outTime.isGone" : false
                            },function(err, foundOne){
                                if(err){
                                    console.log(err);
                                }
                                else if(foundOne!=null){
                                    var currentDate = new Date(Date.now());
                                    var ts = timespan.fromDates(foundOne.stage2.inTime.date,currentDate,true);
                                    var sec = ts.totalSeconds();
                                    if(sec<algoData.consultAvg[foundOne.reason]){
                                        wait = wait - sec;
                                    }
                                    else{
                                        wait = wait - algoData.consultAvg[foundOne.reason];
                                    }
                                }
                                if(wait<60){
                                        wait = 60;
                                }
                                currentUserStatus.consultAhead = count;
                                currentUserStatus.consultAvg = wait + aptWait;
                                console.log(wait,aptWait,count,aptCount);

                                RegPatient.countDocuments({"stage1.isInQueue" : true, "stage2.outTime.isGone" : true , "stage3.isGone" : false, "_id":{$lt : patientStatus._id}},function(err,count1){
                                    currentUserStatus.billAhead= count1;
                                    currentUserStatus.billAvg = count1 * algoData.billAvg;

                                    RegPatient.countDocuments({"stage1.isInQueue" : true, "stage3.isGone" : true, "stage4.isGone" : false, "_id":{$lt : patientStatus._id}},function(err,count2){
                                        currentUserStatus.mediAhead= count2;
                                        currentUserStatus.mediAvg = count2 * algoData.mediAvg;
        
                                        if(currentUserStatus.registrationTime != null){
                                            currentUserStatus.registrationTime = currentUserStatus.registrationTime.toString();
                                        }else{
                                            currentUserStatus.registrationTime = "Not Available";
                                        }
                                
                                        if(currentUserStatus.consultationInTime != null){
                                            currentUserStatus.consultationInTime = currentUserStatus.consultationInTime.toString();
                                        }else{
                                            currentUserStatus.consultationInTime = "Not Available";
                                        }
                                
                                        if(currentUserStatus.consultationOutTime != null){
                                            currentUserStatus.consultationOutTime = currentUserStatus.consultationOutTime.toString();
                                            currentUserStatus.billingInTime = currentUserStatus.billingInTime.toString();
                                        }else{
                                            currentUserStatus.consultationOutTime = "Not Available";
                                            currentUserStatus.billingInTime = "Not Available";
                                        }
                                
                                        if(currentUserStatus.billingOutTime != null){
                                            currentUserStatus.billingOutTime = currentUserStatus.billingOutTime.toString();
                                            currentUserStatus.medicineInTime = currentUserStatus.medicineInTime.toString();
                                        }else{
                                            currentUserStatus.billingOutTime = "Not Available";
                                            currentUserStatus.medicineInTime = "Not Available";
                                        }
                                
                                        if(currentUserStatus.medicineOutTime != null){
                                            currentUserStatus.medicineOutTime = currentUserStatus.medicineOutTime.toString();
                                        }else{
                                            currentUserStatus.medicineOutTime = "Not Available";
                                        }
                                    });
                                });
                            });
                        });
                    }
                });  

        }else{
            currentUserStatus = null;
        }
    });

    return currentUserStatus;
}    

module.exports = calculate;





// var Patient               = require("./models/patient");
// var RegPatient            = require("./models/regPatient");
// var AlgoData              = require("./models/algoData");
// var Appointment          = require("./models/appointment");
// var timespan              = require("timespan");

// currentUserStatus = {};
// var algoData;
// async function initializeAlgoData (){

//      //intialize algo data
//      await AlgoData.find({},function(err, algoDatas){
//         if(err){
//             console.log(err);
//         }else{
//             if(algoDatas.length==0){
//                 AlgoData.create({key : 1},function(err,f){});
            
//             }
//         }
//     });
    
//     await AlgoData.findOne({},function(err, foundOne){
//         if(err){
//             console.log(err);
//         }else{
//             algoData = foundOne;
//         }
//     });

// }

// async function determineConsult(patientStatus,callback){
//     var wait=0;
//     var count=0;
//     await RegPatient.find({
//         "stage1.isInQueue" : true,
//         "stage1.date" : {$ne : null},
//         "stage2.outTime.isGone" : false,
//         "_id" : {$lt : patientStatus._id},
//     },function(err,foundOne){
//         if(err){
//             console.log(err);
//         }
//         else{
//             foundOne.forEach(thisOne => {
//                 if(thisOne!=null){
//                     wait = wait + algoData.consultAvg[thisOne.reason];
//                     count++;
//                 }
//             });
//         }
//     });
//     var day = new Date(Date.now());
//     var today = new Date(day.getFullYear(),day.getMonth(),day.getDate());
//     var apts;
//     await Appointment.find({"onlyDate" : today},function(err,foundApts){
//         if(err){
//             console.log(err);
//         }
//         else{
//             apts = foundApts;
//         }
//     });
//     apts.sort(function compare(a,b){
//         return (a._id-b._id);
//     });
//     var sDt = Math.round(Date.now()/1000);
//     var eDt = sDt+wait;
//     var aptWait = 0;
//     var aptCount = 0;
//     console.log(apts);
//     for(var i=0;i<apts.length;i++)
//     {
//         var start = apts[i].date.getTime();
//         start = Math.round(start/1000);
//         var end = start+30*60;
//         console.log(start,end,sDt,eDt);
//         if((start>=sDt && start<=eDt) || (end>=sDt && end<=eDt) || (start<=sDt && end>=eDt)){
//             aptWait = aptWait + algoData.consultAvg[apts[i].type];
//             aptCount++;
//         }
//         else{
//             break;
//         }
//     }
//     await RegPatient.findOne({
//         "stage2.isActive" : true,
//         "stage1.isInQueue":true,
//         "stage2.outTime.isGone" : false
//         },async function(err, foundOne){
//             if(err){
//                 console.log(err);
//             }
//             else if(foundOne!=null){
//                 var currentDate = new Date(Date.now());
//                 var ts = timespan.fromDates(foundOne.stage2.inTime.date,currentDate,true);
//                 var sec = ts.totalSeconds();
//                 if(sec<algoData.consultAvg[foundOne.reason]){
//                     wait = wait - sec;
//                 }
//                 else{
//                     wait = wait - algoData.consultAvg[foundOne.reason];
//                 }
//         }
//     });
//     if(wait<60){
//             wait = 60;
//     }
//     currentUserStatus.consultAhead = count;
//     currentUserStatus.consultAvg = wait + aptWait;
//     console.log(wait,aptWait,count,aptCount);
//     callback();
// }

// async function calculate(patient, patientStatus){
    
//     await initializeAlgoData();

//     if(patientStatus!=null){
//         currentUserStatus.name = patientStatus.name;
//         currentUserStatus.token = patientStatus.token;
//         currentUserStatus.registrationTime = patientStatus.stage1.date;
//         currentUserStatus.consultationInTime = patientStatus.stage2.inTime.date;
//         currentUserStatus.consultationOutTime = patientStatus.stage2.outTime.date;
//         currentUserStatus.billingInTime = patientStatus.stage3.activeDate;
//         currentUserStatus.billingOutTime = patientStatus.stage3.date;
//         currentUserStatus.medicineInTime = patientStatus.stage4.activeDate;
//         currentUserStatus.medicineOutTime = patientStatus.stage4.date;
//         currentUserStatus.consultAhead = 0;
//         currentUserStatus.mediAhead = 0;
//         currentUserStatus.billAhead = 0;
//         currentUserStatus.consultAvg = 0;
//         currentUserStatus.billAvg = 0;
//         currentUserStatus.mediAvg = 0;


//         //preet
//         //patients ahead in consultation
//     await determineConsult(patientStatus,async function(){
//         //patients ahead in billing
//         await RegPatient.countDocuments({"stage1.isInQueue" : true, "stage2.outTime.isGone" : true , "stage3.isGone" : false, "_id":{$lt : patientStatus._id}},function(err,count){
//             currentUserStatus.billAhead= count;
//             currentUserStatus.billAvg = count * algoData.billAvg;
//         });
//         //patients ahead in medicine
//         await RegPatient.countDocuments({"stage1.isInQueue" : true, "stage3.isGone" : true, "stage4.isGone" : false, "_id":{$lt : patientStatus._id}},function(err,count){
//             currentUserStatus.mediAhead= count;
//             currentUserStatus.mediAvg = count * algoData.mediAvg;
//         });

//         if(currentUserStatus.registrationTime != null){
//             currentUserStatus.registrationTime = currentUserStatus.registrationTime.toString();
//         }else{
//             currentUserStatus.registrationTime = "Not Available";
//         }

//         if(currentUserStatus.consultationInTime != null){
//             currentUserStatus.consultationInTime = currentUserStatus.consultationInTime.toString();
//         }else{
//             currentUserStatus.consultationInTime = "Not Available";
//         }

//         if(currentUserStatus.consultationOutTime != null){
//             currentUserStatus.consultationOutTime = currentUserStatus.consultationOutTime.toString();
//             currentUserStatus.billingInTime = currentUserStatus.billingInTime.toString();
//         }else{
//             currentUserStatus.consultationOutTime = "Not Available";
//             currentUserStatus.billingInTime = "Not Available";
//         }

//         if(currentUserStatus.billingOutTime != null){
//             currentUserStatus.billingOutTime = currentUserStatus.billingOutTime.toString();
//             currentUserStatus.medicineInTime = currentUserStatus.medicineInTime.toString();
//         }else{
//             currentUserStatus.billingOutTime = "Not Available";
//             currentUserStatus.medicineInTime = "Not Available";
//         }

//         if(currentUserStatus.medicineOutTime != null){
//             currentUserStatus.medicineOutTime = currentUserStatus.medicineOutTime.toString();
//         }else{
//             currentUserStatus.medicineOutTime = "Not Available";
//         }
//     });
   
//     }else{
//         currentUserStatus = null;
//     }

//     return currentUserStatus;

// }    

// module.exports = calculate;