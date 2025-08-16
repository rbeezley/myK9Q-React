import '../database.dart';

class TblTrialQueueTable extends SupabaseTable<TblTrialQueueRow> {
  @override
  String get tableName => 'tbl_trial_queue';

  @override
  TblTrialQueueRow createRow(Map<String, dynamic> data) =>
      TblTrialQueueRow(data);
}

class TblTrialQueueRow extends SupabaseDataRow {
  TblTrialQueueRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblTrialQueueTable();

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

  int get classTotalCount => getField<int>('class_total_count')!;
  set classTotalCount(int value) => setField<int>('class_total_count', value);

  int get entryTotalCount => getField<int>('entry_total_count')!;
  set entryTotalCount(int value) => setField<int>('entry_total_count', value);

  int get classCompletedCount => getField<int>('class_completed_count')!;
  set classCompletedCount(int value) =>
      setField<int>('class_completed_count', value);

  int get entryCompletedCount => getField<int>('entry_completed_count')!;
  set entryCompletedCount(int value) =>
      setField<int>('entry_completed_count', value);

  String? get clubname => getField<String>('clubname');
  set clubname(String? value) => setField<String>('clubname', value);

  int? get trialid => getField<int>('trialid');
  set trialid(int? value) => setField<int>('trialid', value);

  String? get org => getField<String>('org');
  set org(String? value) => setField<String>('org', value);

  String? get appVersion => getField<String>('app_version');
  set appVersion(String? value) => setField<String>('app_version', value);

  int get classPendingCount => getField<int>('class_pending_count')!;
  set classPendingCount(int value) =>
      setField<int>('class_pending_count', value);

  int get entryPendingCount => getField<int>('entry_pending_count')!;
  set entryPendingCount(int value) =>
      setField<int>('entry_pending_count', value);

  int? get showidFk => getField<int>('showid_fk');
  set showidFk(int? value) => setField<int>('showid_fk', value);

  String? get trialType => getField<String>('trial_type');
  set trialType(String? value) => setField<String>('trial_type', value);
}
