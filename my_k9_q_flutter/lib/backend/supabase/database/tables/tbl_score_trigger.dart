import '../database.dart';

class TblScoreTriggerTable extends SupabaseTable<TblScoreTriggerRow> {
  @override
  String get tableName => 'tbl_score_trigger';

  @override
  TblScoreTriggerRow createRow(Map<String, dynamic> data) =>
      TblScoreTriggerRow(data);
}

class TblScoreTriggerRow extends SupabaseDataRow {
  TblScoreTriggerRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblScoreTriggerTable();

  int get id => getField<int>('id')!;
  set id(int value) => setField<int>('id', value);

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
}
