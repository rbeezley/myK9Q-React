import '../database.dart';

class ViewEntryClassJoinSectionDistinctTable
    extends SupabaseTable<ViewEntryClassJoinSectionDistinctRow> {
  @override
  String get tableName => 'view_entry_class_join_section_distinct';

  @override
  ViewEntryClassJoinSectionDistinctRow createRow(Map<String, dynamic> data) =>
      ViewEntryClassJoinSectionDistinctRow(data);
}

class ViewEntryClassJoinSectionDistinctRow extends SupabaseDataRow {
  ViewEntryClassJoinSectionDistinctRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => ViewEntryClassJoinSectionDistinctTable();

  int? get id => getField<int>('id');
  set id(int? value) => setField<int>('id', value);

  DateTime? get createdAt => getField<DateTime>('created_at');
  set createdAt(DateTime? value) => setField<DateTime>('created_at', value);

  String? get mobileAppLicKey => getField<String>('mobile_app_lic_key');
  set mobileAppLicKey(String? value) =>
      setField<String>('mobile_app_lic_key', value);

  String? get trialDate => getField<String>('trial_date');
  set trialDate(String? value) => setField<String>('trial_date', value);

  String? get trialNumber => getField<String>('trial_number');
  set trialNumber(String? value) => setField<String>('trial_number', value);

  String? get element => getField<String>('element');
  set element(String? value) => setField<String>('element', value);

  String? get level => getField<String>('level');
  set level(String? value) => setField<String>('level', value);

  String? get section => getField<String>('section');
  set section(String? value) => setField<String>('section', value);

  int? get armband => getField<int>('armband');
  set armband(int? value) => setField<int>('armband', value);

  String? get callName => getField<String>('call_name');
  set callName(String? value) => setField<String>('call_name', value);

  String? get breed => getField<String>('breed');
  set breed(String? value) => setField<String>('breed', value);

  String? get handler => getField<String>('handler');
  set handler(String? value) => setField<String>('handler', value);

  int? get checkinStatus => getField<int>('checkin_status');
  set checkinStatus(int? value) => setField<int>('checkin_status', value);

  String? get resultText => getField<String>('result_text');
  set resultText(String? value) => setField<String>('result_text', value);

  String? get searchTime => getField<String>('search_time');
  set searchTime(String? value) => setField<String>('search_time', value);

  int? get faultCount => getField<int>('fault_count');
  set faultCount(int? value) => setField<int>('fault_count', value);

  int? get exhibitorOrder => getField<int>('exhibitor_order');
  set exhibitorOrder(int? value) => setField<int>('exhibitor_order', value);

  int? get placement => getField<int>('placement');
  set placement(int? value) => setField<int>('placement', value);

  bool? get inRing => getField<bool>('in_ring');
  set inRing(bool? value) => setField<bool>('in_ring', value);

  bool? get isScored => getField<bool>('is_scored');
  set isScored(bool? value) => setField<bool>('is_scored', value);

  String? get trialDateText => getField<String>('trial_date_text');
  set trialDateText(String? value) =>
      setField<String>('trial_date_text', value);

  String? get sectionGrouped => getField<String>('section_grouped');
  set sectionGrouped(String? value) =>
      setField<String>('section_grouped', value);

  int? get runOrder => getField<int>('run_order');
  set runOrder(int? value) => setField<int>('run_order', value);

  String? get reason => getField<String>('reason');
  set reason(String? value) => setField<String>('reason', value);

  String? get areatime1 => getField<String>('areatime1');
  set areatime1(String? value) => setField<String>('areatime1', value);

  String? get areatime2 => getField<String>('areatime2');
  set areatime2(String? value) => setField<String>('areatime2', value);

  String? get areatime3 => getField<String>('areatime3');
  set areatime3(String? value) => setField<String>('areatime3', value);

  int? get exclude => getField<int>('exclude');
  set exclude(int? value) => setField<int>('exclude', value);

  int? get entryid => getField<int>('entryid');
  set entryid(int? value) => setField<int>('entryid', value);

  int? get trialidFk => getField<int>('trialid_fk');
  set trialidFk(int? value) => setField<int>('trialid_fk', value);

  int? get classidFk => getField<int>('classid_fk');
  set classidFk(int? value) => setField<int>('classid_fk', value);

  String? get score => getField<String>('score');
  set score(String? value) => setField<String>('score', value);

  String? get timeLimit => getField<String>('time_limit');
  set timeLimit(String? value) => setField<String>('time_limit', value);

  String? get timeLimit2 => getField<String>('time_limit2');
  set timeLimit2(String? value) => setField<String>('time_limit2', value);

  String? get timeLimit3 => getField<String>('time_limit3');
  set timeLimit3(String? value) => setField<String>('time_limit3', value);

  int? get areas => getField<int>('areas');
  set areas(int? value) => setField<int>('areas', value);

  int? get pendingCount => getField<int>('pending_count');
  set pendingCount(int? value) => setField<int>('pending_count', value);

  int? get completedCount => getField<int>('completed_count');
  set completedCount(int? value) => setField<int>('completed_count', value);

  int? get totalCount => getField<int>('total_count');
  set totalCount(int? value) => setField<int>('total_count', value);

  String? get judgeName => getField<String>('judge_name');
  set judgeName(String? value) => setField<String>('judge_name', value);

  bool? get selfCheckin => getField<bool>('self_checkin');
  set selfCheckin(bool? value) => setField<bool>('self_checkin', value);

  bool? get realtimeResults => getField<bool>('realtime_results');
  set realtimeResults(bool? value) => setField<bool>('realtime_results', value);

  String? get trialType => getField<String>('trial_type');
  set trialType(String? value) => setField<String>('trial_type', value);

  String? get fastcatBlock => getField<String>('fastcat_block');
  set fastcatBlock(String? value) => setField<String>('fastcat_block', value);

  String? get fastcatHandicap => getField<String>('fastcat_handicap');
  set fastcatHandicap(String? value) =>
      setField<String>('fastcat_handicap', value);

  String? get fastcatMph => getField<String>('fastcat_mph');
  set fastcatMph(String? value) => setField<String>('fastcat_mph', value);

  bool? get fastcatHealthStatus => getField<bool>('fastcat_health_status');
  set fastcatHealthStatus(bool? value) =>
      setField<bool>('fastcat_health_status', value);

  PostgresTime? get fastcatHealthTimestamp =>
      getField<PostgresTime>('fastcat_health_timestamp');
  set fastcatHealthTimestamp(PostgresTime? value) =>
      setField<PostgresTime>('fastcat_health_timestamp', value);
}
