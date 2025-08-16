import '../database.dart';

class TblLogsTable extends SupabaseTable<TblLogsRow> {
  @override
  String get tableName => 'tbl_logs';

  @override
  TblLogsRow createRow(Map<String, dynamic> data) => TblLogsRow(data);
}

class TblLogsRow extends SupabaseDataRow {
  TblLogsRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblLogsTable();

  int get id => getField<int>('id')!;
  set id(int value) => setField<int>('id', value);

  DateTime get createdAt => getField<DateTime>('created_at')!;
  set createdAt(DateTime value) => setField<DateTime>('created_at', value);

  String? get mobileAppLicKey => getField<String>('mobile_app_lic_key');
  set mobileAppLicKey(String? value) =>
      setField<String>('mobile_app_lic_key', value);

  String? get tableNameField => getField<String>('table_name');
  set tableNameField(String? value) => setField<String>('table_name', value);

  String? get operation => getField<String>('operation');
  set operation(String? value) => setField<String>('operation', value);

  dynamic get oldData => getField<dynamic>('old_data');
  set oldData(dynamic value) => setField<dynamic>('old_data', value);

  dynamic get newData => getField<dynamic>('new_data');
  set newData(dynamic value) => setField<dynamic>('new_data', value);

  String? get uuid => getField<String>('uuid');
  set uuid(String? value) => setField<String>('uuid', value);
}
