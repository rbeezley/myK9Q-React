import '../database.dart';

class TblEntryQueueTable extends SupabaseTable<TblEntryQueueRow> {
  @override
  String get tableName => 'tbl_entry_queue';

  @override
  TblEntryQueueRow createRow(Map<String, dynamic> data) =>
      TblEntryQueueRow(data);
}

class TblEntryQueueRow extends SupabaseDataRow {
  TblEntryQueueRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblEntryQueueTable();

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

  String get section => getField<String>('section')!;
  set section(String value) => setField<String>('section', value);

  int get armband => getField<int>('armband')!;
  set armband(int value) => setField<int>('armband', value);

  String? get callName => getField<String>('call_name');
  set callName(String? value) => setField<String>('call_name', value);

  String? get breed => getField<String>('breed');
  set breed(String? value) => setField<String>('breed', value);

  String get handler => getField<String>('handler')!;
  set handler(String value) => setField<String>('handler', value);

  int get checkinStatus => getField<int>('checkin_status')!;
  set checkinStatus(int value) => setField<int>('checkin_status', value);

  String get resultText => getField<String>('result_text')!;
  set resultText(String value) => setField<String>('result_text', value);

  String get searchTime => getField<String>('search_time')!;
  set searchTime(String value) => setField<String>('search_time', value);

  int get faultCount => getField<int>('fault_count')!;
  set faultCount(int value) => setField<int>('fault_count', value);

  int get exhibitorOrder => getField<int>('exhibitor_order')!;
  set exhibitorOrder(int value) => setField<int>('exhibitor_order', value);

  int get placement => getField<int>('placement')!;
  set placement(int value) => setField<int>('placement', value);

  bool get inRing => getField<bool>('in_ring')!;
  set inRing(bool value) => setField<bool>('in_ring', value);

  bool get isScored => getField<bool>('is_scored')!;
  set isScored(bool value) => setField<bool>('is_scored', value);

  String get trialDateText => getField<String>('trial_date_text')!;
  set trialDateText(String value) => setField<String>('trial_date_text', value);

  String get sectionGrouped => getField<String>('section_grouped')!;
  set sectionGrouped(String value) =>
      setField<String>('section_grouped', value);

  int get runOrder => getField<int>('run_order')!;
  set runOrder(int value) => setField<int>('run_order', value);

  String? get reason => getField<String>('reason');
  set reason(String? value) => setField<String>('reason', value);

  String get areatime1 => getField<String>('areatime1')!;
  set areatime1(String value) => setField<String>('areatime1', value);

  String get areatime2 => getField<String>('areatime2')!;
  set areatime2(String value) => setField<String>('areatime2', value);

  String get areatime3 => getField<String>('areatime3')!;
  set areatime3(String value) => setField<String>('areatime3', value);

  int get exclude => getField<int>('exclude')!;
  set exclude(int value) => setField<int>('exclude', value);

  int? get entryid => getField<int>('entryid');
  set entryid(int? value) => setField<int>('entryid', value);

  int? get trialidFk => getField<int>('trialid_fk');
  set trialidFk(int? value) => setField<int>('trialid_fk', value);

  int? get classidFk => getField<int>('classid_fk');
  set classidFk(int? value) => setField<int>('classid_fk', value);

  int? get showidFk => getField<int>('showid_fk');
  set showidFk(int? value) => setField<int>('showid_fk', value);

  String? get score => getField<String>('score');
  set score(String? value) => setField<String>('score', value);

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

  String? get fastcatHealthComment =>
      getField<String>('fastcat_health_comment');
  set fastcatHealthComment(String? value) =>
      setField<String>('fastcat_health_comment', value);

  int get sortOrder => getField<int>('sort_order')!;
  set sortOrder(int value) => setField<int>('sort_order', value);

  int? get correctCount => getField<int>('correct_count');
  set correctCount(int? value) => setField<int>('correct_count', value);

  int? get incorrectCount => getField<int>('incorrect_count');
  set incorrectCount(int? value) => setField<int>('incorrect_count', value);

  int? get noFinish => getField<int>('no_finish');
  set noFinish(int? value) => setField<int>('no_finish', value);
}
