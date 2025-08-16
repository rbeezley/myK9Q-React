import '../database.dart';

class TblNotificationsTable extends SupabaseTable<TblNotificationsRow> {
  @override
  String get tableName => 'tbl_notifications';

  @override
  TblNotificationsRow createRow(Map<String, dynamic> data) =>
      TblNotificationsRow(data);
}

class TblNotificationsRow extends SupabaseDataRow {
  TblNotificationsRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblNotificationsTable();

  int get id => getField<int>('id')!;
  set id(int value) => setField<int>('id', value);

  DateTime get createdAt => getField<DateTime>('created_at')!;
  set createdAt(DateTime value) => setField<DateTime>('created_at', value);

  String? get mobileAppLicKey => getField<String>('mobile_app_lic_key');
  set mobileAppLicKey(String? value) =>
      setField<String>('mobile_app_lic_key', value);

  String? get title => getField<String>('title');
  set title(String? value) => setField<String>('title', value);

  String? get description => getField<String>('description');
  set description(String? value) => setField<String>('description', value);
}
