import '../database.dart';

class ViewUniqueArmbandsTable extends SupabaseTable<ViewUniqueArmbandsRow> {
  @override
  String get tableName => 'view_unique_armbands';

  @override
  ViewUniqueArmbandsRow createRow(Map<String, dynamic> data) =>
      ViewUniqueArmbandsRow(data);
}

class ViewUniqueArmbandsRow extends SupabaseDataRow {
  ViewUniqueArmbandsRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => ViewUniqueArmbandsTable();

  String? get mobileAppLicKey => getField<String>('mobile_app_lic_key');
  set mobileAppLicKey(String? value) =>
      setField<String>('mobile_app_lic_key', value);

  int? get armband => getField<int>('armband');
  set armband(int? value) => setField<int>('armband', value);

  String? get callName => getField<String>('call_name');
  set callName(String? value) => setField<String>('call_name', value);

  String? get breed => getField<String>('breed');
  set breed(String? value) => setField<String>('breed', value);

  String? get handler => getField<String>('handler');
  set handler(String? value) => setField<String>('handler', value);
}
