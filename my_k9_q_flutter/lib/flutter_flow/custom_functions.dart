import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'lat_lng.dart';
import 'place.dart';
import 'uploaded_file.dart';
import '/backend/supabase/supabase.dart';

bool elementImageCompare(
  String? theElement,
  String? whichElement,
) {
  return theElement == whichElement;
}

bool useThisArea(
  int? whichArea,
  String? theElement,
  String? theLevel,
) {
  int areaCount = theAreaCount(theElement, theLevel);
  return whichArea! <= areaCount;
  //var useIt = false;
  //switch (whichArea) {
//    case 2:
  //    if ((theElement == 'Interior') &&
  //        ((theLevel == 'Excellent') || (theLevel == 'Master'))) {
  //      useIt = true;
  //    } else if ((theElement == 'Handler Discrimination') &&
  //        (theLevel == 'Master')) {
  //      useIt = true;
  //    }
  //    break;
  //  case 3:
  //    useIt =
  //        ((theElement == 'Interior') && (theLevel == 'Master')) ? true : false;
  //    break;
  //  default:
  //    useIt = false;
  //}
  //return useIt;
}

bool isAreaValid(
  String? theAreaValue,
  bool? isAreaVisible,
  bool? isStopwatch,
) {
  if ((!isAreaVisible!)) return true;

  if (theAreaValue!.length != (isStopwatch! ? 8 : 5)) return false;

  final numericRegExp = (isStopwatch)
      ? RegExp(r'^[0-9][0-9]:[0-9][0-9]\.[0-9][0-9]$')
      : RegExp(r'^[0-9][0-9]:[0-9][0-9]$');
  return numericRegExp.hasMatch(theAreaValue);
}

bool checkRole(
  String? currentRole,
  String? testRole,
) {
  if ((currentRole == null) || currentRole.isEmpty) {
    return false;
  }
  if ((testRole == null) || testRole.isEmpty) {
    return false;
  }

  return (currentRole.toLowerCase() == testRole.toLowerCase()) ? true : false;
}

int theAreaCount(
  String? theElement,
  String? theLevel,
) {
  // Validate Arguments
  if (theElement == null || theElement.isEmpty) return 1;
  if (theLevel == null || theLevel.isEmpty) return 1;

  // Determine Area Count
  if (theElement == "Interior") {
    if (theLevel == "Excellent") return 2;
    if (theLevel == "Master") return 3;
    return 1;
  }

  if ((theElement == "Handler Discrimination") && (theLevel == "Master"))
    return 2;

  return 1;
}

int theNextArea(
  int? areaCount,
  int? areaCurrent,
) {
  // Check Args
  if (areaCount == null || areaCount < 1 || areaCount > 3) return 1;
  if (areaCurrent == null || areaCurrent < 1 || areaCurrent > 3) return 1;

  // Next Area
  var nextArea = areaCurrent + 1;

  return (nextArea > areaCount) ? 1 : nextArea;
}

bool isStopwatchAreaValid(
  String? theAreaValue,
  bool? isAreaVisible,
  String? theResult,
) {
  if (theResult != 'Qualified') return true;

  return isAreaValid(theAreaValue, isAreaVisible, true);
}

bool isMaxTimeValid(
  String? theElement,
  String? theLevel,
  String? theMaxTime,
  int? whichTime,
) {
//import 'package:my_k9_a/app_state.dart';  Put up at top
  // First check to see if this can be edited
  if (!isMaxTimeEditable(theElement, theLevel)) return true;

  // Next Check to see if this Time allowed for Class (Element + Level)
  if (!useThisArea(whichTime, theElement, theLevel)) return true;

  // Next check to see if we have a valid time value
  if (!isAreaValid(theMaxTime, true, false)) {
    //FFAppState().lclInvalidMaxTimeMessage =
    //  "Area ${whichTime} Max Time is Invalid. Format is (MM:SS). Four digits with a colon separator.";
    return false;
  }

  // Now the hard part -- Actually check the time -- We know it is correct format MM:SS
  var maxTimeParts = theMaxTime!.split(':');
  Duration maxTimeDuration = Duration(
      minutes: int.parse(maxTimeParts[0]), seconds: int.parse(maxTimeParts[1]));

  // Min and Max Minutes determined by Class (Element and Level)
  int minMM;
  int maxMM;

  switch (theElement) {
    case "Interior":
      minMM = 1;
      maxMM = 3;
      break;
    case "Exterior":
      if ((theLevel == 'Novice') || (theLevel == 'Advanced')) {
        minMM = 2;
        maxMM = 4;
      } else {
        minMM = 3;
        maxMM = 5;
      }
      break;
    case 'Handler Discrimination':
      switch (theLevel) {
        case 'Advanced':
          minMM = 2;
          maxMM = 5;
          break;
        case 'Excellent':
          minMM = 3;
          maxMM = 6;
          break;
        case 'Master':
        default:
          minMM = 2;
          maxMM = 3;
          break;
      }
      break;
    case 'Detective':
    default:
      minMM = 7;
      maxMM = 15;
      break;
  }

  if ((maxTimeDuration.compareTo(Duration(minutes: minMM)) < 0) ||
      (maxTimeDuration.compareTo(Duration(minutes: maxMM)) > 0)) {
    // Time not within required Min and Max
    // FFAppState().lclInvalidMaxTimeMessage =
    // "Area ${whichTime} Max Time is Invalid. Must be between ${minMM} and ${maxMM} minutes.";
    return false;
  }

  return true;
}

bool isMaxTimeEditable(
  String? theElement,
  String? theLevel,
) {
  // JLS Uncomment if (FFAppState().lclOrg == 'UKC Nosework') return false;

  String theRole = ''; // JLS Uncomment FFAppState().lclRole;
  if ((theRole.toLowerCase() == 'Exhibitor'.toLowerCase()) ||
      (theRole.toLowerCase() == 'Steward'.toLowerCase())) return false;
  switch (theElement) {
    case 'Interior':
    case 'Exterior':
    case 'Detective':
      return true;
    case 'Handler Discrimination':
      return (theLevel == 'Novice') ? false : true;
    default:
      break;
  }

  return false;
}

bool searchClasses(
  String? theSearchString,
  String? theStr1,
  String? theStr2,
  String? theStr3,
) {
  if ((theSearchString == null) || (theSearchString.isEmpty)) return true;

  String theSearch = theSearchString.toLowerCase();

  String? theStr;

  for (int ndx = 0; ndx < 3; ndx++) {
    switch (ndx) {
      case 0:
        theStr = theStr1;
        break;
      case 1:
        theStr = theStr2;
        break;
      case 2:
      default:
        theStr = theStr3;
        break;
    }
    if ((theStr != null) && (!theStr.isEmpty)) {
      if (theStr.toLowerCase().contains(theSearch)) return true;
    }
  }

  return false;
}

bool isTimeLimitSet(
  String? theAreaCount,
  String? area1TimeLimit,
  String? area2TimeLimit,
  String? area3TimeLimit,
) {
  if (theAreaCount == null ||
      area1TimeLimit == null ||
      area2TimeLimit == null ||
      area3TimeLimit == null) return false;

  int minAreaCount =
      (int.parse(theAreaCount) > 3) ? 3 : int.parse(theAreaCount);
  String theTimeLimit;
  for (int ndx = 0; ndx < minAreaCount; ndx++) {
    switch (ndx) {
      case 0:
        theTimeLimit = area1TimeLimit;
        break;
      case 1:
        theTimeLimit = area2TimeLimit;
        break;
      case 2:
      default:
        theTimeLimit = area3TimeLimit;
    }
    if (theTimeLimit.trim() == ':') return false;
    if (int.parse(theTimeLimit.replaceAll(':', '')) == 0) return false;
  }

  return true;
}

String? parseJudgeCode(String theKey) {
  // function to parse characters 8 thru 12 from a string and store in a vaible names AdminPassCode
  String mobileAppLicKey = theKey;
  String? judgePassCode;

  try {
    judgePassCode = mobileAppLicKey.substring(11, 15);
  } catch (e) {
    print('Error parsing mobile app license key: $e');
  }

  return 'j$judgePassCode';
}

String? parseStewardCode(String theKey) {
  // function to parse characters 8 thru 12 from a string and store in a vaible names AdminPassCode
  String mobileAppLicKey = theKey;
  String? stewardPassCode;

  try {
    stewardPassCode = mobileAppLicKey.substring(16, 20);
  } catch (e) {
    print('Error parsing mobile app license key: $e');
  }

  return 's$stewardPassCode';
}

String? parseExhibitorCode(String theKey) {
  // function to parse characters 8 thru 12 from a string and store in a vaible names AdminPassCode
  String mobileAppLicKey = theKey;
  String? exhibitorPassCode;

  try {
    exhibitorPassCode = mobileAppLicKey.substring(25, 29);
  } catch (e) {
    print('Error parsing mobile app license key: $e');
  }

  return 'e$exhibitorPassCode';
}

bool isImageNumber(
  String theTrialDate,
  String theTrialNumber,
  int theImageNumber,
) {
  // Used to hold the parts of Trial Date and Trial Number
  List<String> theParts;

  // Process theTrialDate (format: DOW Date)
  theParts = theTrialDate.trim().toLowerCase().split(',');
  int datePartNumber = 0;
  switch (theParts[0]) {
    case 'friday':
      datePartNumber = 0;
      break;
    case 'saturday':
      datePartNumber = 2;
      break;
    case 'sunday':
      datePartNumber = 4;
      break;
    default:
      datePartNumber = 6;
  }

  // Process theTrialNumber (format Trial 1)
  int trialPartNumber =
      (theTrialNumber.trim().toLowerCase().endsWith('1')) ? 1 : 2;

  // Return the Image Number
  return (datePartNumber + trialPartNumber) == theImageNumber;
}

String? getAnncTimestamp() {
  // Return the current date and time in a specific format
  DateTime dateTime = DateTime.now();
  String timestamp = DateFormat('yyyy-MM-dd HH:mm:ss')
      .format(dateTime); //timestamp remove '.S', hh: ss; hh: mm:ss
  return timestamp;
}

String formatAnncTimestamp(String dbTimeStamp) {
  var dateRecorded = DateTime.parse(dbTimeStamp);
  return DateFormat('M/d - h:mm a').format(dateRecorded);
}

bool exitApp() {
  // JLS Add the following 2 includes
  // import 'dart:io';
  // import 'package:flutter_exit_app/flutter_exit_app.dart';

  // JLS Uncomment if (Platform.isIOS) {
  // force exit in ios
  // JLS Uncomment  FlutterExitApp.exitApp(iosForceExit: true);
  // JLS Uncomment } else {
  // call this to exit app
  // JLS Uncomment  FlutterExitApp.exitApp();
  // JLS Uncomment }
  return true;
}

String getPlacementText(int theIntPlacement) {
  switch (theIntPlacement) {
    case 0:
      return '--';
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
    case 9995: // Excluded
      return 'EXL';
    case 9996: // NQ
      return 'NQ';
    case 9997: // Absent
      return 'AB';
    case 9998: // Excused
      return 'EX';
    case 9999: // Withdrawn
      return 'WD';
    case 10000: // Disqualified
      return 'DQ';
    case 10001: // Completed
      return '--';
    default:
      return '${theIntPlacement.toString()}th';
  }
}

Color getPlacementColor(
  int theIntPlacement,
  bool isAKC,
) {
  switch (theIntPlacement) {
    case 0:
      return Color(0xFF6C757D);
    case 1:
      return Color(0xFF4B39EF);
    case 2:
      return Color(0xFFFF5963);
    case 3:
      return (isAKC) ? Color(0xFFFFC107) : Color(0xFF4CAF50);
    case 4:
      return (isAKC) ? Color(0xFFFFFFFF) : Color(0xFFFFC107);
    case 5:
      return (isAKC) ? Color(0xFF115014) : Color(0xFF03A9F4);
    case 9995: // Excluded
    case 9996: // NQ
    case 9997: // Absent
    case 9998: // Excused
    case 9999: // Withdrawn
    case 10000: // Disqualified
    case 10001: // Completed
      return Color(0xFF6C757D);
    default:
      return (isAKC) ? Color(0xFF115014) : Color(0xFF03A9F4);
  }
}

String computeTotalSearchTime(
  String? timeArea1,
  String? timeArea2,
  String? timeArea3,
) {
  Duration totalSearchTime =
      Duration(minutes: 0, seconds: 0, milliseconds: 0); // Total search time

  List<String> parts; // Used to parse Area Time

  String? areaTime; // Area time to parse

  int mm; // Minutes
  int ss; // Seconds
  int cs; // Centiseconds

  // Loop through the areas and sum the times (if not null or blank)
  for (int ndx = 0; ndx < 3; ndx++) {
    // Get the current area to work with
    switch (ndx) {
      case 0:
        areaTime = timeArea1;
        break;
      case 1:
        areaTime = timeArea2;
        break;
      case 2:
      default:
        areaTime = timeArea3;
        break;
    }

    // Skip time if null or blank
    if (areaTime == null || areaTime.length == 0) continue;

    // Decode the Area Time and add to running sum
    parts = areaTime.split(':');
    // if (parts.length != 2) continue;
    mm = int.parse(parts[0]);
    parts = parts[1].split('.');
    // if (parts.length != 2) continue;
    ss = int.parse(parts[0]);
    cs = int.parse(parts[1]);

    // Add this area to running sum
    totalSearchTime +=
        Duration(minutes: mm, seconds: ss, milliseconds: cs * 10);
  }

  // Handy function to convert integer to string left padding to length of 2
  String twoDigits(int n) => n.toString().padLeft(2, "0");

  String twoDigitMM = twoDigits(totalSearchTime.inMinutes.remainder(60));
  String twoDigitSS = twoDigits(totalSearchTime.inSeconds.remainder(60));
  String twoDigitCS =
      twoDigits(totalSearchTime.inMilliseconds.remainder(1000) ~/ 10);

  // Return total time as MM:SS.MS
  return "$twoDigitMM:$twoDigitSS.$twoDigitCS";
}

String? parseAppLogin(String pinCode) {
  // Get Role
  String theRole = pinCode.substring(0, 1);

  // Get Login Code from argument pinCode
  String loginCode = pinCode.substring(1);

  // Build the LIKE match for PIN code
  String likeMatch;
  switch (theRole) {
    case 'a':
      likeMatch = "_______${loginCode}______________________";
      break;
    case 'j':
      likeMatch = "___________${loginCode}__________________";
      break;
    case 's':
      likeMatch = "________________${loginCode}_____________";
      break;
    default:
      likeMatch = "_________________________${loginCode}____";
      break;
  }

  // Example: "like.%f3dc%"
  return "like.${likeMatch}";
}

String? parseAppRole(String pinCode) {
  String roleFlag = pinCode.substring(0, 1).toLowerCase();
  String theRole;
// Convert Role Flag into Role
  switch (roleFlag) {
    case 'a':
      theRole = 'Secretary';
      break;
    case 'j':
      theRole = 'Judge';
      break;
    case 's':
      theRole = 'Steward';
      break;
    case 'e':
    default:
      theRole = 'Exhibitor';
      break;
  }

  // Return the Role
  return theRole;
}

int convertTextTimeToMS(String textTime) {
  // Text time format MM:SS
  List<String> timeParts = textTime.split(':');
  var timeDuration = Duration(
      minutes: int.parse(timeParts[0]), seconds: int.parse(timeParts[1]));

  return timeDuration.inMilliseconds;
}

String? parseAdminCode(String theKey) {
  // function to parse characters 8 thru 12 from a string and store in a vaible names AdminPassCode
  String mobileAppLicKey = theKey;
  String? adminPassCode;

  try {
    adminPassCode = mobileAppLicKey.substring(7, 11);
  } catch (e) {
    print('Error parsing mobile app license key: $e');
  }

  return 'a$adminPassCode';
}

bool loginSuccess(String? mobileAppLicKey) {
  return (mobileAppLicKey == null) ? false : true;
}

double maxTimeProgressBar(
  int areaMS,
  int timerMS,
) {
  var theResult = timerMS.toDouble() / areaMS.toDouble();
  if (theResult < 0.0) theResult = 0.0;
  if (theResult > 1.0) theResult = 1.0;

  return theResult;
}

bool verifyVersion(
  String lclVersion,
  String appVersion,
) {
  return (lclVersion.compareTo(appVersion) >= 0) ? true : false;

  // Using str1.compareTo(str2) method: the method returns a negative value (-1) if str1 is ordered before str2,
  // a positive value (1) if str1 is ordered after str2,
  // or zero if str1 and str2 are
}
