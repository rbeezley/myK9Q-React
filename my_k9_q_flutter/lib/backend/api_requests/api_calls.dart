import 'dart:convert';
import 'package:flutter/foundation.dart';

import '/flutter_flow/flutter_flow_util.dart';
import 'api_manager.dart';

export 'api_manager.dart' show ApiCallResponse;

const _kPrivateApiFunctionName = 'ffPrivateApiCall';

class UnusedGetJWTCall {
  static Future<ApiCallResponse> call({
    String? username = '',
    String? password = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused Get JWT',
      apiUrl: 'https://ja.oksills.com/wp-json/jwt-auth/v1/token',
      callType: ApiCallType.POST,
      headers: {},
      params: {
        'username': username,
        'password': password,
      },
      bodyType: BodyType.X_WWW_FORM_URL_ENCODED,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class GetClassEntryCountsNewCall {
  static Future<ApiCallResponse> call({
    String? id = 'eq.0',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'GetClassEntryCountsNew',
      apiUrl:
          'https://ggreahsjqzombkvagxle.supabase.co/rest/v1/tbl_class_queue',
      callType: ApiCallType.GET,
      headers: {
        'apikey':
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
        'Authorization':
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
      },
      params: {
        'select':
            "id, entry_pending_count, entry_completed_count, entry_total_count",
        'id': id,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static int? id(dynamic response) => castToType<int>(getJsonField(
        response,
        r'''$[:].id''',
      ));
  static int? entrypendingcount(dynamic response) =>
      castToType<int>(getJsonField(
        response,
        r'''$[:].entry_pending_count''',
      ));
  static int? entrycompletedcount(dynamic response) =>
      castToType<int>(getJsonField(
        response,
        r'''$[:].entry_completed_count''',
      ));
  static int? entrytotalcount(dynamic response) => castToType<int>(getJsonField(
        response,
        r'''$[:].entry_total_count''',
      ));
}

class UnusedGetTrialNumbersCall {
  static Future<ApiCallResponse> call({
    String? org = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetTrialNumbers',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/trialnumbers/',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'org': org,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedGetJudgeNumbersCall {
  static Future<ApiCallResponse> call({
    String? org = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetJudgeNumbers',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/judgenumbers/',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'org': org,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedGetClassEntryCountsSectionCall {
  static Future<ApiCallResponse> call({
    String? id = 'eq.0',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetClassEntryCountsSection',
      apiUrl:
          'https://ggreahsjqzombkvagxle.supabase.co/rest/v1/tbl_class_queue',
      callType: ApiCallType.GET,
      headers: {
        'apikey':
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
        'Authorization':
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
      },
      params: {
        'select':
            "id, entry_pending_count, entry_completed_count, entry_total_count",
        'id': id,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static int? id(dynamic response) => castToType<int>(getJsonField(
        response,
        r'''$[:].id''',
      ));
  static int? entrypendingcount(dynamic response) =>
      castToType<int>(getJsonField(
        response,
        r'''$[:].entry_pending_count''',
      ));
  static int? entrycompletedcount(dynamic response) =>
      castToType<int>(getJsonField(
        response,
        r'''$[:].entry_completed_count''',
      ));
  static int? entrytotalcount(dynamic response) => castToType<int>(getJsonField(
        response,
        r'''$[:].entry_total_count''',
      ));
}

class UnusedGetClassCountCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? trialdate = '',
    String? trialnumber = '',
    String? judgename = '',
    String? clubname = '',
    String? classstatus = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetClassCount',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/classcount/',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'org': org,
        'trialdate': trialdate,
        'trialnumber': trialnumber,
        'judgename': judgename,
        'clubname': clubname,
        'classstatus': classstatus,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class GetAppLoginCall {
  static Future<ApiCallResponse> call({
    String? pincode = 'ab',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'GetAppLogin',
      apiUrl:
          'https://ggreahsjqzombkvagxle.supabase.co/rest/v1/view_unique_mobile_app_lic_key',
      callType: ApiCallType.GET,
      headers: {
        'apikey':
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
        'Authorization':
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
      },
      params: {
        'select': "mobile_app_lic_key, clubname, org, app_version, showtype",
        'mobile_app_lic_key': pincode,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static String? clubname(dynamic response) => castToType<String>(getJsonField(
        response,
        r'''$[:].clubname''',
      ));
  static String? mobileapplickey(dynamic response) =>
      castToType<String>(getJsonField(
        response,
        r'''$[:].mobile_app_lic_key''',
      ));
  static String? org(dynamic response) => castToType<String>(getJsonField(
        response,
        r'''$[:].org''',
      ));
  static String? appversion(dynamic response) =>
      castToType<String>(getJsonField(
        response,
        r'''$[:].app_version''',
      ));
  static String? showtype(dynamic response) => castToType<String>(getJsonField(
        response,
        r'''$[:].showtype''',
      ));
}

class UnusedGetEntryClassValuesCall {
  static Future<ApiCallResponse> call({
    String? classid = 'eq.0',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetEntryClassValues',
      apiUrl:
          'https://ggreahsjqzombkvagxle.supabase.co/rest/v1/tbl_class_queue',
      callType: ApiCallType.GET,
      headers: {
        'apikey':
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
        'Authorization':
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
      },
      params: {
        'select': "classid, judge_name, entry_total_count",
        'classid': classid,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static String? judgename(dynamic response) => castToType<String>(getJsonField(
        response,
        r'''$[:].judge_name''',
      ));
  static int? entrytotalcount(dynamic response) => castToType<int>(getJsonField(
        response,
        r'''$[:].entry_total_count''',
      ));
  static dynamic classid(dynamic response) => getJsonField(
        response,
        r'''$[:].classid''',
      );
}

class UnusedGetEntriesCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? trialdate = '',
    String? trialnumber = '',
    String? judgename = '',
    String? element = '',
    String? level = '',
    String? scored = '',
    String? clubname = '',
    int? inring,
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetEntries',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/entries/',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'org': org,
        'trialdate': trialdate,
        'trialnumber': trialnumber,
        'judgename': judgename,
        'element': element,
        'level': level,
        'scored': scored,
        'clubname': clubname,
        'inring': inring,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedGetClassEntryCountsCall {
  static Future<ApiCallResponse> call({
    String? mobileAppLicKey = 'eq.0',
    String? trialDate = 'eq.0',
    String? trialNumber = 'eq.0',
    String? element = 'eq.0',
    String? level = 'eq.0',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetClassEntryCounts',
      apiUrl:
          'https://ggreahsjqzombkvagxle.supabase.co/rest/v1/tbl_class_queue',
      callType: ApiCallType.GET,
      headers: {
        'apikey':
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
        'Authorization':
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
      },
      params: {
        'select':
            " entry_pending_count, entry_completed_count, entry_total_count",
        'mobile_app_lic_key': mobileAppLicKey,
        'trial_date': trialDate,
        'trial_number': trialNumber,
        'element': element,
        'level': level,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static int? entrypendingcount(dynamic response) =>
      castToType<int>(getJsonField(
        response,
        r'''$[:].entry_pending_count''',
      ));
  static int? entrycompletedcount(dynamic response) =>
      castToType<int>(getJsonField(
        response,
        r'''$[:].entry_completed_count''',
      ));
  static int? entrytotalcount(dynamic response) => castToType<int>(getJsonField(
        response,
        r'''$[:].entry_total_count''',
      ));
}

class GetTrialClassCountsCall {
  static Future<ApiCallResponse> call({
    String? id = 'eq.0',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'GetTrialClassCounts',
      apiUrl:
          'https://ggreahsjqzombkvagxle.supabase.co/rest/v1/tbl_trial_queue',
      callType: ApiCallType.GET,
      headers: {
        'apikey':
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
        'Authorization':
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
      },
      params: {
        'select': "id, class_pending_count, class_completed_count",
        'id': id,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static dynamic id(dynamic response) => getJsonField(
        response,
        r'''$[:].id''',
      );
  static dynamic classpendingcount(dynamic response) => getJsonField(
        response,
        r'''$[:].class_pending_count''',
      );
  static dynamic classcompletedcount(dynamic response) => getJsonField(
        response,
        r'''$[:].class_completed_count''',
      );
}

class GetSelfCheckinRealtimeResultsCall {
  static Future<ApiCallResponse> call({
    String? mobileAppLicKey = 'eq.0',
    String? trialDate = 'eq.0',
    String? trialNumber = 'eq.0',
    String? element = 'eq.0',
    String? level = 'eq.0',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'GetSelfCheckinRealtimeResults',
      apiUrl:
          'https://ggreahsjqzombkvagxle.supabase.co/rest/v1/tbl_class_queue',
      callType: ApiCallType.GET,
      headers: {
        'Authorization':
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
        'apikey':
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI',
      },
      params: {
        'select': "self_checkin, realtime_results",
        'mobile_app_lic_key': mobileAppLicKey,
        'trial_date': trialDate,
        'trial_number': trialNumber,
        'element': element,
        'level': level,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static bool? realtimeresults(dynamic response) =>
      castToType<bool>(getJsonField(
        response,
        r'''$[:].realtime_results''',
      ));
  static bool? selfcheckin(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$[:].self_checkin''',
      ));
}

class UnusedPutScoreCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? entryfk = '',
    String? area1 = '',
    String? area2 = '',
    String? area3 = '',
    String? area4 = '',
    String? result = '',
    String? nqreason = '',
    String? exreason = '',
    String? wdreason = '',
    String? faulthe = '',
    String? faultsc = '',
    String? faultds = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused PutScore',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/score',
      callType: ApiCallType.PUT,
      headers: {},
      params: {},
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedGetTrialsCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? role = '',
    String? passcode = '',
    String? trialstatus = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetTrials',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/trials/',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'org': org,
        'role': role,
        'passcode': passcode,
        'trialstatus': trialstatus,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedGetJudgesCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? clubname = '',
    String? trialdate = '',
    String? trialnumber = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetJudges',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/judges/',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'org': org,
        'clubname': clubname,
        'trialdate': trialdate,
        'trialnumber': trialnumber,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedPUTStatusCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? entryfk = '',
    String? statusvalue = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused PUTStatus',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/status',
      callType: ApiCallType.PUT,
      headers: {},
      params: {},
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedGetClassDetailsCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? trialdate = '',
    String? trialnumber = '',
    String? element = '',
    String? clubname = '',
    String? level = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetClassDetails',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/classdetails/',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'org': org,
        'trialdate': trialdate,
        'trialnumber': trialnumber,
        'element': element,
        'clubname': clubname,
        'level': level,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedPutTimeLimitsCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? clubname = '',
    String? trialdate = '',
    String? trialnumber = '',
    String? element = '',
    String? level = '',
    String? timelimit = '',
    String? timelimit2 = '',
    String? timelimit3 = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused PutTimeLimits',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/timelimits',
      callType: ApiCallType.PUT,
      headers: {},
      params: {},
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedGetShowSettingsCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? passcode = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetShowSettings',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/showsettings',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'org': org,
        'passcode': passcode,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedGetOrgsCall {
  static Future<ApiCallResponse> call() async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused Get Orgs',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/orgs',
      callType: ApiCallType.GET,
      headers: {},
      params: {},
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedGetLoginCall {
  static Future<ApiCallResponse> call({
    String? passcode = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused Get Login',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/login',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'passcode': passcode,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedGetAllEntriesCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? passcode = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetAllEntries',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/allentries/',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'org': org,
        'passcode': passcode,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedPUTInRingCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? entryfk = '',
    String? inring = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused PUT InRing',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/inring',
      callType: ApiCallType.PUT,
      headers: {},
      params: {},
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedGetAnncListCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? passcode = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused GetAnncList',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/annclist',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'org': org,
        'passcode': passcode,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedPostAnncCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? passcode = '',
    String? subject = '',
    String? body = '',
    String? timestamp = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused PostAnnc',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/annccreate',
      callType: ApiCallType.POST,
      headers: {},
      params: {
        'subject': subject,
        'body': body,
        'org': org,
        'passcode': passcode,
        'timestamp': timestamp,
      },
      bodyType: BodyType.X_WWW_FORM_URL_ENCODED,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedDeleteAnncEntryCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? passcode = '',
    String? timestamp = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused DeleteAnncEntry',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/anncdelete',
      callType: ApiCallType.DELETE,
      headers: {},
      params: {
        'org': org,
        'passcode': passcode,
        'timestamp': timestamp,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedPutUnScoreCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? entryfk = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused PutUnScore',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/unscore/',
      callType: ApiCallType.PUT,
      headers: {},
      params: {},
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UnusedPUTRunOrderCall {
  static Future<ApiCallResponse> call({
    String? org = '',
    String? moveentrysbfk = '',
    String? toentrysbfk = '',
    String? placeafter = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Unused PUTRunOrder',
      apiUrl: 'https://ja.oksills.com/wp-json/upitsJA_API/v1/runorder/',
      callType: ApiCallType.PUT,
      headers: {},
      params: {},
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class ApiPagingParams {
  int nextPageNumber = 0;
  int numItems = 0;
  dynamic lastResponse;

  ApiPagingParams({
    required this.nextPageNumber,
    required this.numItems,
    required this.lastResponse,
  });

  @override
  String toString() =>
      'PagingParams(nextPageNumber: $nextPageNumber, numItems: $numItems, lastResponse: $lastResponse,)';
}

String _toEncodable(dynamic item) {
  return item;
}

String _serializeList(List? list) {
  list ??= <String>[];
  try {
    return json.encode(list, toEncodable: _toEncodable);
  } catch (_) {
    if (kDebugMode) {
      print("List serialization failed. Returning empty list.");
    }
    return '[]';
  }
}

String _serializeJson(dynamic jsonVar, [bool isList = false]) {
  jsonVar ??= (isList ? [] : {});
  try {
    return json.encode(jsonVar, toEncodable: _toEncodable);
  } catch (_) {
    if (kDebugMode) {
      print("Json serialization failed. Returning empty json.");
    }
    return isList ? '[]' : '{}';
  }
}
