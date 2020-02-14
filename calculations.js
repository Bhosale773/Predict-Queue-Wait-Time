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
            currentUserStatus.isInQueue = true;
            currentUserStatus.registrationTime = patientStatus.stage1.date;
            currentUserStatus.consultationInTime = patientStatus.stage2.inTime.date;
            currentUserStatus.consultationOutTime = patientStatus.stage2.outTime.date;
            currentUserStatus.billingInTime = patientStatus.stage3.activeDate;
            currentUserStatus.billingOutTime = patientStatus.stage3.date;
            currentUserStatus.medicineInTime = patientStatus.stage4.activeDate;
            currentUserStatus.medicineOutTime = patientStatus.stage4.date;
            currentUserStatus.queue_consultation = false;
            currentUserStatus.queue_billing = false;
            currentUserStatus.queue_medicine = false;
            currentUserStatus.queue_consultation_isActive = false;
            currentUserStatus.queue_billing_isActive = false;
            currentUserStatus.queue_medicine_isActive = false;
            currentUserStatus.consultAhead = 0;
            currentUserStatus.mediAhead = 0;
            currentUserStatus.billAhead = 0;
            currentUserStatus.consultWait = 0;
            currentUserStatus.billWait = 0;
            currentUserStatus.mediWait = 0;

            if(patientStatus.stage2.outTime.isGone==false){
                currentUserStatus.queue_consultation = true;
            }else if(patientStatus.stage3.isGone==false){
                currentUserStatus.queue_billing = true;
            }else if(patientStatus.stage4.isGone==false){
                currentUserStatus.queue_medicine = true;
            }

            if(patientStatus.stage2.isActive==true){
                currentUserStatus.queue_consultation_isActive = true;
            }else if(patientStatus.stage3.isActive==true){
                currentUserStatus.queue_billing_isActive = true;
            }else if(patientStatus.stage4.isActive==true){
                currentUserStatus.queue_medicine_isActive = true;
            }
    
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
                                        if(patientStatus.stage2.isActive==false && patientStatus.stage2.outTime.isGone==false){
                                            wait = wait - sec;
                                        }
                                    }
                                    else{
                                        if(patientStatus.stage2.isActive==false && patientStatus.stage2.outTime.isGone==false){
                                            wait = wait - algoData.consultAvg[foundOne.reason];
                                        }
                                    }
                                }
                                if(wait<60 && count!=0){
                                    if(patientStatus.stage2.outTime.isGone==false){
                                        wait = 60;
                                    }
                                }
                                currentUserStatus.consultAhead = count;
                                currentUserStatus.consultWait = wait + aptWait;
                                console.log(wait,aptWait,count,aptCount);

                                RegPatient.countDocuments({"stage1.isInQueue" : true, "stage2.outTime.isGone" : true , "stage3.isGone" : false, "_id":{$lt : patientStatus._id}},function(err,count1){
                                    currentUserStatus.billAhead= count1;
                                    var waitB = count1 * algoData.billAvg;
                                    RegPatient.findOne({
                                        "stage3.isActive" : true,
                                        "stage1.isInQueue":true,
                                        "stage3.isGone" : false
                                        },function(err, found1){
                                            if(err){
                                                console.log(err);
                                            }
                                            else if(found1!=null){
                                                var currentDate = new Date(Date.now());
                                                var ts = timespan.fromDates(found1.stage3.activeDate,currentDate,true);
                                                var sec = ts.totalSeconds();
                                                if(sec<algoData.billAvg){
                                                    if(patientStatus.stage3.isActive==false && patientStatus.stage3.isGone==false){
                                                        waitB = waitB - sec;
                                                    }
                                                }
                                                else{
                                                    if(patientStatus.stage3.isActive==false && patientStatus.stage3.isGone==false){
                                                        waitB = waitB - algoData.billAvg;
                                                    }
                                                }
                                            }

                                            if(waitB<10){
                                                if(patientStatus.stage3.isGone==false && count1!=0){
                                                    waitB = 10;
                                                }
                                            }

                                            currentUserStatus.billWait=waitB;

                                            RegPatient.countDocuments({"stage1.isInQueue" : true, "stage3.isGone" : true, "stage4.isGone" : false, "_id":{$lt : patientStatus._id}},function(err,count2){
                                                currentUserStatus.mediAhead= count2;
                                                var waitM = count2 * algoData.mediAvg;

                                                RegPatient.findOne({
                                                    "stage4.isActive" : true,
                                                    "stage1.isInQueue":true,
                                                    "stage4.isGone" : false
                                                    },function(err, found2){
                                                        if(err){
                                                            console.log(err);
                                                        }
                                                        else if(found2!=null){
                                                            var currentDate = new Date(Date.now());
                                                            var ts = timespan.fromDates(found2.stage4.activeDate,currentDate,true);
                                                            var sec = ts.totalSeconds();
                                                            if(sec<algoData.mediAvg){
                                                                if(patientStatus.stage4.isActive==false && patientStatus.stage4.isGone==false){
                                                                    waitM = waitM - sec;
                                                                }
                                                            }
                                                            else{
                                                                if(patientStatus.stage4.isActive==false && patientStatus.stage4.isGone==false){
                                                                    waitM = waitM - algoData.mediAvg;
                                                                }
                                                            }
                                                        }

                                                        if(waitM<10){
                                                            if(patientStatus.stage4.isGone==false && count2!=0){
                                                                waitM = 10;
                                                            }
                                                        }

                                                        currentUserStatus.mediWait=waitM;
                                                    }
                                                );
                                            });
                                        }
                                    );

                                });
                            });
                        });
                    }
                });  

        }else{

            if(patient!=null){
                currentUserStatus.name = patient.fname+" "+patient.lname;
            }
            currentUserStatus.isInQueue = false;
            currentUserStatus.consultAhead = 0;
            currentUserStatus.mediAhead = 0;
            currentUserStatus.billAhead = 0;
            currentUserStatus.consultWait = 0;
            currentUserStatus.billWait = 0;
            currentUserStatus.mediWait = 0;
    
            var wait=0;
            var count=0;
            RegPatient.find({
                "stage1.isInQueue" : true,
                "stage1.date" : {$ne : null},
                "stage2.outTime.isGone" : false,
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
                                if(wait<60 && count!=0){
                                    wait = 60;
                                }
                                currentUserStatus.consultAhead = count;
                                currentUserStatus.consultWait = wait + aptWait;
                                console.log(wait,aptWait,count,aptCount);

                                RegPatient.countDocuments({"stage1.isInQueue" : true, "stage2.outTime.isGone" : true , "stage3.isGone" : false},function(err,count1){
                                    currentUserStatus.billAhead= count1;
                                    var waitB = count1 * algoData.billAvg;
                                    RegPatient.findOne({
                                        "stage3.isActive" : true,
                                        "stage1.isInQueue":true,
                                        "stage3.isGone" : false
                                        },function(err, found1){
                                            if(err){
                                                console.log(err);
                                            }
                                            else if(found1!=null){
                                                var currentDate = new Date(Date.now());
                                                var ts = timespan.fromDates(found1.stage3.activeDate,currentDate,true);
                                                var sec = ts.totalSeconds();
                                                if(sec<algoData.billAvg){
                                                    waitB = waitB - sec;
                                                }
                                                else{
                                                    waitB = waitB - algoData.billAvg;
                                                }
                                            }

                                            if(waitB<10 && count1!=0){
                                                waitB = 10;
                                            }

                                            currentUserStatus.billWait=waitB;

                                            RegPatient.countDocuments({"stage1.isInQueue" : true, "stage3.isGone" : true, "stage4.isGone" : false},function(err,count2){
                                                currentUserStatus.mediAhead= count2;
                                                var waitM = count2 * algoData.mediAvg;

                                                RegPatient.findOne({
                                                    "stage4.isActive" : true,
                                                    "stage1.isInQueue":true,
                                                    "stage4.isGone" : false
                                                    },function(err, found2){
                                                        if(err){
                                                            console.log(err);
                                                        }
                                                        else if(found2!=null){
                                                            var currentDate = new Date(Date.now());
                                                            var ts = timespan.fromDates(found2.stage4.activeDate,currentDate,true);
                                                            var sec = ts.totalSeconds();
                                                            if(sec<algoData.mediAvg){
                                                                waitM = waitM - sec;
                                                            }
                                                            else{
                                                                waitM = waitM - algoData.mediAvg;
                                                            }
                                                        }

                                                        if(waitM<10 && count2!=0){
                                                            waitM = 10;
                                                        }

                                                        currentUserStatus.mediWait=waitM;
                                                    }
                                                );
                                            });
                                        }
                                    );

                                });
                            });
                        });
                    }
                });
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