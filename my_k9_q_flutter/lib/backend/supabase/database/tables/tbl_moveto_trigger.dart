import '../database.dart';

class TblMovetoTriggerTable extends SupabaseTable<TblMovetoTriggerRow> {
  @override
  String get tableName => 'tbl_moveto_trigger';

  @override
  TblMovetoTriggerRow createRow(Map<String, dynamic> data) =>
      TblMovetoTriggerRow(data);
}

class TblMovetoTriggerRow extends SupabaseDataRow {
  TblMovetoTriggerRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblMovetoTriggerTable();

  int get id => getField<int>('id')!;
  set id(int value) => setField<int>('id', value);

  DateTime get createdAt => getField<DateTime>('created_at')!;
  set createdAt(DateTime value) => setField<DateTime>('created_at', value);

  String? get mobileAppLicKey => getField<String>('mobile_app_lic_key');
  set mobileAppLicKey(String? value) =>
      setField<String>('mobile_app_lic_key', value);

  int? get classidFk => getField<int>('classid_fk');
  set classidFk(int? value) => setField<int>('classid_fk', value);

  int? get entryidFk => getField<int>('entryid_fk');
  set entryidFk(int? value) => setField<int>('entryid_fk', value);

  String? get moveto => getField<String>('moveto');
  set moveto(String? value) => setField<String>('moveto', value);
}
