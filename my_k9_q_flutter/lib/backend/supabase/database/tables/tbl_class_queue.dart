import '../database.dart';

class TblClassQueueTable extends SupabaseTable<TblClassQueueRow> {
  @override
  String get tableName => 'tbl_class_queue';

  @override
  TblClassQueueRow createRow(Map<String, dynamic> data) =>
      TblClassQueueRow(data);
}

class TblClassQueueRow extends SupabaseDataRow {
  TblClassQueueRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblClassQueueTable();

  int get id => getField<int>('id')!;
  set id(int value) => setField<int>('id', value);

  DateTime get createdAt => getField<DateTime>('created_at')!;
  set createdAt(DateTime value) => setField<DateTime>('created_at', value);

  String get mobileAppLicKey => getField<String>('mobile_app_lic_key')!;
  set mobileAppLicKey(String value) =>
      setField<String>('mobile_app_lic_key', value);

  String get trialDate => getField<String>('trial_date')!;
  set trialDate(String value) => setField<String>('trial_date', value);

  String get trialNumber => getField<String>('trial_number')!;
  set trialNumber(String value) => setField<String>('trial_number', value);

  String get element => getField<String>('element')!;
  set element(String value) => setField<String>('element', value);

  String get level => getField<String>('level')!;
  set level(String value) => setField<String>('level', value);

  String get judgeName => getField<String>('judge_name')!;
  set judgeName(String value) => setField<String>('judge_name', value);

  int get entryPendingCount => getField<int>('entry_pending_count')!;
  set entryPendingCount(int value) =>
      setField<int>('entry_pending_count', value);

  int get entryCompletedCount => getField<int>('entry_completed_count')!;
  set entryCompletedCount(int value) =>
      setField<int>('entry_completed_count', value);

  int get entryTotalCount => getField<int>('entry_total_count')!;
  set entryTotalCount(int value) => setField<int>('entry_total_count', value);

  int get classOrder => getField<int>('class_order')!;
  set classOrder(int value) => setField<int>('class_order', value);

  bool get classCompleted => getField<bool>('class_completed')!;
  set classCompleted(bool value) => setField<bool>('class_completed', value);

  String get section => getField<String>('section')!;
  set section(String value) => setField<String>('section', value);

  String? get timeLimit => getField<String>('time_limit');
  set timeLimit(String? value) => setField<String>('time_limit', value);

  String? get timeLimit2 => getField<String>('time_limit2');
  set timeLimit2(String? value) => setField<String>('time_limit2', value);

  String? get timeLimit3 => getField<String>('time_limit3');
  set timeLimit3(String? value) => setField<String>('time_limit3', value);

  int get inProgress => getField<int>('in_progress')!;
  set inProgress(int value) => setField<int>('in_progress', value);

  int? get classid => getField<int>('classid');
  set classid(int? value) => setField<int>('classid', value);

  int? get trialidFk => getField<int>('trialid_fk');
  set trialidFk(int? value) => setField<int>('trialid_fk', value);

  int? get areas => getField<int>('areas');
  set areas(int? value) => setField<int>('areas', value);

  bool? get selfCheckin => getField<bool>('self_checkin');
  set selfCheckin(bool? value) => setField<bool>('self_checkin', value);

  bool? get realtimeResults => getField<bool>('realtime_results');
  set realtimeResults(bool? value) => setField<bool>('realtime_results', value);

  int? get classStatus => getField<int>('class_status');
  set classStatus(int? value) => setField<int>('class_status', value);

  String? get classStatusComment => getField<String>('class_status_comment');
  set classStatusComment(String? value) =>
      setField<String>('class_status_comment', value);

  int? get showidFk => getField<int>('showid_fk');
  set showidFk(int? value) => setField<int>('showid_fk', value);

  int get classAbsentCount => getField<int>('class_absent_count')!;
  set classAbsentCount(int value) => setField<int>('class_absent_count', value);

  int get classOtherCount => getField<int>('class_other_count')!;
  set classOtherCount(int value) => setField<int>('class_other_count', value);

  int get classQualifiedCount => getField<int>('class_qualified_count')!;
  set classQualifiedCount(int value) =>
      setField<int>('class_qualified_count', value);

  int get classNqCount => getField<int>('class_nq_count')!;
  set classNqCount(int value) => setField<int>('class_nq_count', value);

  int get classExCount => getField<int>('class_ex_count')!;
  set classExCount(int value) => setField<int>('class_ex_count', value);
}
